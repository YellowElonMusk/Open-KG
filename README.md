# Open-KG

**Stop paying the "Dark Knowledge" tax.**

Your company's most valuable asset is its logic, but right now, that logic is trapped in messy Slack threads and SaaS silos. Open-KG is the open-standard compiler that turns your local Markdown files into a **Machine-Readable Organizational Brain**.

- **Universal Extraction:** Turn notes into a queryable Graph.
- **Sovereign by Design:** Your data stays on your drive. Nothing leaves without you seeing exactly what's sent.
- **Agent-Ready:** Export a deterministic JSON brain that any LLM can navigate perfectly.

```
$ kg build ./docs

┌ Building knowledge graph from ./docs
│ Found 3 documents (2 .md, 1 .txt)
│  Privacy Check — data sent to LLM for extraction:
│    • team.md (0.4KB text content only)
│    • decisions.md (0.5KB text content only)
│    • architecture.txt (0.3KB text content only)
│    No file paths, metadata, or system info is transmitted.
│
│ ██████████████████░░ [1/3] Extracting from team.md...
│   ├── Person Alice Chen
│   ├── Person Bob Martinez
│   ├── Project Project Phoenix
│   └── +5 nodes  +4 edges  from team.md
│ ████████████████████ [3/3] Extracting from architecture.txt...
│
┌─────────────────────────────────────────────────────
│  BUILD COMPLETE
│
│  Graph IQ: +12 Nodes │ +9 Edges │ 3 Docs Compiled
│  Elapsed: 4.2s
│  Output: .kg/graph.json
└─────────────────────────────────────────────────────
```

## Quick Start

```bash
npm install && npm run build
export ANTHROPIC_API_KEY=sk-ant-...

kg build ./docs                       # extract a graph — auto-creates .kg/
kg stats                              # see what was extracted
kg query "Who works on Project Phoenix?"
kg viz                                # open the Digital Brain visualization
kg lint ./docs                        # score your docs' graph readiness
```

No `kg init` required. No database. No server. Just files in, graph out.

## Commands

### `kg build <folder>`

Recursively scans for `.md` and `.txt` files, extracts entities and relationships via LLM, runs entity resolution, and writes `.kg/graph.json`.

```bash
kg build ./docs                       # full build
kg build ./docs --dry-run             # preview without calling the LLM
kg build ./docs --model claude-sonnet-4-20250514
```

Features:
- **Incremental rebuilds** — unchanged files are skipped automatically (SHA-256 content hash)
- **Dry-run mode** — see what would be processed before spending API tokens
- **Large file warnings** — files over 100KB trigger a warning
- **Privacy banner** — shows exactly which text is sent to the LLM. No file paths, metadata, or system info transmitted.
- **`.kgignore`** — drop a `.kgignore` file in your folder to exclude private notes (works like `.gitignore`)

### `kg stats`

Quick summary: node/edge counts, entity types, relationship types, most connected entities, source documents.

```bash
kg stats
```

### `kg query "<question>"`

Natural language question answering against your knowledge graph.

```bash
kg query "Who works on Project Phoenix?"
kg query "What decisions depend on the API Redesign?"
```

### `kg viz`

Generate an interactive **Digital Brain** visualization — glassmorphism dark theme, glowing edges, translucent nodes, force-directed layout. Screenshot-worthy.

```bash
kg viz                                # writes .kg/graph.html
kg viz --format dot                   # writes .kg/graph.dot (Graphviz)
kg viz -o brain.html                  # custom output path
```

### `kg lint [folder]`

Score your documentation's **Graph Readiness** out of 100. Finds island nodes, weak connections, missing cross-references, and low entity diversity.

```bash
kg lint ./docs
```

Example output:
```
  ▲ Entity 'Project X' is an island. Connect it to a 'Person' or 'Decision' node to increase Graph IQ.
  ● 8/10 entities appear in only one document. Cross-referencing improves graph density.

  Graph Readiness: 72/100 ★★★★☆
```

### `kg export`

Pipe-friendly output to stdout.

```bash
kg export                             # JSON
kg export --format markdown           # human-readable tables
kg export --format dot                # Graphviz DOT
kg export | jq '.nodes | length'      # pipe to jq
```

### `kg init`

Optional — `build` auto-creates `.kg/` for you.

```bash
kg init                               # creates .kg/graph.json
kg init --force                       # reset the graph
```

## `.kgignore`

Drop a `.kgignore` file in your document folder to exclude private files from extraction:

```
# Private notes
private/
*.secret.md
personal-journal.txt
```

## Graph Format

```json
{
  "nodes": [
    {
      "id": "person::alice_chen",
      "type": "Person",
      "name": "Alice Chen",
      "source_documents": ["team.md", "decisions.md"]
    }
  ],
  "edges": [
    {
      "from": "person::alice_chen",
      "to": "project::project_phoenix",
      "type": "works_on",
      "source_document": "team.md"
    }
  ]
}
```

## Sovereign Data Architecture

Open-KG follows a `.git`-style hidden directory pattern:

```
your-project/
  docs/
    team.md
    decisions.md
    .kgignore           # exclude private files
  .kg/                  # auto-created, git-ignored
    graph.json          # your knowledge graph
    graph.html          # visualization
    .cache.json         # content hashes for incremental builds
```

All data stays local. The only external call is to the LLM API for extraction, and the privacy banner shows you exactly what's sent.

## Ontology

| Entity Types | Relationship Types |
|---|---|
| Person | works_on |
| Project | owns |
| Task | assigned_to |
| Decision | decided |
| Organization | mentioned_in |
| Document | depends_on |

## Development

```bash
npm install        # install dependencies
npm run build      # compile TypeScript
npm run dev        # watch mode
npm test           # run unit tests (13 tests)
```

## Roadmap

- [x] Incremental builds (SHA-256 content hash caching)
- [x] Interactive visualization (glassmorphism Digital Brain)
- [x] `kg lint` — graph readiness scoring
- [x] `.kgignore` support
- [x] Privacy-first build transparency
- [x] Dry-run preview mode
- [ ] Fuzzy entity resolution (Levenshtein / embedding similarity)
- [ ] Custom ontologies (load from config file)
- [ ] Alternative LLM providers (OpenAI, Ollama, local models)
- [ ] Document chunking for large files
- [ ] Confidence scores on extracted entities

## License

MIT
