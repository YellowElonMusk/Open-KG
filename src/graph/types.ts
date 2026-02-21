export const ENTITY_TYPES = [
  "Person",
  "Project",
  "Task",
  "Decision",
  "Organization",
  "Document",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const RELATIONSHIP_TYPES = [
  "works_on",
  "owns",
  "assigned_to",
  "decided",
  "mentioned_in",
  "depends_on",
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export interface GraphNode {
  id: string;
  type: EntityType;
  name: string;
  source_documents: string[];
}

export interface GraphEdge {
  from: string;
  to: string;
  type: RelationshipType;
  source_document: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function makeNodeId(type: EntityType, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
  return `${type.toLowerCase()}::${slug}`;
}
