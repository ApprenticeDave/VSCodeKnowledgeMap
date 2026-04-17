/** @format */

import * as assert from "assert";
import * as vscode from "vscode";
import { EventMonitor } from "../Utils/EventMonitor";
import { GraphEvents } from "../Utils/GraphEvents";

suite("EventMonitor Test Suite", () => {
  vscode.window.showInformationMessage("Start all EventMonitor tests.");

  test("EventMonitor constructor creates instance", () => {
    const monitor = new EventMonitor();
    assert.ok(monitor);
  });

  test("EventMonitor notifyChange emits event with data", () => {
    const monitor = new EventMonitor();
    let receivedData: any = null;

    monitor.on(GraphEvents.AddNode, (data: any) => {
      receivedData = data;
    });

    monitor.notifyChange(GraphEvents.AddNode, { key: "value" });

    assert.deepStrictEqual(receivedData, { key: "value" });
  });

  test("EventMonitor notifyChange emits event with null data", () => {
    const monitor = new EventMonitor();
    let called = false;
    let receivedData: any = "not-null";

    monitor.on(GraphEvents.DeleteNode, (data: any) => {
      called = true;
      receivedData = data;
    });

    monitor.notifyChange(GraphEvents.DeleteNode, null);

    assert.strictEqual(called, true);
    assert.strictEqual(receivedData, null);
  });

  test("EventMonitor listeners can be registered and triggered multiple times", () => {
    const monitor = new EventMonitor();
    let callCount = 0;

    monitor.on(GraphEvents.AddEdge, () => {
      callCount++;
    });

    monitor.notifyChange(GraphEvents.AddEdge, null);
    monitor.notifyChange(GraphEvents.AddEdge, null);
    monitor.notifyChange(GraphEvents.AddEdge, null);

    assert.strictEqual(callCount, 3);
  });

  test("EventMonitor supports multiple listeners for the same event", () => {
    const monitor = new EventMonitor();
    let listener1Called = false;
    let listener2Called = false;

    monitor.on(GraphEvents.KnowledgeGraphNodeAdded, () => {
      listener1Called = true;
    });

    monitor.on(GraphEvents.KnowledgeGraphNodeAdded, () => {
      listener2Called = true;
    });

    monitor.notifyChange(GraphEvents.KnowledgeGraphNodeAdded, null);

    assert.strictEqual(listener1Called, true);
    assert.strictEqual(listener2Called, true);
  });

  test("EventMonitor events do not cross event types", () => {
    const monitor = new EventMonitor();
    let called = false;

    monitor.on(GraphEvents.AddEdge, () => {
      called = true;
    });

    monitor.notifyChange(GraphEvents.RemoveEdge, null);

    assert.strictEqual(called, false);
  });
});
