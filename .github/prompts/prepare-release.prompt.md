---
description: "Prepare a release for the VS Code extension. Bumps version, updates CHANGELOG, packages VSIX, and presents git commands."
agent: "release-manager"
argument-hint: "Release type: patch, minor, or major"
---

<!-- @format -->

Prepare a **$input** release for the Knowledge Map extension.

1. Verify tests pass
2. Bump the version in [package.json](../../package.json)
3. Update [CHANGELOG.md](../../CHANGELOG.md) with a dated release heading
4. Package the VSIX
5. Present the git commit/tag/push commands for user confirmation
