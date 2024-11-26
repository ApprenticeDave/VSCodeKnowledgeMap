import * as assert from "assert";
import * as vscode from "vscode";
import { FileMonitor } from "../StructureParser/FileMonitor";

suite("FileMonitor Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  const ignoreAllTxt = ["**/*.txt"];
  const ignoreAll = ["**/test/**"];

  test("IsIgnored Test Basic wild card", () => {
    const uri = vscode.Uri.file("/Users/daverussell/test/test.txt");
    const result = FileMonitor.isIgnored(uri, ignoreAllTxt);
    assert.strictEqual(result, true);
  });

  test("IsIgnored Test Basic Folder Wild card", () => {
    const uri = vscode.Uri.file("/Users/daverussell/test/test.txt");
    const result = FileMonitor.isIgnored(uri, ignoreAll);
    assert.strictEqual(result, true);
  });

  test("IsIgnored Test Basic wild card passthrough", () => {
    const uri = vscode.Uri.file("/Users/daverussell/test/temp.md");
    const result = FileMonitor.isIgnored(uri, ignoreAllTxt);
    assert.strictEqual(result, false);
  });

  test("IsIgnored Test Basic Folder Wild card Passthrough", () => {
    const uri = vscode.Uri.file("/Users/daverussell/temp/test.txt");
    const result = FileMonitor.isIgnored(uri, ignoreAll);
    assert.strictEqual(result, false);
  });
});
