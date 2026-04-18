/** @format */

import * as assert from "assert";
import * as vscode from "vscode";
import { MarkdownProcessor } from "../StructureParser/ItemTypeProcessors/MarkdownProcessor";
import { EventMonitor } from "../Utils/EventMonitor";

suite("MarkdownProcessor Test Suite", () => {
  vscode.window.showInformationMessage("Start all MarkdownProcessor tests.");

  let eventMonitor: EventMonitor;
  let processor: MarkdownProcessor;

  setup(() => {
    eventMonitor = new EventMonitor();
    processor = new MarkdownProcessor(eventMonitor);
  });

  test("MarkdownProcessor has correct processor name", () => {
    assert.strictEqual(processor.processorName, "MarkdownProcessor");
  });

  test("canProcess returns true for markdown files", () => {
    const uri = vscode.Uri.file("/path/to/file.md");
    assert.strictEqual(processor.canProcess(uri), true);
  });

  test("canProcess returns false for non-markdown files", () => {
    const uri = vscode.Uri.file("/path/to/file.txt");
    assert.strictEqual(processor.canProcess(uri), false);
  });

  test("canProcess returns false for js files", () => {
    const uri = vscode.Uri.file("/path/to/file.js");
    assert.strictEqual(processor.canProcess(uri), false);
  });

  test("ProcessContent emits AddNode events for extracted links", async () => {
    const addedNodes: { uri: string; name: string; type: string }[] = [];
    eventMonitor.on("AddNode", (uri: string, name: string, type: string) => {
      addedNodes.push({ uri, name, type });
    });

    const content = "[Google](https://google.com)";
    const fileUri = vscode.Uri.file("/path/to/readme.md");
    await processor.processContent(fileUri, content);

    assert.strictEqual(addedNodes.length, 1);
    assert.strictEqual(addedNodes[0].uri, "https://google.com");
    assert.strictEqual(addedNodes[0].name, "Google");
    assert.strictEqual(addedNodes[0].type, "link");
  });

  test("ProcessContent emits AddEdge events for extracted links", async () => {
    const addedEdges: {
      sourceUri: string;
      targetUri: string;
      relationship: string;
    }[] = [];
    eventMonitor.on(
      "AddEdge",
      (sourceUri: string, targetUri: string, relationship: string) => {
        addedEdges.push({ sourceUri, targetUri, relationship });
      }
    );

    const content = "[Google](https://google.com)";
    const fileUri = vscode.Uri.file("/path/to/readme.md");
    await processor.processContent(fileUri, content);

    assert.strictEqual(addedEdges.length, 1);
    assert.strictEqual(addedEdges[0].sourceUri, fileUri.fsPath);
    assert.strictEqual(addedEdges[0].targetUri, "https://google.com");
    assert.strictEqual(addedEdges[0].relationship, "reference");
  });

  test("ProcessContent handles multiple links", async () => {
    const addedNodes: { uri: string; name: string; type: string }[] = [];
    eventMonitor.on("AddNode", (uri: string, name: string, type: string) => {
      addedNodes.push({ uri, name, type });
    });

    const content =
      "[Google](https://google.com) and [GitHub](https://github.com)";
    const fileUri = vscode.Uri.file("/path/to/readme.md");
    await processor.processContent(fileUri, content);

    assert.strictEqual(addedNodes.length, 2);
  });

  test("ProcessContent handles content with no links", async () => {
    const addedNodes: { uri: string; name: string; type: string }[] = [];
    eventMonitor.on("AddNode", (uri: string, name: string, type: string) => {
      addedNodes.push({ uri, name, type });
    });

    const content = "This is plain text with no links.";
    const fileUri = vscode.Uri.file("/path/to/readme.md");
    await processor.processContent(fileUri, content);

    assert.strictEqual(addedNodes.length, 0);
  });

  test("ProcessContent handles empty content", async () => {
    const addedNodes: { uri: string; name: string; type: string }[] = [];
    eventMonitor.on("AddNode", (uri: string, name: string, type: string) => {
      addedNodes.push({ uri, name, type });
    });

    const fileUri = vscode.Uri.file("/path/to/readme.md");
    await processor.processContent(fileUri, "");

    assert.strictEqual(addedNodes.length, 0);
  });

  test("ProcessContent deduplicates http and https variants of the same URL", async () => {
    const addedNodes: { uri: string; name: string; type: string }[] = [];
    eventMonitor.on("AddNode", (uri: string, name: string, type: string) => {
      addedNodes.push({ uri, name, type });
    });

    const content =
      "[Google HTTP](http://google.com) and [Google HTTPS](https://google.com)";
    const fileUri = vscode.Uri.file("/path/to/readme.md");
    await processor.processContent(fileUri, content);

    assert.strictEqual(addedNodes.length, 1);
    // Both variants normalize to https://google.com
    assert.strictEqual(addedNodes[0].uri, "https://google.com");
  });

  test("ProcessContent deduplicates www and non-www variants of the same URL", async () => {
    const addedNodes: { uri: string; name: string; type: string }[] = [];
    eventMonitor.on("AddNode", (uri: string, name: string, type: string) => {
      addedNodes.push({ uri, name, type });
    });

    const content =
      "[Google](https://google.com) and [Google WWW](https://www.google.com)";
    const fileUri = vscode.Uri.file("/path/to/readme.md");
    await processor.processContent(fileUri, content);

    assert.strictEqual(addedNodes.length, 1);
    assert.strictEqual(addedNodes[0].uri, "https://google.com");
  });

  test("ProcessContent deduplicates http and https with trailing slash variants", async () => {
    const addedNodes: { uri: string; name: string; type: string }[] = [];
    eventMonitor.on("AddNode", (uri: string, name: string, type: string) => {
      addedNodes.push({ uri, name, type });
    });

    const content =
      "[Site](https://example.com/) and [Site Alt](http://www.example.com)";
    const fileUri = vscode.Uri.file("/path/to/readme.md");
    await processor.processContent(fileUri, content);

    assert.strictEqual(addedNodes.length, 1);
    // Both variants normalize to https://example.com (trailing slash removed)
    assert.strictEqual(addedNodes[0].uri, "https://example.com");
  });

  test("ProcessContent emits the same canonical node ID from two different files linking with different protocols", async () => {
    const addedNodes: { uri: string; name: string; type: string }[] = [];
    eventMonitor.on("AddNode", (uri: string, name: string, type: string) => {
      addedNodes.push({ uri, name, type });
    });

    const fileA = vscode.Uri.file("/path/to/fileA.md");
    const fileB = vscode.Uri.file("/path/to/fileB.md");

    await processor.processContent(fileA, "[Google](http://google.com)");
    await processor.processContent(fileB, "[Google](https://www.google.com)");

    // Both files normalize to the same canonical node ID; the graph receives
    // AddNode("https://google.com") twice but KnowledgeGraph deduplicates by ID.
    assert.strictEqual(addedNodes.length, 2);
    assert.strictEqual(addedNodes[0].uri, "https://google.com");
    assert.strictEqual(addedNodes[1].uri, "https://google.com");
  });

  test("ProcessContent emits reference edges to canonical node ID from multiple files", async () => {
    const addedEdges: {
      sourceUri: string;
      targetUri: string;
      relationship: string;
    }[] = [];
    eventMonitor.on(
      "AddEdge",
      (sourceUri: string, targetUri: string, relationship: string) => {
        addedEdges.push({ sourceUri, targetUri, relationship });
      }
    );

    const fileA = vscode.Uri.file("/path/to/fileA.md");
    const fileB = vscode.Uri.file("/path/to/fileB.md");

    await processor.processContent(fileA, "[Google](http://google.com)");
    await processor.processContent(fileB, "[Google](https://www.google.com)");

    // Each file emits one edge, both pointing to the same canonical node ID.
    assert.strictEqual(addedEdges.length, 2);
    assert.strictEqual(addedEdges[0].sourceUri, fileA.fsPath);
    assert.strictEqual(addedEdges[0].targetUri, "https://google.com");
    assert.strictEqual(addedEdges[1].sourceUri, fileB.fsPath);
    assert.strictEqual(addedEdges[1].targetUri, "https://google.com");
  });
});
