# Open-KG — Next Steps

## Status: v0.1 complete and pushed

All 4 CLI commands implemented (`init`, `build`, `query`, `export`), 13/13 tests passing, pushed to `claude/kg-cli-tool-v0.1-SGkdW`.

---

## Immediate: Validate with Real LLM

- [ ] Run `kg build ./examples` with a real `ANTHROPIC_API_KEY`
- [ ] Review extraction quality — check what Claude actually returns
- [ ] Tune prompts in `src/llm/prompts.ts` based on real output
- [ ] Verify entity resolution merges "Alice Chen" across all 3 documents

## Short-term: Harden v0.1

- [ ] Add `LICENSE` file (MIT)
- [ ] Polish per-command help text (`kg build --help`, etc.)
- [ ] Warn on large documents (>100KB) before sending to LLM
- [ ] Add `.npmignore` or `"files"` field in package.json for clean `npm publish`

## v0.2: Key Improvements

- [ ] **Content hash caching** — skip re-extracting unchanged documents on rebuild
- [ ] **Fuzzy entity resolution** — Levenshtein/Jaccard threshold to catch "Alice Chen" vs "Alice C."
- [ ] **`kg viz`** — export to DOT format or simple HTML for graph visualization
- [ ] **`kg propose`** — preview mode that shows extracted entities before writing to graph
- [ ] **Custom ontologies** — load entity/relationship types from a config file

## v0.3+: Bigger Features

- [ ] Alternative LLM providers (OpenAI, Ollama, local models)
- [ ] Document chunking for large files
- [ ] Incremental builds with file watching
- [ ] CI/CD pipeline + npm publish workflow
