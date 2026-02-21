import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractFromDocuments } from "../src/pipeline/extractor.js";
import type { LLMProvider, ExtractionResult, QueryResult } from "../src/llm/interface.js";
import type { KnowledgeGraph } from "../src/graph/types.js";

class MockLLMProvider implements LLMProvider {
  private responses: Map<string, ExtractionResult>;

  constructor(responses: Record<string, ExtractionResult>) {
    this.responses = new Map(Object.entries(responses));
  }

  async extractEntities(
    _text: string,
    sourceDocument: string,
  ): Promise<ExtractionResult> {
    return (
      this.responses.get(sourceDocument) ?? { entities: [], relationships: [] }
    );
  }

  async queryGraph(
    _graph: KnowledgeGraph,
    _question: string,
  ): Promise<QueryResult> {
    return { answer: "mock answer", usedNodeIds: [] };
  }
}

describe("extractFromDocuments", () => {
  it("extracts entities from multiple documents and resolves them", async () => {
    const llm = new MockLLMProvider({
      "team.md": {
        entities: [
          { type: "Person", name: "Alice Chen" },
          { type: "Project", name: "Project Phoenix" },
        ],
        relationships: [
          { from: "Alice Chen", to: "Project Phoenix", type: "works_on" },
        ],
      },
      "decisions.md": {
        entities: [
          { type: "Person", name: "Alice Chen" },
          { type: "Decision", name: "Adopt GraphQL" },
        ],
        relationships: [
          { from: "Alice Chen", to: "Adopt GraphQL", type: "decided" },
        ],
      },
    });

    const documents = [
      { filePath: "team.md", content: "Team content" },
      { filePath: "decisions.md", content: "Decision content" },
    ];

    const graph = await extractFromDocuments(documents, llm);

    // Alice Chen should appear once (resolved from 2 documents)
    const aliceNodes = graph.nodes.filter(
      (n) => n.id === "person::alice_chen",
    );
    assert.equal(aliceNodes.length, 1);
    assert.deepEqual(aliceNodes[0].source_documents, [
      "decisions.md",
      "team.md",
    ]);

    // Should have 3 unique nodes total
    assert.equal(graph.nodes.length, 3);

    // Should have 2 edges
    assert.equal(graph.edges.length, 2);
  });

  it("handles empty extraction results gracefully", async () => {
    const llm = new MockLLMProvider({});

    const documents = [
      { filePath: "empty.md", content: "No entities here" },
    ];

    const graph = await extractFromDocuments(documents, llm);
    assert.equal(graph.nodes.length, 0);
    assert.equal(graph.edges.length, 0);
  });

  it("filters out invalid entity types from LLM output", async () => {
    const llm = new MockLLMProvider({
      "test.md": {
        entities: [
          { type: "Person", name: "Alice" },
          { type: "InvalidType", name: "Something" },
        ],
        relationships: [],
      },
    });

    const documents = [{ filePath: "test.md", content: "content" }];

    const graph = await extractFromDocuments(documents, llm);
    assert.equal(graph.nodes.length, 1);
    assert.equal(graph.nodes[0].type, "Person");
  });

  it("continues processing when one document fails", async () => {
    const failingLlm: LLMProvider = {
      async extractEntities(_text: string, sourceDocument: string) {
        if (sourceDocument === "bad.md") {
          throw new Error("LLM API error");
        }
        return {
          entities: [{ type: "Person", name: "Bob" }],
          relationships: [],
        };
      },
      async queryGraph() {
        return { answer: "", usedNodeIds: [] };
      },
    };

    const documents = [
      { filePath: "bad.md", content: "will fail" },
      { filePath: "good.md", content: "will succeed" },
    ];

    const graph = await extractFromDocuments(documents, failingLlm);
    assert.equal(graph.nodes.length, 1);
    assert.equal(graph.nodes[0].name, "Bob");
  });
});
