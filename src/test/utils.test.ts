import * as assert from "assert";
import * as vscode from "vscode";
import { Utils } from "../Utils/Utils";

suite("FileMonitor Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  const ignoreAllTxt = ["**/*.txt"];
  const ignoreAllTestFolder = ["**/test/**"];
  const ignoreDotFolder = ["**/.vscode/**"];
  const goodSimpleJson = '{"test": "test"}';
  const badSimpleJson = 'test": "test"}';

  test("IsMatched Test Basic wild card", () => {
    const uri = "/Users/username/test/test.txt";
    const result = Utils.isMatched(uri, ignoreAllTxt);
    assert.strictEqual(result, true);
  });

  test("IsMatched Test Basic Folder Wild card", () => {
    const uri = "/Users/username/test/test.txt";
    const result = Utils.isMatched(uri, ignoreAllTestFolder);
    assert.strictEqual(result, true);
  });

  test("IsMatched Test Basic wild card passthrough", () => {
    const uri = "/Users/username/test/temp.md";
    const result = Utils.isMatched(uri, ignoreAllTxt);
    assert.strictEqual(result, false);
  });

  test("IsMatched Test Basic Folder Wild card Passthrough", () => {
    const uri = "/Users/username/temp/test.txt";
    const result = Utils.isMatched(uri, ignoreAllTestFolder);
    assert.strictEqual(result, false);
  });

  test("IsMatched Test Dot Folder Wild card", () => {
    const uri = "/Users/username/temp/.vscode";
    const result = Utils.isMatched(uri, ignoreDotFolder);
    assert.strictEqual(result, true);
  });

  test("IsMatched Test Dot Folder Subfolders Wild card", () => {
    const uri = "/Users/username/temp/.vscode/settings.json";
    const result = Utils.isMatched(uri, ignoreDotFolder);
    assert.strictEqual(result, true);
  });

  test("isJson Test valid json", () => {
    const result = Utils.IsJson(goodSimpleJson);
    assert.strictEqual(result, true);
  });

  test("isJson Test invalid", () => {
    const result = Utils.IsJson(badSimpleJson);
    assert.strictEqual(result, false);
  });
});
