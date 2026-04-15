---
description: "Use when editing package.json, updating extension contributions (commands, views, configuration), activation events, or marketplace metadata."
applyTo: "package.json"
---

<!-- @format -->

# Extension Manifest (package.json)

## Contributions Sync

These sections must stay in sync — a mismatch causes silent failures:

- `contributes.commands[].command` ↔ `registerCommand()` calls in `extension.ts`
- `contributes.views` IDs ↔ `registerWebviewViewProvider()` viewType
- `contributes.configuration.properties` keys ↔ `getConfiguration()` reads
- `activationEvents` ↔ actual command/view IDs

## Activation Events

- `onCommand:vscodeknowledgemap.OpenKnowledgeMapAt`
- `onView:vscodeknowledgemap.knowledgeMapView`
- Do NOT use `*` (activates on everything — kills performance)

## Extension Metadata

- `publisher`: `DavidRussell` — must match marketplace publisher account
- `icon`: Must be 128x128px PNG at `images/icon.png`
- `preview`: `true` while pre-release
- `engines.vscode`: `^1.95.0` — minimum VS Code version

## Version Bumping

- Bump `version` field before release (semver: `major.minor.patch`)
- Use `npx vsce publish patch|minor|major` for automated bump + publish
- Or manually edit + `npm run package` for local VSIX

## Dependencies

- `dependencies` are bundled in the VSIX — keep minimal
- `devDependencies` are build-only — types, test tools, linters go here
- `@vscode/vsce` should be in `dependencies` for publish scripts to work
