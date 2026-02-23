import { graphExists, readGraph } from "../graph/store.js";
import type { KnowledgeGraph } from "../graph/types.js";

function formatStats(graph: KnowledgeGraph): string {
  const lines: string[] = [];

  lines.push(`Nodes: ${graph.nodes.length}`);
  lines.push(`Edges: ${graph.edges.length}`);

  if (graph.nodes.length === 0) {
    return lines.join("\n");
  }

  // Count by entity type
  const typeCounts = new Map<string, number>();
  for (const node of graph.nodes) {
    typeCounts.set(node.type, (typeCounts.get(node.type) ?? 0) + 1);
  }
  lines.push("");
  lines.push("By type:");
  for (const [type, count] of [...typeCounts.entries()].sort()) {
    lines.push(`  ${type}: ${count}`);
  }

  // Count by relationship type
  const relCounts = new Map<string, number>();
  for (const edge of graph.edges) {
    relCounts.set(edge.type, (relCounts.get(edge.type) ?? 0) + 1);
  }
  if (relCounts.size > 0) {
    lines.push("");
    lines.push("Relationships:");
    for (const [type, count] of [...relCounts.entries()].sort()) {
      lines.push(`  ${type}: ${count}`);
    }
  }

  // Source documents
  const sources = new Set<string>();
  for (const node of graph.nodes) {
    for (const src of node.source_documents) {
      sources.add(src);
    }
  }
  if (sources.size > 0) {
    lines.push("");
    lines.push(`Sources: ${sources.size} document(s)`);
    for (const src of [...sources].sort()) {
      lines.push(`  ${src}`);
    }
  }

  // Most connected nodes
  const connectionCount = new Map<string, number>();
  for (const edge of graph.edges) {
    connectionCount.set(
      edge.from,
      (connectionCount.get(edge.from) ?? 0) + 1,
    );
    connectionCount.set(edge.to, (connectionCount.get(edge.to) ?? 0) + 1);
  }
  const topNodes = [...connectionCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  if (topNodes.length > 0) {
    lines.push("");
    lines.push("Most connected:");
    for (const [id, count] of topNodes) {
      const node = graph.nodes.find((n) => n.id === id);
      const name = node ? node.name : id;
      lines.push(`  ${name}: ${count} connections`);
    }
  }

  return lines.join("\n");
}

export async function statsCommand(): Promise<void> {
  try {
    const exists = await graphExists();
    if (!exists) {
      console.error("No graph found. Run 'kg build <folder>' first.");
      process.exitCode = 1;
      return;
    }

    const graph = await readGraph();
    console.log(formatStats(graph));
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  }
}
