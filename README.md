# Open-KG

Knowledge Graph compiler — extract structured knowledge from Markdown and text documents using LLMs.

Given a folder of unstructured documents, `kg` generates a structured knowledge graph and lets you query it with natural language.

## Vision

Organizations accumulate knowledge in scattered documents — meeting notes, RFCs, decision logs, project wikis. Open-KG turns that unstructured text into a queryable knowledge graph, automatically. No database, no server, no setup. Just files in, graph out.

Designed for future agent automation: the graph output is deterministic JSON that any tool can consume.

## Quick Start

```bash
npm install && npm run build
export ANTHROPIC_API_KEY=sk-ant-...

npx kg build ./examples              # extract a graph from your docs
npx kg stats                          # see what was extracted
npx kg query "Who works on Project Phoenix?"
npx kg viz                            # open an interactive visualization
```

That's it. No `kg init` required — `build` creates the graph automatically.

## Commands

### `kg build <folder>`

Recursively scans a folder for `.md` and `.txt` files, extracts entities and relationships using an LLM, performs entity resolution, and writes the result to `kg/graph.json`.

```bash
kg build ./docs                       # build from a folder
kg build ./docs --dry-run             # preview which files would be processed
kg build ./docs --model claude-sonnet-4-20250514
```

Features:
- **Incremental rebuilds** — unchanged files are skipped automatically (content hash cache)
- **Dry-run mode** — see what would be processed without calling the LLM
- **Large file warnings** — files over 100KB trigger a warning before extraction

### `kg stats`

Print a quick summary of the graph: node counts, edge counts, entity types, top connected entities, and source documents.

```bash
kg stats
```

### `kg query "<question>"`

Answers a natural language question using only the knowledge graph. Shows which nodes were referenced in the answer.

```bash
kg query "Who works on Project Phoenix?"
kg query "What decisions have been made?" --model claude-sonnet-4-20250514
```

### `kg viz`

Generate an interactive HTML visualization of the graph with a force-directed layout. Nodes are draggable, hoverable, and color-coded by type.

```bash
kg viz                                # writes kg/graph.html
kg viz --format dot                   # writes kg/graph.dot (for Graphviz)
kg viz -o my-graph.html               # custom output path
kg viz --format dot -o -              # DOT to stdout
```

### `kg export`

Outputs the graph to stdout. Supports JSON, Markdown, and DOT formats.

```bash
kg export                             # JSON to stdout
kg export --format markdown           # human-readable tables
kg export --format dot                # Graphviz DOT format
kg export | jq '.nodes | length'      # pipe to jq
```

### `kg init`

Creates the `kg/` directory and an empty `graph.json`. Optional — `build` creates one automatically.

```bash
kg init                               # creates kg/graph.json
kg init --force                       # overwrites existing graph
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

## Ontology (v0)

### Entity Types

| Type | Description |
|------|-------------|
| Person | Individual people |
| Project | Projects and initiatives |
| Task | Work items and tasks |
| Decision | Decisions made by the team |
| Organization | Companies and organizations |
| Document | Documents, RFCs, specs |

### Relationship Types

| Type | Description |
|------|-------------|
| works_on | Person works on a project/task |
| owns | Person owns a project/task/document |
| assigned_to | Task assigned to a person |
| decided | Person/org made a decision |
| mentioned_in | Entity referenced in a document |
| depends_on | Task/decision depends on another |

## Architecture

```
src/
  index.ts          CLI entry point (Commander)
  cli/              Command handlers (init, build, query, export, stats, viz)
  pipeline/         Document loading, extraction orchestration, content caching
  llm/              LLM abstraction interface + Claude implementation
    interface.ts    Swappable LLM provider contract
    prompts.ts      Prompt templates (separated for easy iteration)
    claude.ts       Anthropic SDK integration
  graph/            Type definitions, storage, entity resolution
  query/            Query execution engine
```

**Data flow:**

```
documents → loader → cache check → LLM extraction → ontology validation → entity resolution → graph.json
                                                                                                   ↓
                                                                           question → LLM query → answer
                                                                                                   ↓
                                                                                    viz → graph.html
```

## Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key ([get one here](https://console.anthropic.com/)) |

The `--model` flag on `build` and `query` commands overrides the default model (`claude-sonnet-4-20250514`).

## Development

```bash
npm install        # install dependencies
npm run build      # compile TypeScript
npm run dev        # watch mode
npm test           # run unit tests
```

## Roadmap

- [x] Incremental builds (content hash caching)
- [x] Graph visualization (HTML + DOT export)
- [x] Dry-run preview mode
- [x] Large file warnings
- [ ] Fuzzy entity resolution (Levenshtein / embedding similarity)
- [ ] Custom ontologies (load from config file)
- [ ] Alternative LLM providers (OpenAI, Ollama, local models)
- [ ] Document chunking for large files
- [ ] Confidence scores on extracted entities

## License

MIT
