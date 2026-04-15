/** @format */

import * as assert from "assert";
import * as vscode from "vscode";
import { EventMonitor } from "../Utils/EventMonitor";

suite("EventMonitor Test Suite", () => {
  vscode.window.showInformationMessage("Start all EventMonitor tests.");

  test("EventMonitor constructor creates instance", () => {
    const monitor = new EventMonitor();
    assert.ok(monitor);
  });

  test("EventMonitor notifyChange emits event with data", () => {
    const monitor = new EventMonitor();
    let receivedData: any = null;

    monitor.on("TestEvent", (data: any) => {
      receivedData = data;
    });

    monitor.notifyChange("TestEvent", { key: "value" });

    assert.deepStrictEqual(receivedData, { key: "value" });
  });

  test("EventMonitor notifyChange emits event with null data", () => {
    const monitor = new EventMonitor();
    let called = false;
    let receivedData: any = "not-null";

    monitor.on("NullEvent", (data: any) => {
      called = true;
      receivedData = data;
    });

    monitor.notifyChange("NullEvent", null);

    assert.strictEqual(called, true);
    assert.strictEqual(receivedData, null);
  });

  test("EventMonitor listeners can be registered and triggered multiple times", () => {
    const monitor = new EventMonitor();
    let callCount = 0;

    monitor.on("RepeatEvent", () => {
      callCount++;
    });

    monitor.notifyChange("RepeatEvent", null);
    monitor.notifyChange("RepeatEvent", null);
    monitor.notifyChange("RepeatEvent", null);

    assert.strictEqual(callCount, 3);
  });

  test("EventMonitor supports multiple listeners for the same event", () => {
    const monitor = new EventMonitor();
    let listener1Called = false;
    let listener2Called = false;

    monitor.on("MultiEvent", () => {
      listener1Called = true;
    });

    monitor.on("MultiEvent", () => {
      listener2Called = true;
    });

    monitor.notifyChange("MultiEvent", null);

    assert.strictEqual(listener1Called, true);
    assert.strictEqual(listener2Called, true);
  });

  test("EventMonitor events do not cross event types", () => {
    const monitor = new EventMonitor();
    let called = false;

    monitor.on("EventA", () => {
      called = true;
    });

    monitor.notifyChange("EventB", null);

    assert.strictEqual(called, false);
  });
});
