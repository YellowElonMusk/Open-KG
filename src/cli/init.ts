import { graphExists, writeGraph } from "../graph/store.js";
import { emptyGraph } from "../graph/store.js";
import * as ui from "./ui.js";

export async function initCommand(options: { force?: boolean }): Promise<void> {
  try {
    const exists = await graphExists();
    if (exists && !options.force) {
      console.error(
        ui.warn(".kg/graph.json already exists. Use --force to overwrite."),
      );
      process.exitCode = 1;
      return;
    }

    await writeGraph(emptyGraph());
    console.log(
      `${ui.success("✓")} Initialized empty knowledge graph at ${ui.accent(".kg/graph.json")}`,
    );
  } catch (err) {
    console.error(
      ui.err(`Error: ${err instanceof Error ? err.message : err}`),
    );
    process.exitCode = 1;
  }
}
