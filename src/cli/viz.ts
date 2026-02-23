import { graphExists, readGraph } from "../graph/store.js";
import { writeFile } from "node:fs/promises";
import type { KnowledgeGraph } from "../graph/types.js";

const TYPE_COLORS: Record<string, string> = {
  Person: "#4f46e5",
  Project: "#059669",
  Task: "#d97706",
  Decision: "#dc2626",
  Organization: "#7c3aed",
  Document: "#0284c7",
};

function generateDot(graph: KnowledgeGraph): string {
  const lines: string[] = [];
  lines.push("digraph KnowledgeGraph {");
  lines.push("  rankdir=LR;");
  lines.push('  node [shape=box, style="rounded,filled", fontname="sans-serif"];');
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
<title>Knowledge Graph</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; }
  #controls { position: fixed; top: 0; left: 0; right: 0; padding: 12px 20px; background: #1e293b; border-bottom: 1px solid #334155; display: flex; align-items: center; gap: 16px; z-index: 10; }
  #controls h1 { font-size: 16px; font-weight: 600; }
  #controls .stat { font-size: 13px; color: #94a3b8; }
  #legend { display: flex; gap: 12px; margin-left: auto; }
  .legend-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #94a3b8; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
  canvas { display: block; }
  #tooltip { position: fixed; display: none; background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 10px 14px; font-size: 13px; max-width: 280px; pointer-events: none; z-index: 20; box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
  #tooltip .name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
  #tooltip .type { color: #94a3b8; font-size: 12px; }
  #tooltip .sources { color: #64748b; font-size: 11px; margin-top: 6px; }
</style>
</head>
<body>
<div id="controls">
  <h1>Knowledge Graph</h1>
  <span class="stat" id="stat"></span>
  <div id="legend"></div>
</div>
<canvas id="canvas"></canvas>
<div id="tooltip"><div class="name"></div><div class="type"></div><div class="sources"></div></div>
<script>
const graph = ${graphJson};
const TYPE_COLORS = ${colorsJson};
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');

document.getElementById('stat').textContent = graph.nodes.length + ' nodes, ' + graph.edges.length + ' edges';

// Legend
const legend = document.getElementById('legend');
const usedTypes = [...new Set(graph.nodes.map(n => n.type))].sort();
usedTypes.forEach(type => {
  const item = document.createElement('div');
  item.className = 'legend-item';
  item.innerHTML = '<div class="legend-dot" style="background:' + (TYPE_COLORS[type]||'#6b7280') + '"></div>' + type;
  legend.appendChild(item);
});

// Physics simulation
const W = () => window.innerWidth;
const H = () => window.innerHeight;

const nodes = graph.nodes.map((n, i) => ({
  ...n,
  x: W()/2 + (Math.random() - 0.5) * Math.min(W(), 600),
  y: H()/2 + (Math.random() - 0.5) * Math.min(H(), 400),
  vx: 0, vy: 0,
  radius: 24 + Math.min(graph.edges.filter(e => e.from === n.id || e.to === n.id).length * 3, 16),
}));

const nodeMap = new Map(nodes.map(n => [n.id, n]));
const edges = graph.edges.map(e => ({ ...e, source: nodeMap.get(e.from), target: nodeMap.get(e.to) })).filter(e => e.source && e.target);

function resize() { canvas.width = W(); canvas.height = H(); }
window.addEventListener('resize', resize);
resize();

let dragging = null;
let offsetX = 0, offsetY = 0;
let hoveredNode = null;

canvas.addEventListener('mousedown', e => {
  const n = hitTest(e.offsetX, e.offsetY);
  if (n) { dragging = n; offsetX = e.offsetX - n.x; offsetY = e.offsetY - n.y; }
});
canvas.addEventListener('mousemove', e => {
  if (dragging) { dragging.x = e.offsetX - offsetX; dragging.y = e.offsetY - offsetY; dragging.vx = 0; dragging.vy = 0; }
  const n = hitTest(e.offsetX, e.offsetY);
  hoveredNode = n;
  if (n) {
    canvas.style.cursor = 'grab';
    tooltip.style.display = 'block';
    tooltip.querySelector('.name').textContent = n.name;
    tooltip.querySelector('.type').textContent = n.type;
    tooltip.querySelector('.sources').textContent = 'Sources: ' + n.source_documents.join(', ');
    let tx = e.clientX + 16, ty = e.clientY + 16;
    if (tx + 280 > W()) tx = e.clientX - 296;
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
    if (Math.hypot(mx - n.x, my - n.y) < n.radius) return n;
  }
  return null;
}

function simulate() {
  const k = 0.005; // spring constant
  const repulsion = 8000;
  const damping = 0.85;
  const centerPull = 0.001;

  // Repulsion between all nodes
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

  // Spring forces along edges
  for (const e of edges) {
    let dx = e.target.x - e.source.x;
    let dy = e.target.y - e.source.y;
    let dist = Math.hypot(dx, dy);
    let force = k * (dist - 150);
    let fx = (dx / Math.max(dist, 1)) * force;
    let fy = (dy / Math.max(dist, 1)) * force;
    e.source.vx += fx; e.source.vy += fy;
    e.target.vx -= fx; e.target.vy -= fy;
  }

  // Center pull & update positions
  for (const n of nodes) {
    if (n === dragging) continue;
    n.vx += (W()/2 - n.x) * centerPull;
    n.vy += (H()/2 - n.y) * centerPull;
    n.vx *= damping;
    n.vy *= damping;
    n.x += n.vx;
    n.y += n.vy;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  for (const e of edges) {
    const isHighlighted = hoveredNode && (e.source === hoveredNode || e.target === hoveredNode);
    ctx.beginPath();
    ctx.moveTo(e.source.x, e.source.y);
    ctx.lineTo(e.target.x, e.target.y);
    ctx.strokeStyle = isHighlighted ? '#94a3b8' : '#334155';
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.stroke();

    // Edge label
    const mx = (e.source.x + e.target.x) / 2;
    const my = (e.source.y + e.target.y) / 2;
    ctx.font = '10px system-ui';
    ctx.fillStyle = isHighlighted ? '#cbd5e1' : '#475569';
    ctx.textAlign = 'center';
    ctx.fillText(e.type, mx, my - 4);

    // Arrow
    const angle = Math.atan2(e.target.y - e.source.y, e.target.x - e.source.x);
    const arrowDist = e.target.radius + 4;
    const ax = e.target.x - Math.cos(angle) * arrowDist;
    const ay = e.target.y - Math.sin(angle) * arrowDist;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - 8 * Math.cos(angle - 0.4), ay - 8 * Math.sin(angle - 0.4));
    ctx.lineTo(ax - 8 * Math.cos(angle + 0.4), ay - 8 * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = isHighlighted ? '#94a3b8' : '#334155';
    ctx.fill();
  }

  // Draw nodes
  for (const n of nodes) {
    const color = TYPE_COLORS[n.type] || '#6b7280';
    const isHovered = n === hoveredNode;

    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? color + '44' : color + '22';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = isHovered ? 3 : 1.5;
    ctx.stroke();

    ctx.font = (isHovered ? 'bold ' : '') + '12px system-ui';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.name, n.x, n.y);
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
      console.error("No graph found. Run 'kg build <folder>' first.");
      process.exitCode = 1;
      return;
    }

    const graph = await readGraph();
    if (graph.nodes.length === 0) {
      console.error("Graph is empty. Run 'kg build <folder>' to populate it.");
      process.exitCode = 1;
      return;
    }

    const format = options.format ?? "html";
    const defaultOutput = format === "dot" ? "kg/graph.dot" : "kg/graph.html";
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
      await writeFile(outputPath, content, "utf-8");
      console.error(`Wrote ${format.toUpperCase()} to ${outputPath}`);
      if (format === "html") {
        console.error(`Open in a browser: open ${outputPath}`);
      }
    }
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  }
}
