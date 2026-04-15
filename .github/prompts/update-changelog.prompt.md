---
description: "Add a new entry to the CHANGELOG. Formats it under the Unreleased section following Keep a Changelog conventions."
agent: "agent"
tools: [read, edit]
argument-hint: "Change description (e.g. 'Added YAML processor support')"
---

<!-- @format -->

Add the following change to [CHANGELOG.md](../../CHANGELOG.md) under the `[Unreleased]` section:

**$input**

Rules:

- If no `[Unreleased]` heading exists, create one at the top below the title
- Group by type: Added, Changed, Fixed, Removed
- One bullet point per change, concise
- Do NOT modify any existing released version entries
