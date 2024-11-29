# Knowledge Map for Visual Studio Code

Pre-release version of the knowledge and relationship tooling for Visual Studio which tracks relationships between concepts, files, and information within the folder that is open including sub folders.

## Requirements

- Visual Studio Code 1.75 or newer (or editors compatible with VS Code 1.75+ APIs)

## Quick Start

Welcome! 👋🏻
To get started install the extension either from [market place](https://marketplace.visualstudio.com/items?itemName=DavidRussell.vscodeknowledgemap) or

```
code --install-extension DavidRussell.vscodeknowledgemap
```

When the extension starts and there is an open Workspace it will parse your structure.

## Features

### Map View Sidebar

Shows a graph of all the files in a workspace and their relationships relative to the folder structure in a sidebar.

![feature Graph View](images/feature-map-as-sidebar.gif)

### Markdown File Support

Currently extracts links out of markdown files and adds links to files using file fully qualified URI as the Unique Identifier. Also supports external references like http links and creates those as seperate nodes.

```
    [Text](/users/username/desktop/test.md)
```

## Requirements

This extension leverages the [3D Force Directed Graph](https://vasturiano.github.io/3d-force-graph/) javascript library. Thanks to [Vasco Asturiano](https://observablehq.com/@vasturiano) who created this library.

## Telemetry

Visual Studio - Knowledge Map Extension currently does not leverage any telemetry. This may change at some point as I try to learn more about devops automation and github.

## Support Policy

I am currently the only person working on this so I will do my best to get to any issues you identify. If you find a bug feel free to send it my way will try get to it, or feel free to do a pull request.

## Contributing

I welcome your contributions and thank you for working to improve this code.

## ßLicense

MIT
