import { loadDocuments } from "../pipeline/loader.js";
import { extractFromDocuments } from "../pipeline/extractor.js";
import { writeGraph } from "../graph/store.js";
import { createLLMProvider } from "../llm/claude.js";

export async function buildCommand(
  folder: string,
  options: { model?: string },
): Promise<void> {
  try {
    console.error(`Scanning ${folder}...`);

    const documents = await loadDocuments(folder);
    if (documents.length === 0) {
      console.error(`No .md or .txt files found in '${folder}'.`);
      process.exitCode = 1;
      return;
    }

    const mdCount = documents.filter((d) => d.filePath.endsWith(".md")).length;
    const txtCount = documents.filter((d) => d.filePath.endsWith(".txt")).length;
    console.error(
      `Found ${documents.length} documents (${mdCount} .md, ${txtCount} .txt)`,
    );

    const llm = createLLMProvider(options.model);
    const graph = await extractFromDocuments(documents, llm);

    await writeGraph(graph);

    console.error(
      `\nDone. ${graph.nodes.length} nodes, ${graph.edges.length} edges from ${documents.length} documents.`,
    );
  } catch (err) {
    console.error(
      `Error: ${err instanceof Error ? err.message : err}`,
    );
    process.exitCode = 1;
  }
}
