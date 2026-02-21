import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, ExtractionResult, QueryResult } from "./interface.js";
import type { KnowledgeGraph } from "../graph/types.js";
import { buildExtractionPrompt, buildQueryPrompt } from "./prompts.js";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

function stripCodeFences(text: string): string {
  return text
    .replace(/^\s*```(?:json)?\s*\n?/, "")
    .replace(/\n?\s*```\s*$/, "")
    .trim();
}

function parseJsonResponse<T>(raw: string): T {
  const cleaned = stripCodeFences(raw);
  return JSON.parse(cleaned) as T;
}

export class ClaudeLLMProvider implements LLMProvider {
  private client: Anthropic;
  private model: string;

  constructor(model?: string) {
    this.client = new Anthropic();
    this.model = model ?? DEFAULT_MODEL;
  }

  async extractEntities(
    text: string,
    sourceDocument: string,
  ): Promise<ExtractionResult> {
    const { system, user } = buildExtractionPrompt(text, sourceDocument);

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    try {
      const result = parseJsonResponse<ExtractionResult>(content.text);
      if (!Array.isArray(result.entities)) result.entities = [];
      if (!Array.isArray(result.relationships)) result.relationships = [];
      return result;
    } catch {
      console.error(
        `Warning: Failed to parse extraction response for "${sourceDocument}". Returning empty result.`,
      );
      return { entities: [], relationships: [] };
    }
  }

  async queryGraph(
    graph: KnowledgeGraph,
    question: string,
  ): Promise<QueryResult> {
    const { system, user } = buildQueryPrompt(graph, question);

    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const result = parseJsonResponse<QueryResult>(content.text);
    if (typeof result.answer !== "string") {
      throw new Error("Invalid query response: missing answer field");
    }
    if (!Array.isArray(result.usedNodeIds)) {
      result.usedNodeIds = [];
    }
    return result;
  }
}

export function createLLMProvider(model?: string): LLMProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is required. " +
        "Get your key at https://console.anthropic.com/",
    );
  }
  return new ClaudeLLMProvider(model);
}
