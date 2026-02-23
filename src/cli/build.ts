import { loadDocuments } from "../pipeline/loader.js";
import { extractFromDocuments } from "../pipeline/extractor.js";
import { readGraph, writeGraph, graphExists } from "../graph/store.js";
import { createLLMProvider } from "../llm/claude.js";
import { checkCache, updateCache } from "../pipeline/cache.js";
import type { LoadedDocument } from "../pipeline/loader.js";

const LARGE_FILE_BYTES = 100 * 1024; // 100KB

export async function buildCommand(
  folder: string,
  options: { model?: string; dryRun?: boolean },
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
    const txtCount = documents.filter((d) =>
      d.filePath.endsWith(".txt"),
    ).length;
    console.error(
      `Found ${documents.length} documents (${mdCount} .md, ${txtCount} .txt)`,
    );

    // Warn about large files
    for (const doc of documents) {
      const sizeBytes = Buffer.byteLength(doc.content, "utf-8");
      if (sizeBytes > LARGE_FILE_BYTES) {
        const sizeKB = Math.round(sizeBytes / 1024);
        console.error(
          `Warning: ${doc.filePath} is ${sizeKB}KB — large files cost more tokens and may extract poorly.`,
        );
      }
    }

    // Content hash caching — skip unchanged files
    const cache = await checkCache(documents);
    let docsToProcess: LoadedDocument[];

    if (cache.unchanged.length > 0 && cache.changed.length === 0) {
      console.error(
        `All ${cache.unchanged.length} documents unchanged — nothing to do.`,
      );
      return;
    } else if (cache.unchanged.length > 0) {
      console.error(
        `Skipping ${cache.unchanged.length} unchanged document(s), processing ${cache.changed.length} new/modified.`,
      );
      docsToProcess = cache.changed;
    } else {
      docsToProcess = documents;
    }

    // Dry-run mode — show what would be processed
    if (options.dryRun) {
      console.error(`\n--- Dry run ---`);
      for (const doc of docsToProcess) {
        const sizeKB = (
          Buffer.byteLength(doc.content, "utf-8") / 1024
        ).toFixed(1);
        console.error(`  ${doc.filePath} (${sizeKB}KB)`);
      }
      console.error(
        `\nWould extract from ${docsToProcess.length} document(s). Run without --dry-run to proceed.`,
      );
      return;
    }

    const llm = createLLMProvider(options.model);

    // Carry forward existing graph so rebuilds are incremental
    const existing =
      cache.unchanged.length > 0 && (await graphExists())
        ? await readGraph()
        : undefined;

    const graph = await extractFromDocuments(docsToProcess, llm, existing);

    await writeGraph(graph);
    await updateCache(documents);

    console.error(
      `\nDone. ${graph.nodes.length} nodes, ${graph.edges.length} edges from ${documents.length} documents.`,
    );
    console.error(`Graph saved to kg/graph.json`);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  }
}
