import { graphExists, readGraph } from "../graph/store.js";
import type { KnowledgeGraph } from "../graph/types.js";
import * as ui from "./ui.js";

function formatMarkdown(graph: KnowledgeGraph): string {
  const lines: string[] = [];
  lines.push("# Knowledge Graph\n");

  lines.push(`## Nodes (${graph.nodes.length})\n`);
  lines.push("| ID | Type | Name | Sources |");
  lines.push("|---|---|---|---|");
  for (const node of graph.nodes) {
    const sources = node.source_documents.join(", ");
    lines.push(
      `| \`${node.id}\` | ${node.type} | ${node.name} | ${sources} |`,
    );
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

function formatDot(graph: KnowledgeGraph): string {
  const lines: string[] = [];
  lines.push("digraph KnowledgeGraph {");
  lines.push("  rankdir=LR;");
  lines.push(
    '  node [shape=box, style="rounded,filled", fontname="sans-serif"];',
  );
  lines.push('  edge [fontname="sans-serif", fontsize=10];');
  lines.push("");

  for (const node of graph.nodes) {
    lines.push(
      `  "${node.id}" [label="${node.name}\\n(${node.type})"];`,
    );
  }

  lines.push("");
  for (const edge of graph.edges) {
    lines.push(`  "${edge.from}" -> "${edge.to}" [label="${edge.type}"];`);
  }

  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

export async function exportCommand(options: {
  format?: string;
}): Promise<void> {
  try {
    const exists = await graphExists();
    if (!exists) {
      console.error(
        ui.err("No graph found. Run 'kg build <folder>' first."),
      );
      process.exitCode = 1;
      return;
    }

    const graph = await readGraph();
    const format = options.format ?? "json";

    switch (format) {
      case "markdown":
        process.stdout.write(formatMarkdown(graph));
        break;
      case "dot":
        process.stdout.write(formatDot(graph));
        break;
      case "json":
        process.stdout.write(JSON.stringify(graph, null, 2) + "\n");
        break;
      default:
        console.error(
          ui.err(`Unknown format '${format}'. Use: json, markdown, or dot`),
        );
        process.exitCode = 1;
    }
  } catch (err) {
    console.error(
      ui.err(`Error: ${err instanceof Error ? err.message : err}`),
    );
    process.exitCode = 1;
  }
}
