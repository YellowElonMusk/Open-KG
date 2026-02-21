import { graphExists, readGraph } from "../graph/store.js";
import type { KnowledgeGraph } from "../graph/types.js";

function formatMarkdown(graph: KnowledgeGraph): string {
  const lines: string[] = [];
  lines.push("# Knowledge Graph\n");

  lines.push(`## Nodes (${graph.nodes.length})\n`);
  lines.push("| ID | Type | Name | Sources |");
  lines.push("|---|---|---|---|");
  for (const node of graph.nodes) {
    const sources = node.source_documents.join(", ");
    lines.push(`| \`${node.id}\` | ${node.type} | ${node.name} | ${sources} |`);
  }

  lines.push("");
  lines.push(`## Edges (${graph.edges.length})\n`);
  lines.push("| From | To | Type | Source |");
  lines.push("|---|---|---|---|");
  for (const edge of graph.edges) {
    lines.push(
      `| \`${edge.from}\` | \`${edge.to}\` | ${edge.type} | ${edge.source_document} |`,
    );
  }

  lines.push("");
  return lines.join("\n");
}

export async function exportCommand(options: {
  format?: string;
}): Promise<void> {
  try {
    const exists = await graphExists();
    if (!exists) {
      console.error("Error: No graph found. Run 'kg build <folder>' first.");
      process.exitCode = 1;
      return;
    }

    const graph = await readGraph();
    const format = options.format ?? "json";

    if (format === "markdown") {
      process.stdout.write(formatMarkdown(graph));
    } else {
      process.stdout.write(JSON.stringify(graph, null, 2) + "\n");
    }
  } catch (err) {
    console.error(
      `Error: ${err instanceof Error ? err.message : err}`,
    );
    process.exitCode = 1;
  }
}
