import { graphExists, readGraph } from "../graph/store.js";
import { executeQuery } from "../query/engine.js";
import { createLLMProvider } from "../llm/claude.js";
import * as ui from "./ui.js";

export async function queryCommand(
  question: string,
  options: { model?: string },
): Promise<void> {
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
    if (graph.nodes.length === 0) {
      console.error(
        ui.err("Graph is empty. Run 'kg build <folder>' to populate it."),
      );
      process.exitCode = 1;
      return;
    }

    console.error(
      `${ui.brand("│")} Querying ${ui.accent(String(graph.nodes.length))} nodes...`,
    );

    const llm = createLLMProvider(options.model);
    const result = await executeQuery(graph, question, llm);

    console.log(`\n${ui.bold("Answer:")} ${result.answer}`);

    if (result.usedNodes.length > 0) {
      console.log(`\n${ui.dim("Referenced nodes:")}`);
      for (const node of result.usedNodes) {
        console.log(
          `  ${ui.dim("•")} ${ui.accent(`[${node.type}]`)} ${ui.bold(node.name)} ${ui.dim(`(${node.id})`)}`,
        );
      }
    }
  } catch (err) {
    console.error(
      ui.err(`Error: ${err instanceof Error ? err.message : err}`),
    );
    process.exitCode = 1;
  }
}
