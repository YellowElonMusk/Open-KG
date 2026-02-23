import { loadDocuments } from "../pipeline/loader.js";
import { extractFromDocuments } from "../pipeline/extractor.js";
import { readGraph, writeGraph, graphExists } from "../graph/store.js";
import { createLLMProvider } from "../llm/claude.js";
import { checkCache, updateCache } from "../pipeline/cache.js";
import type { LoadedDocument } from "../pipeline/loader.js";
import * as ui from "./ui.js";

const LARGE_FILE_BYTES = 100 * 1024; // 100KB

export async function buildCommand(
  folder: string,
  options: { model?: string; dryRun?: boolean },
): Promise<void> {
  try {
    const startTime = Date.now();
    console.error(ui.header(`Building knowledge graph from ${ui.accent(folder)}`));

    const documents = await loadDocuments(folder);
    if (documents.length === 0) {
      console.error(
        ui.err(`No .md or .txt files found in '${folder}'.`),
      );
      process.exitCode = 1;
      return;
    }

    const mdCount = documents.filter((d) => d.filePath.endsWith(".md")).length;
    const txtCount = documents.filter((d) =>
      d.filePath.endsWith(".txt"),
    ).length;
    console.error(
      `${ui.brand("│")} Found ${ui.accent(String(documents.length))} documents (${mdCount} .md, ${txtCount} .txt)`,
    );

    // Warn about large files
    for (const doc of documents) {
      const sizeBytes = Buffer.byteLength(doc.content, "utf-8");
      if (sizeBytes > LARGE_FILE_BYTES) {
        const sizeKB = Math.round(sizeBytes / 1024);
        console.error(
          `${ui.brand("│")} ${ui.warn("▲")} ${doc.filePath} is ${sizeKB}KB — large files cost more tokens`,
        );
      }
    }

    // Content hash caching — skip unchanged files
    const cache = await checkCache(documents);
    let docsToProcess: LoadedDocument[];

    if (cache.unchanged.length > 0 && cache.changed.length === 0) {
      console.error(
        `${ui.brand("│")} ${ui.success("✓")} All ${cache.unchanged.length} documents unchanged — nothing to do.`,
      );
      console.error(ui.footer());
      return;
    } else if (cache.unchanged.length > 0) {
      console.error(
        `${ui.brand("│")} ${ui.dim(`Skipping ${cache.unchanged.length} cached, processing ${cache.changed.length} new/modified`)}`,
      );
      docsToProcess = cache.changed;
    } else {
      docsToProcess = documents;
    }

    // Privacy banner — show exactly what's sent to the LLM
    const fileInfo = docsToProcess.map((d) => ({
      name: d.filePath,
      sizeKB: (Buffer.byteLength(d.content, "utf-8") / 1024).toFixed(1),
    }));
    console.error(ui.privacyBanner(fileInfo));

    // Dry-run mode
    if (options.dryRun) {
      console.error(
        `${ui.brand("│")}\n${ui.brand("│")} ${ui.warn("DRY RUN")} — would extract from ${docsToProcess.length} document(s). Run without --dry-run to proceed.`,
      );
      console.error(ui.footer());
      return;
    }

    console.error(`${ui.brand("│")}`);

    const llm = createLLMProvider(options.model);

    // Carry forward existing graph so rebuilds are incremental
    const existing =
      cache.unchanged.length > 0 && (await graphExists())
        ? await readGraph()
        : undefined;

    const graph = await extractFromDocuments(docsToProcess, llm, existing);

    await writeGraph(graph);
    await updateCache(documents);

    const elapsed = Date.now() - startTime;
    console.error(
      ui.buildSummary(
        graph.nodes.length,
        graph.edges.length,
        docsToProcess.length,
        cache.unchanged.length,
        elapsed,
      ),
    );
  } catch (err) {
    console.error(ui.err(`Error: ${err instanceof Error ? err.message : err}`));
    process.exitCode = 1;
  }
}
