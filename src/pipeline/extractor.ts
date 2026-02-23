import type { KnowledgeGraph } from "../graph/types.js";
import { ENTITY_TYPES, RELATIONSHIP_TYPES } from "../graph/types.js";
import { emptyGraph } from "../graph/store.js";
import { mergeGraphs, processExtraction } from "../graph/resolver.js";
import type { LLMProvider } from "../llm/interface.js";
import type { LoadedDocument } from "./loader.js";

export async function extractFromDocuments(
  documents: LoadedDocument[],
  llm: LLMProvider,
  existingGraph?: KnowledgeGraph,
): Promise<KnowledgeGraph> {
  let graph = existingGraph ?? emptyGraph();
  const total = documents.length;

  for (let i = 0; i < total; i++) {
    const doc = documents[i];
    const label = `[${i + 1}/${total}]`;

    try {
      console.error(`${label} Extracting from ${doc.filePath}...`);
      const result = await llm.extractEntities(doc.content, doc.filePath);

      const { nodes, edges } = processExtraction(
        result.entities,
        result.relationships,
        doc.filePath,
        ENTITY_TYPES,
        RELATIONSHIP_TYPES,
      );

      console.error(
        `${label} Found ${nodes.length} entities, ${edges.length} relationships`,
      );

      graph = mergeGraphs(graph, { nodes, edges });
    } catch (err) {
      console.error(
        `${label} Warning: Failed to extract from ${doc.filePath}: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  return graph;
}
