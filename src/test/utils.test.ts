import * as assert from "assert";
import * as vscode from "vscode";
import { Utils } from "../Utils/Utils";

suite("FileMonitor Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  const ignoreAllTxt = ["**/*.txt"];
  const ignoreAll = ["**/test/**"];

  test("IsIgnored Test Basic wild card", () => {
    const uri = vscode.Uri.file("/Users/daverussell/test/test.txt");
    const result = Utils.isIgnored(uri, ignoreAllTxt);
    assert.strictEqual(result, true);
  });

  test("IsIgnored Test Basic Folder Wild card", () => {
    const uri = vscode.Uri.file("/Users/daverussell/test/test.txt");
    const result = Utils.isIgnored(uri, ignoreAll);
    assert.strictEqual(result, true);
  });

  test("IsIgnored Test Basic wild card passthrough", () => {
    const uri = vscode.Uri.file("/Users/daverussell/test/temp.md");
    const result = Utils.isIgnored(uri, ignoreAllTxt);
    assert.strictEqual(result, false);
  });

  test("IsIgnored Test Basic Folder Wild card Passthrough", () => {
    const uri = vscode.Uri.file("/Users/daverussell/temp/test.txt");
    const result = Utils.isIgnored(uri, ignoreAll);
    assert.strictEqual(result, false);
  });

  test("isJson Test valid json", () => {
    const result = Utils.IsJson('{"test": "test"}');
    assert.strictEqual(result, true);
  });

  test("isJson Test invalid", () => {
    const result = Utils.IsJson('test": "test"}');
    assert.strictEqual(result, true);
  });
});
