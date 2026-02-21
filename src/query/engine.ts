import type { KnowledgeGraph, GraphNode } from "../graph/types.js";
import type { LLMProvider } from "../llm/interface.js";

export interface QueryResponse {
  answer: string;
  usedNodes: GraphNode[];
}

export async function executeQuery(
  graph: KnowledgeGraph,
  question: string,
  llm: LLMProvider,
): Promise<QueryResponse> {
  const result = await llm.queryGraph(graph, question);

  const usedNodes = result.usedNodeIds
    .map((id) => graph.nodes.find((n) => n.id === id))
    .filter((n): n is GraphNode => n !== undefined);

  return {
    answer: result.answer,
    usedNodes,
  };
}
