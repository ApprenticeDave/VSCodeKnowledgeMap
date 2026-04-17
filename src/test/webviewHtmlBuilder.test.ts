/** @format */

import * as assert from "assert";
import * as vscode from "vscode";
import { WebviewHtmlBuilder } from "../WebviewHtmlBuilder";

suite("WebviewHtmlBuilder Test Suite", () => {
  vscode.window.showInformationMessage("Start all WebviewHtmlBuilder tests.");

  test("WebviewHtmlBuilder constructor creates instance", () => {
    const builder = new WebviewHtmlBuilder();
    assert.ok(builder);
  });

  test("getNonce returns a 32-character alphanumeric string", () => {
    const builder = new WebviewHtmlBuilder();
    const nonce = builder.getNonce();
    assert.strictEqual(nonce.length, 32);
    assert.match(nonce, /^[A-Za-z0-9]{32}$/);
  });

  test("getNonce returns a different value on each call", () => {
    const builder = new WebviewHtmlBuilder();
    const nonce1 = builder.getNonce();
    const nonce2 = builder.getNonce();
    // Extremely unlikely to collide for a 32-char alphanumeric random string
    assert.notStrictEqual(nonce1, nonce2);
  });
});
