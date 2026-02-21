import type {
  KnowledgeGraph,
  GraphNode,
  GraphEdge,
  EntityType,
} from "./types.js";
import { makeNodeId } from "./types.js";

export function resolveEntities(graph: KnowledgeGraph): KnowledgeGraph {
  // Deduplicate nodes by ID (which is deterministic from type+name)
  const nodeMap = new Map<string, GraphNode>();

  for (const node of graph.nodes) {
    const existing = nodeMap.get(node.id);
    if (existing) {
      // Merge source_documents
      const docs = new Set([
        ...existing.source_documents,
        ...node.source_documents,
      ]);
      existing.source_documents = [...docs].sort();
    } else {
      nodeMap.set(node.id, { ...node, source_documents: [...node.source_documents] });
    }
  }

  // Deduplicate edges by (from, to, type, source_document)
  const edgeSet = new Set<string>();
  const uniqueEdges: GraphEdge[] = [];

  for (const edge of graph.edges) {
    const key = `${edge.from}|${edge.to}|${edge.type}|${edge.source_document}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      uniqueEdges.push({ ...edge });
    }
  }

  return {
    nodes: [...nodeMap.values()],
    edges: uniqueEdges,
  };
}

export function mergeGraphs(
  existing: KnowledgeGraph,
  incoming: KnowledgeGraph,
): KnowledgeGraph {
  const combined: KnowledgeGraph = {
    nodes: [...existing.nodes, ...incoming.nodes],
    edges: [...existing.edges, ...incoming.edges],
  };
  return resolveEntities(combined);
}

/**
 * Convert raw LLM extraction output into typed graph objects.
 * Validates entity types and relationship types against the ontology.
 * Returns only valid nodes and edges.
 */
export function processExtraction(
  entities: Array<{ type: string; name: string }>,
  relationships: Array<{ from: string; to: string; type: string }>,
  sourceDocument: string,
  validEntityTypes: readonly string[],
  validRelationshipTypes: readonly string[],
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const nameToId = new Map<string, string>();

  for (const entity of entities) {
    if (!validEntityTypes.includes(entity.type)) {
      console.error(
        `Warning: Skipping entity with invalid type "${entity.type}": ${entity.name}`,
      );
      continue;
    }
    const entityType = entity.type as EntityType;
    const id = makeNodeId(entityType, entity.name);
    nodes.push({
      id,
      type: entityType,
      name: entity.name,
      source_documents: [sourceDocument],
    });
    nameToId.set(entity.name.toLowerCase(), id);
  }

  const edges: GraphEdge[] = [];
  for (const rel of relationships) {
    if (!validRelationshipTypes.includes(rel.type)) {
      console.error(
        `Warning: Skipping relationship with invalid type "${rel.type}"`,
      );
      continue;
    }
    const fromId = nameToId.get(rel.from.toLowerCase());
    const toId = nameToId.get(rel.to.toLowerCase());
    if (!fromId || !toId) {
      console.error(
        `Warning: Skipping relationship "${rel.from}" -> "${rel.to}": entity not found`,
      );
      continue;
    }
    edges.push({
      from: fromId,
      to: toId,
      type: rel.type as GraphEdge["type"],
      source_document: sourceDocument,
    });
  }

  return { nodes, edges };
}
