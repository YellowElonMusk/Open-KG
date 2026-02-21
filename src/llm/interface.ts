import type { KnowledgeGraph } from "../graph/types.js";

export interface ExtractionResult {
  entities: Array<{ type: string; name: string }>;
  relationships: Array<{ from: string; to: string; type: string }>;
}

export interface QueryResult {
  answer: string;
  usedNodeIds: string[];
}

export interface LLMProvider {
  extractEntities(
    text: string,
    sourceDocument: string,
  ): Promise<ExtractionResult>;
  queryGraph(graph: KnowledgeGraph, question: string): Promise<QueryResult>;
}
