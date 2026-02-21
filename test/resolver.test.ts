import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveEntities,
  mergeGraphs,
  processExtraction,
} from "../src/graph/resolver.js";
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from "../src/graph/types.js";
import type { KnowledgeGraph, GraphNode, GraphEdge } from "../src/graph/types.js";

describe("resolveEntities", () => {
  it("deduplicates nodes with the same ID and merges source_documents", () => {
    const graph: KnowledgeGraph = {
      nodes: [
        {
          id: "person::alice_chen",
          type: "Person",
          name: "Alice Chen",
          source_documents: ["team.md"],
        },
        {
          id: "person::alice_chen",
          type: "Person",
          name: "Alice Chen",
          source_documents: ["decisions.md"],
        },
      ],
      edges: [],
    };

    const result = resolveEntities(graph);
    assert.equal(result.nodes.length, 1);
    assert.deepEqual(result.nodes[0].source_documents, [
      "decisions.md",
      "team.md",
    ]);
  });

  it("deduplicates edges by (from, to, type, source_document)", () => {
    const edge: GraphEdge = {
      from: "person::alice_chen",
      to: "project::phoenix",
      type: "works_on",
      source_document: "team.md",
    };

    const graph: KnowledgeGraph = {
      nodes: [],
      edges: [edge, { ...edge }, edge],
    };

    const result = resolveEntities(graph);
    assert.equal(result.edges.length, 1);
  });

  it("keeps edges with different source_documents", () => {
    const graph: KnowledgeGraph = {
      nodes: [],
      edges: [
        {
          from: "person::alice_chen",
          to: "project::phoenix",
          type: "works_on",
          source_document: "team.md",
        },
        {
          from: "person::alice_chen",
          to: "project::phoenix",
          type: "works_on",
          source_document: "decisions.md",
        },
      ],
    };

    const result = resolveEntities(graph);
    assert.equal(result.edges.length, 2);
  });
});

describe("mergeGraphs", () => {
  it("merges two graphs and resolves entities", () => {
    const g1: KnowledgeGraph = {
      nodes: [
        {
          id: "person::alice_chen",
          type: "Person",
          name: "Alice Chen",
          source_documents: ["team.md"],
        },
      ],
      edges: [],
    };

    const g2: KnowledgeGraph = {
      nodes: [
        {
          id: "person::alice_chen",
          type: "Person",
          name: "Alice Chen",
          source_documents: ["decisions.md"],
        },
        {
          id: "project::phoenix",
          type: "Project",
          name: "Phoenix",
          source_documents: ["decisions.md"],
        },
      ],
      edges: [
        {
          from: "person::alice_chen",
          to: "project::phoenix",
          type: "works_on",
          source_document: "decisions.md",
        },
      ],
    };

    const result = mergeGraphs(g1, g2);
    assert.equal(result.nodes.length, 2);
    assert.equal(result.edges.length, 1);

    const alice = result.nodes.find((n) => n.id === "person::alice_chen");
    assert.ok(alice);
    assert.deepEqual(alice.source_documents, ["decisions.md", "team.md"]);
  });

  it("handles merging with an empty graph", () => {
    const empty: KnowledgeGraph = { nodes: [], edges: [] };
    const g: KnowledgeGraph = {
      nodes: [
        {
          id: "person::bob",
          type: "Person",
          name: "Bob",
          source_documents: ["a.md"],
        },
      ],
      edges: [],
    };

    const result = mergeGraphs(empty, g);
    assert.equal(result.nodes.length, 1);
  });
});

describe("processExtraction", () => {
  it("converts valid entities and relationships to graph objects", () => {
    const entities = [
      { type: "Person", name: "Alice Chen" },
      { type: "Project", name: "Phoenix" },
    ];
    const relationships = [
      { from: "Alice Chen", to: "Phoenix", type: "works_on" },
    ];

    const { nodes, edges } = processExtraction(
      entities,
      relationships,
      "test.md",
      ENTITY_TYPES,
      RELATIONSHIP_TYPES,
    );

    assert.equal(nodes.length, 2);
    assert.equal(edges.length, 1);
    assert.equal(nodes[0].id, "person::alice_chen");
    assert.equal(nodes[0].source_documents[0], "test.md");
    assert.equal(edges[0].from, "person::alice_chen");
    assert.equal(edges[0].to, "project::phoenix");
    assert.equal(edges[0].type, "works_on");
  });

  it("filters out entities with invalid types", () => {
    const entities = [
      { type: "Person", name: "Alice" },
      { type: "Animal", name: "Dog" },
    ];

    const { nodes } = processExtraction(
      entities,
      [],
      "test.md",
      ENTITY_TYPES,
      RELATIONSHIP_TYPES,
    );

    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].name, "Alice");
  });

  it("filters out relationships with invalid types", () => {
    const entities = [
      { type: "Person", name: "Alice" },
      { type: "Person", name: "Bob" },
    ];
    const relationships = [
      { from: "Alice", to: "Bob", type: "friends_with" },
    ];

    const { edges } = processExtraction(
      entities,
      relationships,
      "test.md",
      ENTITY_TYPES,
      RELATIONSHIP_TYPES,
    );

    assert.equal(edges.length, 0);
  });

  it("skips relationships referencing unknown entities", () => {
    const entities = [{ type: "Person", name: "Alice" }];
    const relationships = [
      { from: "Alice", to: "Unknown Project", type: "works_on" },
    ];

    const { edges } = processExtraction(
      entities,
      relationships,
      "test.md",
      ENTITY_TYPES,
      RELATIONSHIP_TYPES,
    );

    assert.equal(edges.length, 0);
  });
});
