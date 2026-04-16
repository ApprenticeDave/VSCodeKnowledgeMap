/** @format */

import * as assert from "assert";
import * as vscode from "vscode";
import { Edge } from "../KnowledgeGraph/Edge";
import { Node } from "../KnowledgeGraph/Node";

suite("Edge Test Suite", () => {
  vscode.window.showInformationMessage("Start all Edge tests.");

  test("Edge constructor initializes with parameters", () => {
    const source = new Node("src-1", "Source Node", "file");
    const target = new Node("tgt-1", "Target Node", "file");
    const edge = new Edge("edge-1", source, target, "contains", 5);

    assert.strictEqual(edge.id, "edge-1");
    assert.strictEqual(edge.source, source);
    assert.strictEqual(edge.target, target);
    assert.strictEqual(edge.relationship, "contains");
    assert.strictEqual(edge.weight, 5);
  });

  test("Edge constructor sets default values", () => {
    const source = new Node("src-1", "Source Node", "file");
    const target = new Node("tgt-1", "Target Node", "file");
    const edge = new Edge("edge-1", source, target);

    assert.strictEqual(edge.weight, 1);
    assert.strictEqual(edge.curvature, 0.8);
    assert.strictEqual(edge.rotation, 0);
    assert.strictEqual(edge.particles, 1);
  });

  test("Edge constructor with source only (no target, relationship, weight)", () => {
    const source = new Node("src-1", "Source Node", "file");
    const edge = new Edge("edge-1", source);

    assert.strictEqual(edge.id, "edge-1");
    assert.strictEqual(edge.source, source);
    assert.strictEqual(edge.target, undefined);
    assert.strictEqual(edge.relationship, undefined);
  });

  test("Edge constructor initializes from JSON", () => {
    const json = JSON.stringify({
      id: "edge-json",
      source: { id: "src-1", name: "Source" },
      target: { id: "tgt-1", name: "Target" },
      relationship: "references",
    });
    const edge = new Edge(json);

    assert.strictEqual(edge.id, "edge-json");
    assert.ok(edge.source instanceof Node);
    assert.strictEqual(edge.source.id, "src-1");
    assert.strictEqual(edge.source.name, "Source");
    assert.ok(edge.target instanceof Node);
    assert.strictEqual(edge.target.id, "tgt-1");
    assert.strictEqual(edge.target.name, "Target");
    assert.strictEqual(edge.relationship, "references");
  });

  test("Edge constructor from JSON source and target have Node methods", () => {
    const json = JSON.stringify({
      id: "edge-json",
      source: { id: "src-1", name: "Source" },
      target: { id: "tgt-1", name: "Target" },
    });
    const edge = new Edge(json);

    assert.ok(typeof edge.source.equals === "function");
    assert.ok(typeof edge.target.equals === "function");
    assert.ok(edge.source.equals(new Node("src-1", "Source")));
  });

  test("Edge toJson returns valid JSON string", () => {
    const source = new Node("src-1", "Source Node", "file");
    const target = new Node("tgt-1", "Target Node", "file");
    const edge = new Edge("edge-1", source, target, "contains");

    const json = edge.toJson();
    const parsed = JSON.parse(json);

    assert.strictEqual(parsed.id, "edge-1");
    assert.strictEqual(parsed.source.id, "src-1");
    assert.strictEqual(parsed.target.id, "tgt-1");
    assert.strictEqual(parsed.relationship, "contains");
  });

  test("Edge to3DForceGraphLink returns correct link format", () => {
    const source = new Node("src-1", "Source Node", "file");
    const target = new Node("tgt-1", "Target Node", "file");
    const edge = new Edge("edge-1", source, target, "contains");

    const link = edge.to3DForceGraphLink();
    const parsed = JSON.parse(link);

    assert.strictEqual(parsed.source, "src-1");
    assert.strictEqual(parsed.target, "tgt-1");
  });

  test("Edge constructor throws on invalid JSON", () => {
    assert.throws(() => {
      new Edge("not-valid-json");
    });
  });

  test("Edge with relationship parameter", () => {
    const source = new Node("src-1", "Source", "file");
    const target = new Node("tgt-1", "Target", "file");
    const edge = new Edge("edge-1", source, target, "reference");

    assert.strictEqual(edge.relationship, "reference");
  });
});
