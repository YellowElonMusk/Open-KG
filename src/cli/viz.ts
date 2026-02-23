import { graphExists, readGraph } from "../graph/store.js";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { KnowledgeGraph } from "../graph/types.js";
import * as ui from "./ui.js";

const TYPE_COLORS: Record<string, string> = {
  Person: "#818cf8",
  Project: "#34d399",
  Task: "#fbbf24",
  Decision: "#f87171",
  Organization: "#a78bfa",
  Document: "#38bdf8",
};

function generateDot(graph: KnowledgeGraph): string {
  const lines: string[] = [];
  lines.push("digraph KnowledgeGraph {");
  lines.push("  rankdir=LR;");
  lines.push(
    '  node [shape=box, style="rounded,filled", fontname="sans-serif"];',
  );
  lines.push('  edge [fontname="sans-serif", fontsize=10];');
  lines.push("");

  for (const node of graph.nodes) {
    const color = TYPE_COLORS[node.type] ?? "#6b7280";
    lines.push(
      `  "${node.id}" [label="${node.name}\\n(${node.type})", fillcolor="${color}22", color="${color}"];`,
    );
  }

  lines.push("");
  for (const edge of graph.edges) {
    lines.push(`  "${edge.from}" -> "${edge.to}" [label="${edge.type}"];`);
  }

  lines.push("}");
  return lines.join("\n");
}

function generateHTML(graph: KnowledgeGraph): string {
  const graphJson = JSON.stringify(graph);
  const colorsJson = JSON.stringify(TYPE_COLORS);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Knowledge Graph — Digital Brain</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', system-ui, sans-serif;
    background: #080c18;
    color: #e2e8f0;
    overflow: hidden;
  }

  /* Animated background gradient */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 600px 400px at 20% 30%, rgba(129,140,248,0.08) 0%, transparent 70%),
      radial-gradient(ellipse 500px 500px at 80% 70%, rgba(52,211,153,0.06) 0%, transparent 70%),
      radial-gradient(ellipse 400px 300px at 50% 50%, rgba(56,189,248,0.04) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* Glassmorphism header */
  #controls {
    position: fixed; top: 0; left: 0; right: 0;
    padding: 14px 24px;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(20px) saturate(1.5);
    -webkit-backdrop-filter: blur(20px) saturate(1.5);
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    display: flex; align-items: center; gap: 20px;
    z-index: 10;
  }
  #controls h1 {
    font-size: 15px; font-weight: 700; letter-spacing: -0.02em;
    background: linear-gradient(135deg, #818cf8, #38bdf8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  #controls .stat {
    font-size: 12px; color: #64748b; font-weight: 500;
    padding: 4px 10px;
    background: rgba(148,163,184,0.08);
    border-radius: 6px;
    border: 1px solid rgba(148,163,184,0.1);
  }
  #legend { display: flex; gap: 10px; margin-left: auto; flex-wrap: wrap; }
  .legend-item {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: #94a3b8; font-weight: 500;
    padding: 3px 8px;
    background: rgba(148,163,184,0.06);
    border-radius: 4px;
  }
  .legend-dot {
    width: 8px; height: 8px; border-radius: 50%;
    box-shadow: 0 0 6px currentColor;
  }

  canvas { display: block; position: relative; z-index: 1; }

  /* Glassmorphism tooltip */
  #tooltip {
    position: fixed; display: none;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(16px) saturate(1.4);
    -webkit-backdrop-filter: blur(16px) saturate(1.4);
    border: 1px solid rgba(148, 163, 184, 0.15);
    border-radius: 12px;
    padding: 14px 18px;
    font-size: 13px;
    max-width: 300px;
    pointer-events: none;
    z-index: 20;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 1px rgba(148,163,184,0.2);
  }
  #tooltip .name { font-weight: 700; font-size: 15px; margin-bottom: 2px; letter-spacing: -0.01em; }
  #tooltip .type {
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
    padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 6px;
  }
  #tooltip .sources { color: #64748b; font-size: 11px; line-height: 1.5; }
  #tooltip .connections { color: #94a3b8; font-size: 11px; margin-top: 4px; }

  /* Branding */
  #brand {
    position: fixed; bottom: 16px; right: 20px;
    font-size: 11px; color: #334155; font-weight: 500;
    z-index: 10;
  }
  #brand span {
    background: linear-gradient(135deg, #818cf8, #38bdf8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
</style>
</head>
<body>
<div id="controls">
  <h1>Knowledge Graph</h1>
  <span class="stat" id="stat"></span>
  <div id="legend"></div>
</div>
<canvas id="canvas"></canvas>
<div id="tooltip">
  <div class="name"></div>
  <div class="type"></div>
  <div class="sources"></div>
  <div class="connections"></div>
</div>
<div id="brand">built with <span>open-kg</span></div>
<script>
const graph = ${graphJson};
const TYPE_COLORS = ${colorsJson};
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

document.getElementById('stat').textContent = graph.nodes.length + ' nodes · ' + graph.edges.length + ' edges';

// Legend
const legend = document.getElementById('legend');
const usedTypes = [...new Set(graph.nodes.map(n => n.type))].sort();
usedTypes.forEach(type => {
  const item = document.createElement('div');
  item.className = 'legend-item';
  const color = TYPE_COLORS[type] || '#6b7280';
  item.innerHTML = '<div class="legend-dot" style="color:' + color + ';background:' + color + '"></div>' + type;
  legend.appendChild(item);
});

// Physics
const W = () => window.innerWidth;
const H = () => window.innerHeight;

// Pre-compute edge counts for sizing
const edgeCounts = {};
graph.edges.forEach(e => {
  edgeCounts[e.from] = (edgeCounts[e.from] || 0) + 1;
  edgeCounts[e.to] = (edgeCounts[e.to] || 0) + 1;
});

const nodes = graph.nodes.map(n => ({
  ...n,
  x: W()/2 + (Math.random() - 0.5) * Math.min(W(), 500),
  y: H()/2 + (Math.random() - 0.5) * Math.min(H(), 350),
  vx: 0, vy: 0,
  radius: 22 + Math.min((edgeCounts[n.id] || 0) * 4, 20),
  edgeCount: edgeCounts[n.id] || 0,
}));

const nodeMap = new Map(nodes.map(n => [n.id, n]));
const edges = graph.edges.map(e => ({
  ...e,
  source: nodeMap.get(e.from),
  target: nodeMap.get(e.to)
})).filter(e => e.source && e.target);

function resize() { canvas.width = W(); canvas.height = H(); }
window.addEventListener('resize', resize);
resize();

let dragging = null;
let offsetX = 0, offsetY = 0;
let hoveredNode = null;
let time = 0;

canvas.addEventListener('mousedown', e => {
  const n = hitTest(e.offsetX, e.offsetY);
  if (n) { dragging = n; offsetX = e.offsetX - n.x; offsetY = e.offsetY - n.y; canvas.style.cursor = 'grabbing'; }
});
canvas.addEventListener('mousemove', e => {
  if (dragging) { dragging.x = e.offsetX - offsetX; dragging.y = e.offsetY - offsetY; dragging.vx = 0; dragging.vy = 0; }
  const n = hitTest(e.offsetX, e.offsetY);
  hoveredNode = n;
  if (n) {
    canvas.style.cursor = dragging ? 'grabbing' : 'grab';
    tooltip.style.display = 'block';
    tooltip.querySelector('.name').textContent = n.name;
    const typeEl = tooltip.querySelector('.type');
    typeEl.textContent = n.type;
    const c = TYPE_COLORS[n.type] || '#6b7280';
    typeEl.style.background = c + '22';
    typeEl.style.color = c;
    tooltip.querySelector('.sources').textContent = 'Sources: ' + n.source_documents.join(', ');
    tooltip.querySelector('.connections').textContent = n.edgeCount + ' connection' + (n.edgeCount !== 1 ? 's' : '');
    let tx = e.clientX + 16, ty = e.clientY + 16;
    if (tx + 300 > W()) tx = e.clientX - 316;
    if (ty + 120 > H()) ty = e.clientY - 120;
    tooltip.style.left = tx + 'px';
    tooltip.style.top = ty + 'px';
  } else {
    canvas.style.cursor = 'default';
    tooltip.style.display = 'none';
  }
});
canvas.addEventListener('mouseup', () => { dragging = null; });

function hitTest(mx, my) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (Math.hypot(mx - n.x, my - n.y) < n.radius + 4) return n;
  }
  return null;
}

function simulate() {
  const repulsion = 10000;
  const k = 0.004;
  const damping = 0.88;
  const centerPull = 0.0008;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let dx = nodes[j].x - nodes[i].x;
      let dy = nodes[j].y - nodes[i].y;
      let dist = Math.max(Math.hypot(dx, dy), 1);
      let force = repulsion / (dist * dist);
      let fx = (dx / dist) * force;
      let fy = (dy / dist) * force;
      nodes[i].vx -= fx; nodes[i].vy -= fy;
      nodes[j].vx += fx; nodes[j].vy += fy;
    }
  }

  for (const e of edges) {
    let dx = e.target.x - e.source.x;
    let dy = e.target.y - e.source.y;
    let dist = Math.hypot(dx, dy);
    let force = k * (dist - 180);
    let fx = (dx / Math.max(dist, 1)) * force;
    let fy = (dy / Math.max(dist, 1)) * force;
    e.source.vx += fx; e.source.vy += fy;
    e.target.vx -= fx; e.target.vy -= fy;
  }

  for (const n of nodes) {
    if (n === dragging) continue;
    n.vx += (W()/2 - n.x) * centerPull;
    n.vy += (H()/2 - n.y) * centerPull;
    n.vx *= damping; n.vy *= damping;
    n.x += n.vx; n.y += n.vy;
  }
}

function draw() {
  time++;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw glowing edges
  for (const e of edges) {
    const isHl = hoveredNode && (e.source === hoveredNode || e.target === hoveredNode);
    const c = isHl ? (TYPE_COLORS[hoveredNode.type] || '#94a3b8') : '#1e293b';
    const alpha = isHl ? 0.8 : 0.4;

    // Glow
    if (isHl) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(e.source.x, e.source.y);
      ctx.lineTo(e.target.x, e.target.y);
      ctx.strokeStyle = c;
      ctx.lineWidth = 6;
      ctx.globalAlpha = 0.15;
      ctx.filter = 'blur(4px)';
      ctx.stroke();
      ctx.restore();
    }

    // Edge line
    ctx.beginPath();
    ctx.moveTo(e.source.x, e.source.y);
    ctx.lineTo(e.target.x, e.target.y);
    ctx.strokeStyle = isHl ? c : 'rgba(51, 65, 85, 0.6)';
    ctx.lineWidth = isHl ? 2 : 1;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Edge label
    const mx = (e.source.x + e.target.x) / 2;
    const my = (e.source.y + e.target.y) / 2;
    ctx.font = '500 10px Inter, system-ui';
    ctx.fillStyle = isHl ? '#cbd5e1' : '#334155';
    ctx.textAlign = 'center';
    ctx.fillText(e.type, mx, my - 6);

    // Arrow
    const angle = Math.atan2(e.target.y - e.source.y, e.target.x - e.source.x);
    const ad = e.target.radius + 6;
    const ax = e.target.x - Math.cos(angle) * ad;
    const ay = e.target.y - Math.sin(angle) * ad;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 10 * Math.cos(angle - 0.35), ay - 10 * Math.sin(angle - 0.35));
    ctx.lineTo(ax - 10 * Math.cos(angle + 0.35), ay - 10 * Math.sin(angle + 0.35));
    ctx.closePath();
    ctx.fillStyle = isHl ? c : 'rgba(51, 65, 85, 0.6)';
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Draw nodes with glassmorphism
  for (const n of nodes) {
    const color = TYPE_COLORS[n.type] || '#6b7280';
    const isHovered = n === hoveredNode;
    const pulse = isHovered ? 1 + Math.sin(time * 0.06) * 0.03 : 1;
    const r = n.radius * pulse;

    // Outer glow
    const glowSize = isHovered ? 24 : 8;
    const glowAlpha = isHovered ? 0.25 : 0.08 + Math.sin(time * 0.02 + n.x * 0.01) * 0.03;
    const gradient = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, r + glowSize);
    gradient.addColorStop(0, color + Math.round(glowAlpha * 255).toString(16).padStart(2, '0'));
    gradient.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.arc(n.x, n.y, r + glowSize, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Glass body
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.7)';
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.strokeStyle = isHovered ? color : color + '66';
    ctx.lineWidth = isHovered ? 2.5 : 1.5;
    ctx.stroke();

    // Inner highlight (glass effect)
    ctx.beginPath();
    ctx.arc(n.x, n.y - r * 0.15, r * 0.85, Math.PI * 1.2, Math.PI * 1.8);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = r * 0.3;
    ctx.stroke();

    // Label
    ctx.font = (isHovered ? '600 ' : '500 ') + '12px Inter, system-ui';
    ctx.fillStyle = isHovered ? '#f1f5f9' : '#cbd5e1';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.name, n.x, n.y - 2);

    // Type sublabel
    ctx.font = '500 9px Inter, system-ui';
    ctx.fillStyle = color + (isHovered ? 'cc' : '88');
    ctx.fillText(n.type, n.x, n.y + 12);
  }
}

function loop() {
  simulate();
  draw();
  requestAnimationFrame(loop);
}
loop();
</script>
</body>
</html>`;
}

export async function vizCommand(options: {
  format?: string;
  output?: string;
}): Promise<void> {
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

    const format = options.format ?? "html";
    const defaultOutput =
      format === "dot" ? ".kg/graph.dot" : ".kg/graph.html";
    const outputPath = options.output ?? defaultOutput;

    let content: string;
    if (format === "dot") {
      content = generateDot(graph);
    } else {
      content = generateHTML(graph);
    }

    if (outputPath === "-") {
      process.stdout.write(content);
    } else {
      // Ensure parent directory exists
      const dir = outputPath.substring(
        0,
        outputPath.lastIndexOf("/"),
      );
      if (dir) await mkdir(dir, { recursive: true });

      await writeFile(outputPath, content, "utf-8");
      console.error(
        `${ui.success("✓")} Wrote ${format.toUpperCase()} to ${ui.accent(outputPath)}`,
      );
      if (format === "html") {
        console.error(
          `  ${ui.dim("Open in browser:")} open ${outputPath}`,
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
