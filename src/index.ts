#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./cli/init.js";
import { buildCommand } from "./cli/build.js";
import { queryCommand } from "./cli/query.js";
import { exportCommand } from "./cli/export.js";
import { statsCommand } from "./cli/stats.js";
import { vizCommand } from "./cli/viz.js";

const program = new Command();

program
  .name("kg")
  .description(
    "Knowledge Graph compiler — extract structured knowledge from .md and .txt documents using LLMs.\n\n" +
      "Quick start:\n" +
      "  $ kg build ./docs            Extract a knowledge graph from your documents\n" +
      "  $ kg stats                    See what's in the graph\n" +
      "  $ kg query \"Who works on X?\"  Ask questions about the graph\n" +
      "  $ kg viz                      Open an interactive visualization",
  )
  .version("0.2.0");

program
  .command("init")
  .description("Initialize an empty graph (optional — build creates one automatically)")
  .option("--force", "Overwrite existing graph.json")
  .action(initCommand);

program
  .command("build")
  .description("Extract a knowledge graph from .md/.txt files in a folder")
  .argument("<folder>", "Folder to scan for documents")
  .option("--model <model>", "Claude model to use", "claude-sonnet-4-20250514")
  .option("--dry-run", "Preview which files would be processed without calling the LLM")
  .action(buildCommand);

program
  .command("query")
  .description("Ask a natural-language question about the graph")
  .argument("<question>", "Your question (in quotes)")
  .option("--model <model>", "Claude model to use", "claude-sonnet-4-20250514")
  .action(queryCommand);

program
  .command("export")
  .description("Dump the graph to stdout as JSON, Markdown, or DOT")
  .option(
    "--format <format>",
    "Output format: json, markdown, or dot",
    "json",
  )
  .action(exportCommand);

program
  .command("stats")
  .description("Print a quick summary of the graph: node/edge counts, types, top entities")
  .action(statsCommand);

program
  .command("viz")
  .description("Generate an interactive HTML visualization of the graph")
  .option("--format <format>", "Output format: html or dot", "html")
  .option("-o, --output <path>", "Output file path (default: kg/graph.html or kg/graph.dot)")
  .action(vizCommand);

program.parse();
