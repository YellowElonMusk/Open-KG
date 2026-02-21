#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./cli/init.js";
import { buildCommand } from "./cli/build.js";
import { queryCommand } from "./cli/query.js";
import { exportCommand } from "./cli/export.js";

const program = new Command();

program
  .name("kg")
  .description(
    "Knowledge Graph compiler - extract structured knowledge from documents",
  )
  .version("0.1.0");

program
  .command("init")
  .description("Initialize a new knowledge graph project")
  .option("--force", "Overwrite existing graph.json")
  .action(initCommand);

program
  .command("build")
  .description("Build knowledge graph from documents in a folder")
  .argument("<folder>", "Folder containing .md and .txt documents")
  .option("--model <model>", "LLM model to use", "claude-sonnet-4-20250514")
  .action(buildCommand);

program
  .command("query")
  .description("Query the knowledge graph using natural language")
  .argument("<question>", "Question to ask about the graph")
  .option("--model <model>", "LLM model to use", "claude-sonnet-4-20250514")
  .action(queryCommand);

program
  .command("export")
  .description("Export the knowledge graph to stdout")
  .option("--format <format>", "Output format: json or markdown", "json")
  .action(exportCommand);

program.parse();
