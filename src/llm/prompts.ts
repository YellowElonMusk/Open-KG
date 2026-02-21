import { ENTITY_TYPES, RELATIONSHIP_TYPES } from "../graph/types.js";
import type { KnowledgeGraph } from "../graph/types.js";

export function buildExtractionPrompt(
  text: string,
  sourceDocument: string,
): { system: string; user: string } {
  const entityList = ENTITY_TYPES.join(", ");
  const relList = RELATIONSHIP_TYPES.join(", ");

  const system = `You are a knowledge graph extraction engine. Given a document, extract entities and relationships.

Valid entity types: ${entityList}
Valid relationship types: ${relList}

Return ONLY valid JSON in this exact format, no markdown fences, no explanation:
{
  "entities": [{"type": "<EntityType>", "name": "<canonical entity name>"}],
  "relationships": [{"from": "<entity name>", "to": "<entity name>", "type": "<RelationshipType>"}]
}

Rules:
- Use ONLY the entity types and relationship types listed above.
- Use the most specific canonical name for each entity (e.g., "Alice Chen" not "Alice").
- Relationship from/to fields must reference entity names exactly as they appear in your entities array.
- Every entity referenced in a relationship must also appear in the entities array.
- If no entities or relationships are found, return empty arrays.`;

  const user = `Extract entities and relationships from this document.

Source: "${sourceDocument}"
---
${text}
---`;

  return { system, user };
}

export function buildQueryPrompt(
  graph: KnowledgeGraph,
  question: string,
): { system: string; user: string } {
  const graphJson = JSON.stringify(graph, null, 2);

  const system = `You are a knowledge graph query engine. Answer questions using ONLY the information in the provided knowledge graph. If the graph does not contain enough information, say so.

Return ONLY valid JSON in this exact format, no markdown fences, no explanation:
{
  "answer": "<your detailed answer>",
  "usedNodeIds": ["<node_id_1>", "<node_id_2>"]
}

The usedNodeIds must be actual node IDs from the graph that you referenced in your answer.`;

  const user = `Knowledge Graph:
${graphJson}

Question: ${question}`;

  return { system, user };
}
