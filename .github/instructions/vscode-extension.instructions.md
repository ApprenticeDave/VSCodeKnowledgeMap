---
description: "Use when writing VS Code extension code, registering commands, creating webview providers, handling activation/deactivation, managing disposables, or working with the VS Code API."
applyTo: ["src/extension.ts", "src/KnowledgeMapViewProvider.ts"]
---

<!-- @format -->

# VS Code Extension Patterns

## Activation

- Register all providers, commands, and listeners inside `activate()`
- Push every disposable into `context.subscriptions` for automatic cleanup
- Never do long-running work synchronously in `activate()` — defer with `setTimeout` or event-driven init

## Commands

- Command IDs must match `contributes.commands` in `package.json` exactly
- Always wrap command handlers with error handling — unhandled rejections crash silently

## Webview Providers

- Implement `vscode.WebviewViewProvider` for sidebar views
- Set `webview.options.enableScripts = true` only when scripts are required
- Always set `localResourceRoots` to restrict file access
- Generate a fresh nonce per `getMapViewContent()` call — never reuse
- CSP must include: `default-src 'none'; script-src 'nonce-...' https:; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:;`

## Disposable Management

- Every `vscode.workspace.onDid*` listener returns a disposable — push it to `context.subscriptions`
- If creating resources in a class, implement `dispose()` and clean up EventEmitter listeners
- Never use `vscode.window.createOutputChannel()` outside of activation scope without disposing

## Configuration

- Read via `vscode.workspace.getConfiguration("knowledgeMap")`
- Config keys must match `contributes.configuration.properties` in `package.json`
- Listen for config changes: `vscode.workspace.onDidChangeConfiguration`

## Extension Kind

- This extension is `["ui", "workspace"]` — works in both local and remote scenarios
- Do NOT use `fs` module directly — use `vscode.workspace.fs` for remote compatibility
