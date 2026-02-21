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

npx kg init
npx kg build ./examples
npx kg query "Who works on Project Phoenix?"
```

## Commands

### `kg init`

Creates the `kg/` directory and an empty `graph.json`.

```bash
kg init           # creates kg/graph.json
kg init --force   # overwrites existing graph
```

### `kg build <folder>`

Recursively scans a folder for `.md` and `.txt` files, extracts entities and relationships using an LLM, performs entity resolution, and writes the result to `kg/graph.json`.

```bash
kg build ./docs
kg build ./examples --model claude-sonnet-4-20250514
```

### `kg query "<question>"`

Answers a natural language question using only the knowledge graph. Shows which nodes were referenced in the answer.

```bash
kg query "Who works on Project Phoenix?"
kg query "What decisions have been made?" --model claude-sonnet-4-20250514
```

### `kg export`

Outputs the graph to stdout. Supports JSON (default) and Markdown formats.

```bash
kg export                      # JSON to stdout
kg export --format markdown    # human-readable tables
kg export | jq '.nodes | length'
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
  cli/              Command handlers (init, build, query, export)
  pipeline/         Document loading and extraction orchestration
  llm/              LLM abstraction interface + Claude implementation
    interface.ts    Swappable LLM provider contract
    prompts.ts      Prompt templates (separated for easy iteration)
    claude.ts       Anthropic SDK integration
  graph/            Type definitions, storage, entity resolution
  query/            Query execution engine
```

**Data flow:**

```
documents → loader → LLM extraction → ontology validation → entity resolution → graph.json
                                                                                    ↓
                                                            question → LLM query → answer
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
node dist/index.js # run directly
```

## Roadmap

- [ ] Fuzzy entity resolution (Levenshtein / embedding similarity)
- [ ] Incremental builds (content hash caching)
- [ ] Custom ontologies (load from config file)
- [ ] Alternative LLM providers (OpenAI, Ollama, local models)
- [ ] Graph visualization (DOT / HTML export)
- [ ] Document chunking for large files
- [ ] `kg propose` command for non-technical users
- [ ] Confidence scores on extracted entities

## License

MIT
