import * as assert from "assert";
import * as vscode from "vscode";
import { Node } from "../KnowledgeGraph/Node";

suite("Extension - Node Test Suite", () => {
  vscode.window.showInformationMessage("Start all Node.");

  test("Node constructor initializes properties correctly", () => {
    const id = "1";
    const name = "Test Node";
    const type = "file"; // Adjust based on your NodeType enum
    const node = new Node(id, name, type);

    assert.equal(node.id, id);
    assert.equal(node.name, name);
    assert.equal(node.nodetype, type);
  });

  test("Node constructor initializes JSON correctly", () => {
    const nodeToJson = {
      id: "4",
      name: "Deserialized Node",
      nodetype: "file",
    };

    const nodeJson = JSON.stringify(nodeToJson);

    const node = new Node(nodeJson);

    assert.equal(node.id, "4");
    assert.equal(node.name, "Deserialized Node");
    assert.equal(node.nodetype, "file");
  });

  test("Node equality check", () => {
    const nodeA = new Node("5", "Equal Node");
    const nodeB = new Node("5", "Equal Node");
    assert.equal(nodeA.equals(nodeB), true);
  });

  test("Node properties can be updated", () => {
    const node = new Node("8", "Updatable Node", "file");

    node.name = "Updated Node Name";
    node.nodetype = "folder";

    assert.equal(node.name === "Updated Node Name", true);
    assert.equal(node.nodetype === "folder", true);
  });

  test("Creating multiple Node instances performs under threshold", () => {
    const NUM_NODES = 10000;
    const startTime = performance.now();

    for (let i = 0; i < NUM_NODES; i++) {
      new Node(`node-${i}`, `Node ${i}`);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    assert.ok(duration < 1000);
  });
});
