import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import type { KnowledgeGraph } from "./types.js";

const GRAPH_FILENAME = "graph.json";

function defaultKgDir(): string {
  return join(process.cwd(), ".kg");
}

export function emptyGraph(): KnowledgeGraph {
  return { nodes: [], edges: [] };
}

export async function graphExists(kgDir?: string): Promise<boolean> {
  const dir = kgDir ?? defaultKgDir();
  try {
    await access(join(dir, GRAPH_FILENAME));
    return true;
  } catch {
    return false;
  }
}

export async function readGraph(kgDir?: string): Promise<KnowledgeGraph> {
  const dir = kgDir ?? defaultKgDir();
  const filePath = join(dir, GRAPH_FILENAME);

  try {
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as KnowledgeGraph;
    if (!Array.isArray(parsed.nodes)) parsed.nodes = [];
    if (!Array.isArray(parsed.edges)) parsed.edges = [];
    return parsed;
  } catch {
    return emptyGraph();
  }
}

export async function writeGraph(
  graph: KnowledgeGraph,
  kgDir?: string,
): Promise<void> {
  const dir = kgDir ?? defaultKgDir();
  await mkdir(dir, { recursive: true });

  const sorted: KnowledgeGraph = {
    nodes: [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...graph.edges].sort((a, b) => {
      const cmp = a.from.localeCompare(b.from);
      if (cmp !== 0) return cmp;
      const cmp2 = a.to.localeCompare(b.to);
      if (cmp2 !== 0) return cmp2;
      return a.type.localeCompare(b.type);
    }),
  };

  const json = JSON.stringify(sorted, null, 2) + "\n";
  await writeFile(join(dir, GRAPH_FILENAME), json, "utf-8");
}
