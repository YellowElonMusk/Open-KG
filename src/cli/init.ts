import { graphExists, writeGraph } from "../graph/store.js";
import { emptyGraph } from "../graph/store.js";

export async function initCommand(options: { force?: boolean }): Promise<void> {
  try {
    const exists = await graphExists();
    if (exists && !options.force) {
      console.error(
        "kg/graph.json already exists. Use --force to overwrite.",
      );
      process.exitCode = 1;
      return;
    }

    await writeGraph(emptyGraph());
    console.log("Initialized empty knowledge graph at kg/graph.json");
  } catch (err) {
    console.error(
      `Error: ${err instanceof Error ? err.message : err}`,
    );
    process.exitCode = 1;
  }
}
