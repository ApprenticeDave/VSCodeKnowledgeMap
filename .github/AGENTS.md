# VSCodeKnowledgeMap — Project Guidelines

## Overview

VS Code extension that parses workspace files/folders and renders a 3D interactive knowledge graph of relationships using [3D Force Directed Graph](https://vasturiano.github.io/3d-force-graph/). Currently supports markdown link extraction; new file types are added via the `iLinker` processor interface.

## Architecture

```
src/
  extension.ts                  → Activation, command registration, workspace listener
  KnowledgeMapViewProvider.ts   → Webview lifecycle, graph generation, message passing
  KnowledgeGraph/               → Data model (Node, Edge, KnowledgeGraph)
  StructureParser/              → File processing pipeline (ItemProcessor + iLinker)
    ItemTypeProcessors/         → Per-filetype processors (MarkdownProcessor, etc.)
  Utils/                        → EventMonitor (event bus), Logger, glob matching
media/
  script.js                     → 3D Force Graph webview (vanilla JS, Three.js)
  style.css                     → Webview styles (uses VS Code theme vars)
```

**Key patterns:**
- **Event bus**: `EventMonitor` (extends `EventEmitter`) drives all data flow between graph model → webview
- **Pluggable processors**: Implement `iLinker` interface (`canProcess`, `ProcessContent`, `ProcesscorName`) and register in `ItemProcessor.processors[]`
- **Concurrency**: `ItemProcessor` uses a manual task queue with configurable max workers
- **Webview security**: Nonce-based CSP, message passing via `postMessage`/`onDidReceiveMessage`

## Code Style

- **Strict TypeScript** (`strict: true` in tsconfig)
- Classes: `PascalCase` — Interfaces: `iPascalCase` prefix — Methods: `camelCase`
- Event names: `CamelCase` strings (e.g. `"KnowledgeGraphNodeAdded"`)
- Enforce curly braces, strict equality (`===`), semicolons (ESLint)
- Use `async/await` for all I/O, never raw callbacks

## Build & Test

```bash
npm run compile     # One-time TypeScript build
npm run watch       # Background watch mode
npm run lint        # ESLint (src/)
npm run test        # Mocha via @vscode/test-cli (compiles + lints first)
```

- Tests live in `src/test/` using Mocha + `assert`
- Test files: `*.test.ts` — suites use `suite()` / `test()` style
- Always run `npm run pretest` (compile + lint) before testing

## Conventions

- Node IDs are URI path strings; equality is by ID
- Edge relationship types: `"contain"` (folder→file), `"reference"` (file→link)
- Node types: `"file"`, `"folder"`, `"link"`
- Processors declare glob patterns (e.g. `["**/*.md"]`) checked via `micromatch`
- Graph rebuilds from scratch on activation (no persistence layer yet)
- Webview frontend is vanilla JS — no bundler, no framework
- CDN resources use SHA384 integrity hashes

## Known Gaps

- No file watcher — graph doesn't update on file changes after initial build
- Only `MarkdownProcessor` exists — other file types not yet supported
- No integration tests — only unit tests for Node and Utils

## GitHub DevOps

- **Repository**: [ApprenticeDave/VSCodeKnowledgeMap](https://github.com/ApprenticeDave/VSCodeKnowledgeMap)
- **CI**: GitHub Actions — `build_test_main.yml` runs on every push (matrix: macOS, Ubuntu, Windows)
- **Release**: `release_main.yml` triggers on GitHub Release creation → publishes to VS Code Marketplace via `VSCE_PAT` secret
- **Marketplace**: Publisher `DavidRussell`, extension `vscodeknowledgemap`
- **Issue templates**: Bug report + Feature request in `.github/ISSUE_TEMPLATE/`
- **PR template**: `.github/pull_request_template.md` — self-review checklist

### Versioning & Releases
- Version lives in `package.json` (`"version": "x.y.z"`)
- Pre-release flag: `"preview": true`
- CHANGELOG follows [Keep a Changelog](https://keepachangelog.com/) loosely — update before each release
- Tag format: `vX.Y.Z` — creating a GitHub Release with this tag triggers marketplace publish
- Local packaging: `npm run package` / publish tasks in `.vscode/tasks.json`

### Workflow Rules
- **All work happens on `master`** — do not create feature branches; commit directly to the main branch
- GitHub Actions workflows live in `.github/workflows/` — YAML format
- Tests **must** pass on all three OS matrices before merge
- Linux CI uses `xvfb-run -a` for headless VS Code test execution
- Never commit `VSCE_PAT` or other secrets — use GitHub Secrets only