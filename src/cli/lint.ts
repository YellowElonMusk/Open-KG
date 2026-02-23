import { graphExists, readGraph } from "../graph/store.js";
import { loadDocuments } from "../pipeline/loader.js";
import type { KnowledgeGraph } from "../graph/types.js";
import * as ui from "./ui.js";

interface LintResult {
  score: number;
  issues: Array<{ severity: "warn" | "info"; message: string }>;
}

function lintGraph(graph: KnowledgeGraph): LintResult {
  const issues: LintResult["issues"] = [];
  let score = 100;

  if (graph.nodes.length === 0) {
    return { score: 0, issues: [{ severity: "warn", message: "Graph is empty. Run 'kg build <folder>' first." }] };
  }

  // Check for island nodes (no edges)
  const connectedIds = new Set<string>();
  for (const edge of graph.edges) {
    connectedIds.add(edge.from);
    connectedIds.add(edge.to);
  }
  const islands = graph.nodes.filter((n) => !connectedIds.has(n.id));
  for (const island of islands) {
    issues.push({
      severity: "warn",
      message: `Entity '${island.name}' (${island.type}) is an island. Connect it to a 'Person' or 'Decision' node to increase Graph IQ.`,
    });
    score -= 5;
  }

  // Check for single-source entities (only appear in one document)
  const singleSource = graph.nodes.filter(
    (n) => n.source_documents.length === 1,
  );
  if (singleSource.length > graph.nodes.length * 0.7) {
    issues.push({
      severity: "info",
      message: `${singleSource.length}/${graph.nodes.length} entities appear in only one document. Cross-referencing improves graph density.`,
    });
    score -= 10;
  }

  // Check for entity type diversity
  const types = new Set(graph.nodes.map((n) => n.type));
  if (types.size < 3) {
    issues.push({
      severity: "warn",
      message: `Only ${types.size} entity type(s) found (${[...types].join(", ")}). Diverse types make queries more useful.`,
    });
    score -= 10;
  }

  // Check for relationship type diversity
  const relTypes = new Set(graph.edges.map((e) => e.type));
  if (graph.edges.length > 0 && relTypes.size < 2) {
    issues.push({
      severity: "info",
      message: `Only ${relTypes.size} relationship type(s) found. Multiple relationship types enable richer queries.`,
    });
    score -= 5;
  }

  // Check edge-to-node ratio
  if (graph.nodes.length > 2) {
    const ratio = graph.edges.length / graph.nodes.length;
    if (ratio < 1) {
      issues.push({
        severity: "warn",
        message: `Low edge/node ratio (${ratio.toFixed(1)}). Aim for at least 1.0 — most entities should connect to something.`,
      });
      score -= 10;
    }
  }

  // Check for Person nodes without relationships
  const personNodes = graph.nodes.filter((n) => n.type === "Person");
  const disconnectedPeople = personNodes.filter(
    (n) => !connectedIds.has(n.id),
  );
  if (disconnectedPeople.length > 0) {
    issues.push({
      severity: "warn",
      message: `${disconnectedPeople.length} Person node(s) have no relationships: ${disconnectedPeople.map((n) => n.name).join(", ")}`,
    });
    score -= disconnectedPeople.length * 3;
  }

  return { score: Math.max(0, Math.min(100, score)), issues };
}

function lintDocuments(
  docCount: number,
  graph: KnowledgeGraph,
): LintResult["issues"] {
  const issues: LintResult["issues"] = [];

  if (docCount === 0) {
    issues.push({
      severity: "warn",
      message: "No documents found. Add .md or .txt files to your folder.",
    });
    return issues;
  }

  // Source documents in graph
  const sources = new Set<string>();
  for (const node of graph.nodes) {
    for (const src of node.source_documents) {
      sources.add(src);
    }
  }

  if (sources.size < docCount && graph.nodes.length > 0) {
    issues.push({
      severity: "info",
      message: `${docCount - sources.size} document(s) produced no entities. Consider adding more structured content.`,
    });
  }

  return issues;
}

export async function lintCommand(
  folder?: string,
): Promise<void> {
  try {
    console.log(ui.header("Graph Readiness Lint"));

    const exists = await graphExists();
    let graph: KnowledgeGraph | null = null;

    if (exists) {
      graph = await readGraph();
    }

    // Lint documents if folder provided
    let docCount = 0;
    if (folder) {
      const documents = await loadDocuments(folder);
      docCount = documents.length;
      console.log(
        `${ui.brand("│")} Scanned ${ui.accent(String(docCount))} documents in ${folder}`,
      );

      if (graph && graph.nodes.length > 0) {
        const docIssues = lintDocuments(docCount, graph);
        for (const issue of docIssues) {
          console.log(ui.lintIssue(issue.severity, issue.message));
        }
      }
    }

    if (!graph || graph.nodes.length === 0) {
      console.log(
        `${ui.brand("│")} ${ui.warn("No graph data to lint.")} Run 'kg build <folder>' first.`,
      );
      console.log(`${ui.brand("│")}`);
      console.log(
        `${ui.brand("│")} ${ui.bold("Graph Readiness:")} ${ui.lintScore(0)}`,
      );
      console.log(ui.footer());
      return;
    }

    // Lint the graph
    const result = lintGraph(graph);

    console.log(`${ui.brand("│")}`);

    if (result.issues.length === 0) {
      console.log(
        `${ui.brand("│")} ${ui.success("No issues found. Your graph is well-structured.")}`,
      );
    } else {
      for (const issue of result.issues) {
        console.log(ui.lintIssue(issue.severity, issue.message));
      }
    }

    console.log(`${ui.brand("│")}`);
    console.log(
      `${ui.brand("│")} ${ui.bold("Graph Readiness:")} ${ui.lintScore(result.score)}`,
    );
    console.log(ui.footer());
  } catch (err) {
    console.error(
      ui.err(`Error: ${err instanceof Error ? err.message : err}`),
    );
    process.exitCode = 1;
  }
}
