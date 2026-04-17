/** @format */

import * as assert from "assert";
import * as vscode from "vscode";
import { MessageRouter } from "../MessageRouter";
import { EventMonitor } from "../Utils/EventMonitor";
import { GraphEvents } from "../Utils/GraphEvents";

suite("MessageRouter Test Suite", () => {
  vscode.window.showInformationMessage("Start all MessageRouter tests.");

  test("MessageRouter constructor creates instance", () => {
    const monitor = new EventMonitor();
    const router = new MessageRouter(monitor, async () => {});
    assert.ok(router);
  });

  test("MessageRouter openNodeInEditor rejects empty string", async () => {
    const monitor = new EventMonitor();
    const router = new MessageRouter(monitor, async () => {});
    // Should return without throwing for an empty path
    await assert.doesNotReject(() => router.openNodeInEditor(""));
  });

  test("MessageRouter openNodeInEditor rejects path with control characters", async () => {
    const monitor = new EventMonitor();
    const router = new MessageRouter(monitor, async () => {});
    // Should return without throwing for a path with a null byte
    await assert.doesNotReject(() => router.openNodeInEditor("/some/path\x00evil"));
  });

  test("MessageRouter wireOutbound registers listeners on EventMonitor for all graph events", () => {
    const monitor = new EventMonitor();
    const router = new MessageRouter(monitor, async () => {});

    // Create a minimal mock webview view to capture postMessage calls
    const postedMessages: any[] = [];
    const mockWebviewView = {
      webview: {
        postMessage: (msg: any) => {
          postedMessages.push(msg);
          return Promise.resolve(true);
        },
      },
    } as unknown as vscode.WebviewView;

    router.wireOutbound(mockWebviewView);

    // Emit each notification event and verify it reaches the mock webview
    monitor.emit(GraphEvents.KnowledgeGraphNodeAdded, { id: "n1" });
    assert.strictEqual(postedMessages.length, 1);
    assert.strictEqual(postedMessages[0].command, "addNode");

    monitor.emit(GraphEvents.KnowledgeGraphNodeRemoved, { id: "n1" });
    assert.strictEqual(postedMessages.length, 2);
    assert.strictEqual(postedMessages[1].command, "removeNode");

    monitor.emit(GraphEvents.KnowledgeGraphEdgeAdded, { id: "e1" });
    assert.strictEqual(postedMessages.length, 3);
    assert.strictEqual(postedMessages[2].command, "addEdge");

    monitor.emit(GraphEvents.KnowledgeGraphEdgeRemoved, { id: "e1" });
    assert.strictEqual(postedMessages.length, 4);
    assert.strictEqual(postedMessages[3].command, "removeEdge");

    monitor.emit(GraphEvents.KnowledgeGraphEdgeUpdated, { id: "e1" });
    assert.strictEqual(postedMessages.length, 5);
    assert.strictEqual(postedMessages[4].command, "updateEdge");

    monitor.emit(GraphEvents.KnowledgeGraphCleared);
    assert.strictEqual(postedMessages.length, 6);
    assert.strictEqual(postedMessages[5].command, "clearView");
  });

  test("MessageRouter wireOutbound does not duplicate listeners when removeAllListeners is called first", () => {
    const monitor = new EventMonitor();
    const router = new MessageRouter(monitor, async () => {});

    const messagesFromDuplicationTest: any[] = [];
    const mockWebviewView = {
      webview: {
        postMessage: (msg: any) => {
          messagesFromDuplicationTest.push(msg);
          return Promise.resolve(true);
        },
      },
    } as unknown as vscode.WebviewView;

    // Simulate the hide/show cycle pattern used in resolveWebviewView
    monitor.removeAllListeners();
    router.wireOutbound(mockWebviewView);
    monitor.emit(GraphEvents.KnowledgeGraphNodeAdded, { id: "n1" });
    assert.strictEqual(messagesFromDuplicationTest.length, 1, "Should receive exactly one message after first wiring");

    // Second hide/show cycle
    monitor.removeAllListeners();
    router.wireOutbound(mockWebviewView);
    monitor.emit(GraphEvents.KnowledgeGraphNodeAdded, { id: "n2" });
    assert.strictEqual(
      messagesFromDuplicationTest.length,
      2,
      "Should still receive exactly one message per event after removeAllListeners + re-wire",
    );
  });
});
