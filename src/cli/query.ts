import { graphExists, readGraph } from "../graph/store.js";
import { executeQuery } from "../query/engine.js";
import { createLLMProvider } from "../llm/claude.js";

export async function queryCommand(
  question: string,
  options: { model?: string },
): Promise<void> {
  try {
    const exists = await graphExists();
    if (!exists) {
      console.error("Error: No graph found. Run 'kg build <folder>' first.");
      process.exitCode = 1;
      return;
    }

    const graph = await readGraph();
    if (graph.nodes.length === 0) {
      console.error(
        "Error: Graph is empty. Run 'kg build <folder>' to populate it.",
      );
      process.exitCode = 1;
      return;
    }

    const llm = createLLMProvider(options.model);
    const result = await executeQuery(graph, question, llm);

    console.log(`\nAnswer: ${result.answer}`);

    if (result.usedNodes.length > 0) {
      console.log("\nReferenced nodes:");
      for (const node of result.usedNodes) {
        console.log(`  - [${node.type}] ${node.name} (${node.id})`);
      }
    }
  } catch (err) {
    console.error(
      `Error: ${err instanceof Error ? err.message : err}`,
    );
    process.exitCode = 1;
  }
}
