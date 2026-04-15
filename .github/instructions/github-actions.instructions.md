---
description: "Use when editing GitHub Actions workflows, CI/CD pipelines, release automation, or .github/workflows YAML files."
applyTo: ".github/workflows/**"
---

<!-- @format -->

# GitHub Actions Conventions

## Workflow Structure

- Workflows live in `.github/workflows/` — one file per trigger/purpose
- `build_test_main.yml` — CI on every push (cross-platform matrix)
- `release_main.yml` — Publish to marketplace on GitHub Release creation

## Cross-Platform Matrix

```yaml
strategy:
  matrix:
    os: [macos-latest, ubuntu-latest, windows-latest]
```

- Linux needs `xvfb-run -a` wrapper for VS Code test execution
- Conditional: `if: runner.os == 'Linux'` / `if: runner.os != 'Linux'`

## Release Workflow

- Triggers on `release.types: [created]`
- Publish step runs **only on ubuntu-latest** with tag check: `if: success() && startsWith(github.ref, 'refs/tags/') && matrix.os == 'ubuntu-latest'`
- Uses `VSCE_PAT` from GitHub Secrets — never hardcode tokens
- Runs `npm run publish` which calls `npx vsce publish`

## Rules

- Always pin `actions/checkout` and `actions/setup-node` with `@v4`
- Use Node.js 18.x (matches engines in package.json)
- Run `npm install` before build/test steps
- Tests must pass on ALL matrix OS before release publish runs
- Never add `continue-on-error: true` to test steps
