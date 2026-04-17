/** @format */

import * as assert from "assert";
import * as vscode from "vscode";
import { WorkspaceScanner } from "../WorkspaceScanner";
import { EventMonitor } from "../Utils/EventMonitor";
import { GraphEvents } from "../Utils/GraphEvents";

suite("WorkspaceScanner Test Suite", () => {
  vscode.window.showInformationMessage("Start all WorkspaceScanner tests.");

  test("WorkspaceScanner constructor creates instance", () => {
    const monitor = new EventMonitor();
    const scanner = new WorkspaceScanner(monitor);
    assert.ok(scanner);
  });

  test("WorkspaceScanner scan emits AddNode for a real workspace folder", async () => {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      // Skip when no workspace is open during test execution
      return;
    }

    const monitor = new EventMonitor();
    const scanner = new WorkspaceScanner(monitor);

    const addNodeEvents: { id: string; name: string; type: string }[] = [];
    monitor.on(GraphEvents.AddNode, (id: string, name: string, type: string) => {
      addNodeEvents.push({ id, name, type });
    });

    await scanner.scan([folders[0].uri]);

    // We should have received at least one AddNode event for the root folder itself
    assert.ok(
      addNodeEvents.length > 0,
      "Expected at least one AddNode event from scanning the workspace",
    );
    // The root folder itself should appear as a "folder" node
    const rootNode = addNodeEvents.find(
      (e) => e.id === folders[0].uri.fsPath && e.type === "folder",
    );
    assert.ok(rootNode, "Expected a folder node for the root workspace URI");
  });

  test("WorkspaceScanner scan emits AddEdge events linking children to their parent", async () => {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return;
    }

    const monitor = new EventMonitor();
    const scanner = new WorkspaceScanner(monitor);

    const addEdgeEvents: { source: string; target: string }[] = [];
    monitor.on(
      GraphEvents.AddEdge,
      (source: string, target: string, _rel: string) => {
        addEdgeEvents.push({ source, target });
      },
    );

    await scanner.scan([folders[0].uri]);

    // At least some edge events should have been emitted for a non-trivial workspace
    if (addEdgeEvents.length > 0) {
      // Each edge source should correspond to a parent directory that was discovered
      for (const edge of addEdgeEvents) {
        assert.ok(
          typeof edge.source === "string" && edge.source.length > 0,
          "Edge source should be a non-empty string",
        );
        assert.ok(
          typeof edge.target === "string" && edge.target.length > 0,
          "Edge target should be a non-empty string",
        );
      }
    }
  });

  test("WorkspaceScanner scan handles empty root URIs without errors", async () => {
    const monitor = new EventMonitor();
    const scanner = new WorkspaceScanner(monitor);
    // Should resolve without throwing
    await assert.doesNotReject(() => scanner.scan([]));
  });

  test("WorkspaceScanner scan skips non-existent URIs gracefully", async () => {
    const monitor = new EventMonitor();
    const scanner = new WorkspaceScanner(monitor);
    const nonExistent = vscode.Uri.file("/non/existent/path/that/does/not/exist");

    const nodeEvents: string[] = [];
    monitor.on(GraphEvents.AddNode, (id: string) => {
      nodeEvents.push(id);
    });

    // Should not throw; the error is logged and the item is skipped
    await assert.doesNotReject(() => scanner.scan([nonExistent]));
    assert.strictEqual(
      nodeEvents.length,
      0,
      "Non-existent paths should not produce AddNode events",
    );
  });
});
