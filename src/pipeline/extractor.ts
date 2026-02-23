import type { KnowledgeGraph } from "../graph/types.js";
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from "../graph/types.js";
import { emptyGraph } from "../graph/store.js";
import { mergeGraphs, processExtraction } from "../graph/resolver.js";
import type { LLMProvider } from "../llm/interface.js";
import type { LoadedDocument } from "./loader.js";
import * as ui from "../cli/ui.js";

export async function extractFromDocuments(
  documents: LoadedDocument[],
  llm: LLMProvider,
  existingGraph?: KnowledgeGraph,
): Promise<KnowledgeGraph> {
  let graph = existingGraph ?? emptyGraph();
  const total = documents.length;

  for (let i = 0; i < total; i++) {
    const doc = documents[i];

    try {
      console.error(ui.progress(i + 1, total, `Extracting from ${ui.accent(doc.filePath)}...`));
      const result = await llm.extractEntities(doc.content, doc.filePath);

      const { nodes, edges } = processExtraction(
        result.entities,
        result.relationships,
        doc.filePath,
        ENTITY_TYPES,
        RELATIONSHIP_TYPES,
      );

      // Show discovered entities in tree format
      for (const node of nodes) {
        console.error(ui.treeNode(node.name, node.type));
      }
      console.error(ui.treeSummary(doc.filePath, nodes.length, edges.length));

      graph = mergeGraphs(graph, { nodes, edges });
    } catch (err) {
      console.error(
        `${ui.brand("│")} ${ui.err("✗")} Failed: ${doc.filePath}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  return graph;
}
