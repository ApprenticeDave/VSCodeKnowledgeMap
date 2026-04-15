import * as assert from "assert";
import * as vscode from "vscode";
import { Utils } from "../Utils/Utils";

suite("Utils Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  const ignoreAllTxtPattern = ["**/*.txt"];
  const ignoreAllTestFolderPattern = ["**/test/**"];
  const ignoreDotFolderPattern = ["**/.vscode/**"];
  const matchMarkdownPattern = ["**/*.md"];
  const goodSimpleJson = '{"test": "test"}';
  const badSimpleJson = 'test": "test"}';

  test("IsMatched Test Basic wild card", () => {
    const uri = "/Users/username/test/test.txt";
    const result = Utils.isMatched(uri, ignoreAllTxtPattern);
    assert.strictEqual(result, true);
  });

  test("IsMatched Test Basic Folder Wild card", () => {
    const uri = "/Users/username/test/test.txt";
    const result = Utils.isMatched(uri, ignoreAllTestFolderPattern);
    assert.strictEqual(result, true);
  });

  test("IsMatched Test Basic wild card passthrough", () => {
    const uri = "/Users/username/test/temp.md";
    const result = Utils.isMatched(uri, ignoreAllTxtPattern);
    assert.strictEqual(result, false);
  });

  test("IsMatched Test Basic Folder Wild card Passthrough", () => {
    const uri = "/Users/username/temp/test.txt";
    const result = Utils.isMatched(uri, ignoreAllTestFolderPattern);
    assert.strictEqual(result, false);
  });

  test("IsMatched Test Dot Folder Wild card", () => {
    const uri = "/Users/username/temp/.vscode";
    const result = Utils.isMatched(uri, ignoreDotFolderPattern);
    assert.strictEqual(result, true);
  });

  test("IsMatched Test Dot Folder Subfolders Wild card", () => {
    const uri = "/Users/username/temp/.vscode/settings.json";
    const result = Utils.isMatched(uri, ignoreDotFolderPattern);
    assert.strictEqual(result, true);
  });

  test("IsMatched Test Markdown File Name", () => {
    const uri = "/Users/username/temp/test.md";
    const result = Utils.isMatched(uri, matchMarkdownPattern);
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

  test("isJson Test null input returns false", () => {
    const result = Utils.IsJson(null);
    assert.strictEqual(result, false);
  });

  test("isJson Test undefined input returns false", () => {
    const result = Utils.IsJson(undefined);
    assert.strictEqual(result, false);
  });

  test("isJson Test empty string returns false", () => {
    const result = Utils.IsJson("");
    assert.strictEqual(result, false);
  });

  test("isJson Test array json returns true", () => {
    const result = Utils.IsJson('[1, 2, 3]');
    assert.strictEqual(result, true);
  });

  test("isJson Test number string returns false", () => {
    const result = Utils.IsJson("42");
    assert.strictEqual(result, false);
  });

  test("isJson Test boolean string returns false", () => {
    const result = Utils.IsJson("true");
    assert.strictEqual(result, false);
  });

  test("isMatched with empty patterns returns false", () => {
    const uri = "/Users/username/test/test.txt";
    const result = Utils.isMatched(uri, []);
    assert.strictEqual(result, false);
  });
});
