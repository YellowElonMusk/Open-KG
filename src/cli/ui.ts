import chalk from "chalk";

// ── Branding ──────────────────────────────────────────────
export const brand = chalk.bold.hex("#a78bfa"); // violet
export const accent = chalk.hex("#38bdf8"); // sky
export const success = chalk.hex("#34d399"); // emerald
export const warn = chalk.hex("#fbbf24"); // amber
export const err = chalk.hex("#f87171"); // red
export const dim = chalk.dim;
export const bold = chalk.bold;

// ── Logo ──────────────────────────────────────────────────
export function logo(): string {
  return brand("⬡ kg");
}

// ── Section headers ───────────────────────────────────────
export function header(text: string): string {
  return `\n${brand("┌")} ${bold(text)}\n${brand("│")}`;
}

export function footer(): string {
  return brand("└───────────────────────────────────");
}

// ── Progress ──────────────────────────────────────────────
export function progress(step: number, total: number, msg: string): string {
  const bar = progressBar(step, total, 20);
  return `${brand("│")} ${bar} ${dim(`[${step}/${total}]`)} ${msg}`;
}

function progressBar(current: number, total: number, width: number): string {
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  return (
    accent("█".repeat(filled)) + dim("░".repeat(empty))
  );
}

// ── Tree-style discovery output ───────────────────────────
export function treeNode(name: string, type: string): string {
  const typeColor = typeToColor(type);
  return `${brand("│")}   ${dim("├──")} ${typeColor(type)} ${bold(name)}`;
}

export function treeEdge(from: string, to: string, rel: string): string {
  return `${brand("│")}   ${dim("│")}   ${dim("→")} ${accent(rel)} ${dim("→")} ${from} → ${to}`;
}

export function treeSummary(
  label: string,
  nodes: number,
  edges: number,
): string {
  return `${brand("│")}   ${dim("└──")} ${success(`+${nodes} nodes`)}  ${accent(`+${edges} edges`)}  ${dim(`from ${label}`)}`;
}

// ── Final summary ─────────────────────────────────────────
export function buildSummary(
  nodes: number,
  edges: number,
  docs: number,
  skipped: number,
  elapsed: number,
): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(
    brand("┌─────────────────────────────────────────────────────"),
  );
  lines.push(
    brand("│") +
      `  ${success("BUILD COMPLETE")}`,
  );
  lines.push(brand("│"));
  lines.push(
    brand("│") +
      `  ${bold("Graph IQ:")} ${accent(`+${nodes} Nodes`)} ${brand("│")} ${accent(`+${edges} Edges`)} ${brand("│")} ${success(`${docs} Docs Compiled`)}`,
  );
  if (skipped > 0) {
    lines.push(
      brand("│") + `  ${dim(`${skipped} unchanged docs skipped (cached)`)}`,
    );
  }
  lines.push(
    brand("│") + `  ${dim(`Elapsed: ${(elapsed / 1000).toFixed(1)}s`)}`,
  );
  lines.push(
    brand("│") +
      `  ${dim("Output:")} .kg/graph.json`,
  );
  lines.push(
    brand("└─────────────────────────────────────────────────────"),
  );
  return lines.join("\n");
}

// ── Privacy banner ────────────────────────────────────────
export function privacyBanner(files: { name: string; sizeKB: string }[]): string {
  const lines: string[] = [];
  lines.push(
    brand("│") + `  ${bold("Privacy Check")} ${dim("— data sent to LLM for extraction:")}`,
  );
  for (const f of files) {
    lines.push(
      brand("│") + `    ${dim("•")} ${f.name} ${dim(`(${f.sizeKB}KB text content only)`)}`,
    );
  }
  lines.push(
    brand("│") +
      `    ${dim("No file paths, metadata, or system info is transmitted.")}`,
  );
  return lines.join("\n");
}

// ── Type color mapping ────────────────────────────────────
function typeToColor(type: string): (text: string) => string {
  switch (type) {
    case "Person":
      return chalk.hex("#818cf8");
    case "Project":
      return chalk.hex("#34d399");
    case "Task":
      return chalk.hex("#fbbf24");
    case "Decision":
      return chalk.hex("#f87171");
    case "Organization":
      return chalk.hex("#a78bfa");
    case "Document":
      return chalk.hex("#38bdf8");
    default:
      return chalk.hex("#94a3b8");
  }
}

// ── Lint scoring ──────────────────────────────────────────
export function lintScore(score: number): string {
  if (score >= 90) return success(`${score}/100 ★★★★★`);
  if (score >= 70) return accent(`${score}/100 ★★★★☆`);
  if (score >= 50) return warn(`${score}/100 ★★★☆☆`);
  return err(`${score}/100 ★★☆☆☆`);
}

export function lintIssue(
  severity: "warn" | "info",
  message: string,
): string {
  const icon = severity === "warn" ? warn("▲") : accent("●");
  return `  ${icon} ${message}`;
}
