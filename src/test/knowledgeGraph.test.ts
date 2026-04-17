/** @format */

import * as assert from "assert";
import * as vscode from "vscode";
import { KnowledgeGraph } from "../KnowledgeGraph/KnowledgeGraph";
import { Node } from "../KnowledgeGraph/Node";
import { Edge } from "../KnowledgeGraph/Edge";
import { EventMonitor } from "../Utils/EventMonitor";
import { GraphEvents } from "../Utils/GraphEvents";

suite("KnowledgeGraph Test Suite", () => {
  vscode.window.showInformationMessage("Start all KnowledgeGraph tests.");

  let eventMonitor: EventMonitor;
  let graph: KnowledgeGraph;

  setup(() => {
    eventMonitor = new EventMonitor();
    graph = new KnowledgeGraph(eventMonitor);
  });

  test("KnowledgeGraph constructor creates empty graph", () => {
    assert.deepStrictEqual(graph.getNodes(), []);
    assert.deepStrictEqual(graph.getEdges(), []);
  });

  test("addNode adds a node to the graph", () => {
    const node = new Node("node-1", "Test Node", "file");
    graph.addNode(node);

    const nodes = graph.getNodes();
    assert.strictEqual(nodes.length, 1);
    assert.strictEqual(nodes[0].id, "node-1");
  });

  test("addNode does not add duplicate nodes", () => {
    const node1 = new Node("node-1", "Test Node", "file");
    const node2 = new Node("node-1", "Duplicate Node", "file");
    graph.addNode(node1);
    graph.addNode(node2);

    const nodes = graph.getNodes();
    assert.strictEqual(nodes.length, 1);
    assert.strictEqual(nodes[0].name, "Test Node");
  });

  test("addNode emits KnowledgeGraphNodeAdded event", () => {
    let emittedNode: any = null;
    eventMonitor.on(GraphEvents.KnowledgeGraphNodeAdded, (node: any) => {
      emittedNode = node;
    });

    const node = new Node("node-1", "Test Node", "file");
    graph.addNode(node);

    assert.ok(emittedNode);
    assert.strictEqual(emittedNode.id, "node-1");
  });

  test("removeNode removes a node from the graph", () => {
    const node = new Node("node-1", "Test Node", "file");
    graph.addNode(node);
    assert.strictEqual(graph.getNodes().length, 1);

    graph.removeNode(node);
    assert.strictEqual(graph.getNodes().length, 0);
  });

  test("removeNode emits KnowledgeGraphNodeRemoved event", () => {
    let emittedNode: any = null;
    eventMonitor.on(GraphEvents.KnowledgeGraphNodeRemoved, (node: any) => {
      emittedNode = node;
    });

    const node = new Node("node-1", "Test Node", "file");
    graph.addNode(node);
    graph.removeNode(node);

    assert.ok(emittedNode);
    assert.strictEqual(emittedNode.id, "node-1");
  });

  test("removeNode does nothing for non-existent node", () => {
    const node = new Node("node-1", "Test Node", "file");
    graph.removeNode(node);

    assert.strictEqual(graph.getNodes().length, 0);
  });

  test("removeNode removes associated contains edges", () => {
    const parent = new Node("parent-1", "Parent", "folder");
    const child = new Node("child-1", "Child", "file");
    graph.addNode(parent);
    graph.addNode(child);

    const edge = new Edge("edge-1", parent, child, "contains");
    graph.addEdge(edge);
    assert.strictEqual(graph.getEdges().length, 1);

    graph.removeNode(parent);
    assert.strictEqual(graph.getNodes().length, 1);
    assert.strictEqual(graph.getEdges().length, 0);
  });

  test("addEdge adds an edge between existing nodes", () => {
    const source = new Node("src-1", "Source", "file");
    const target = new Node("tgt-1", "Target", "file");
    graph.addNode(source);
    graph.addNode(target);

    const edge = new Edge("edge-1", source, target, "contains");
    graph.addEdge(edge);

    assert.strictEqual(graph.getEdges().length, 1);
    assert.strictEqual(graph.getEdges()[0].id, "edge-1");
  });

  test("addEdge does not add edge if source node missing", () => {
    const source = new Node("src-1", "Source", "file");
    const target = new Node("tgt-1", "Target", "file");
    graph.addNode(target);

    const edge = new Edge("edge-1", source, target, "contains");
    graph.addEdge(edge);

    assert.strictEqual(graph.getEdges().length, 0);
  });

  test("addEdge does not add edge if target node missing", () => {
    const source = new Node("src-1", "Source", "file");
    const target = new Node("tgt-1", "Target", "file");
    graph.addNode(source);

    const edge = new Edge("edge-1", source, target, "contains");
    graph.addEdge(edge);

    assert.strictEqual(graph.getEdges().length, 0);
  });

  test("addEdge emits KnowledgeGraphEdgeAdded event", () => {
    let emittedEdge: any = null;
    eventMonitor.on(GraphEvents.KnowledgeGraphEdgeAdded, (edge: any) => {
      emittedEdge = edge;
    });

    const source = new Node("src-1", "Source", "file");
    const target = new Node("tgt-1", "Target", "file");
    graph.addNode(source);
    graph.addNode(target);

    const edge = new Edge("edge-1", source, target, "contains");
    graph.addEdge(edge);

    assert.ok(emittedEdge);
    assert.strictEqual(emittedEdge.id, "edge-1");
  });

  test("removeEdge removes an edge from the graph", () => {
    const source = new Node("src-1", "Source", "file");
    const target = new Node("tgt-1", "Target", "file");
    graph.addNode(source);
    graph.addNode(target);

    const edge = new Edge("edge-1", source, target, "contains");
    graph.addEdge(edge);
    assert.strictEqual(graph.getEdges().length, 1);

    graph.removeEdge(edge);
    assert.strictEqual(graph.getEdges().length, 0);
  });

  test("removeEdge emits KnowledgeGraphEdgeRemoved event", () => {
    let emittedEdge: any = null;
    eventMonitor.on(GraphEvents.KnowledgeGraphEdgeRemoved, (edge: any) => {
      emittedEdge = edge;
    });

    const source = new Node("src-1", "Source", "file");
    const target = new Node("tgt-1", "Target", "file");
    graph.addNode(source);
    graph.addNode(target);

    const edge = new Edge("edge-1", source, target, "contains");
    graph.addEdge(edge);
    graph.removeEdge(edge);

    assert.ok(emittedEdge);
    assert.strictEqual(emittedEdge.id, "edge-1");
  });

  test("updateEdge updates an existing edge", () => {
    const source = new Node("src-1", "Source", "file");
    const target = new Node("tgt-1", "Target", "file");
    graph.addNode(source);
    graph.addNode(target);

    const edge = new Edge("edge-1", source, target, "contains");
    graph.addEdge(edge);

    edge.weight = 10;
    graph.updateEdge(edge);

    const edges = graph.getEdges();
    assert.strictEqual(edges.length, 1);
    assert.strictEqual(edges[0].weight, 10);
  });

  test("updateEdge emits KnowledgeGraphEdgeUpdated event", () => {
    let emittedEdge: any = null;
    eventMonitor.on(GraphEvents.KnowledgeGraphEdgeUpdated, (edge: any) => {
      emittedEdge = edge;
    });

    const source = new Node("src-1", "Source", "file");
    const target = new Node("tgt-1", "Target", "file");
    graph.addNode(source);
    graph.addNode(target);

    const edge = new Edge("edge-1", source, target, "contains");
    graph.addEdge(edge);

    edge.weight = 10;
    graph.updateEdge(edge);

    assert.ok(emittedEdge);
    assert.strictEqual(emittedEdge.weight, 10);
  });

  test("clearGraph removes all nodes and edges", () => {
    const source = new Node("src-1", "Source", "file");
    const target = new Node("tgt-1", "Target", "file");
    graph.addNode(source);
    graph.addNode(target);

    const edge = new Edge("edge-1", source, target, "contains");
    graph.addEdge(edge);

    graph.clearGraph();

    assert.strictEqual(graph.getNodes().length, 0);
    assert.strictEqual(graph.getEdges().length, 0);
  });

  test("clearGraph emits KnowledgeGraphCleared event", () => {
    let cleared = false;
    eventMonitor.on(GraphEvents.KnowledgeGraphCleared, () => {
      cleared = true;
    });

    graph.clearGraph();

    assert.strictEqual(cleared, true);
  });

  test("getEdgesForNode returns edges connected to a node", () => {
    const nodeA = new Node("a", "Node A", "file");
    const nodeB = new Node("b", "Node B", "file");
    const nodeC = new Node("c", "Node C", "file");
    graph.addNode(nodeA);
    graph.addNode(nodeB);
    graph.addNode(nodeC);

    const edge1 = new Edge("edge-1", nodeA, nodeB, "contains");
    const edge2 = new Edge("edge-2", nodeB, nodeC, "contains");
    graph.addEdge(edge1);
    graph.addEdge(edge2);

    const edgesForA = graph.getEdgesForNode(nodeA);
    assert.strictEqual(edgesForA.length, 1);
    assert.strictEqual(edgesForA[0].id, "edge-1");

    const edgesForB = graph.getEdgesForNode(nodeB);
    assert.strictEqual(edgesForB.length, 2);

    const edgesForC = graph.getEdgesForNode(nodeC);
    assert.strictEqual(edgesForC.length, 1);
    assert.strictEqual(edgesForC[0].id, "edge-2");
  });

  test("getEdgesForNode returns empty for node with no edges", () => {
    const node = new Node("node-1", "Lonely Node", "file");
    graph.addNode(node);

    const edges = graph.getEdgesForNode(node);
    assert.strictEqual(edges.length, 0);
  });

  test("AddNode event integration adds node to graph", () => {
    eventMonitor.emit(GraphEvents.AddNode, "uri-1", "Event Node", "file");

    const nodes = graph.getNodes();
    assert.strictEqual(nodes.length, 1);
    assert.strictEqual(nodes[0].id, "uri-1");
    assert.strictEqual(nodes[0].name, "Event Node");
  });

  test("DeleteNode event integration removes node from graph", () => {
    eventMonitor.emit(GraphEvents.AddNode, "uri-1", "Node To Delete", "file");
    assert.strictEqual(graph.getNodes().length, 1);

    eventMonitor.emit(GraphEvents.DeleteNode, "uri-1");
    assert.strictEqual(graph.getNodes().length, 0);
  });

  test("AddEdge event integration adds edge between nodes", () => {
    eventMonitor.emit(GraphEvents.AddNode, "src-1", "Source", "file");
    eventMonitor.emit(GraphEvents.AddNode, "tgt-1", "Target", "file");
    eventMonitor.emit(GraphEvents.AddEdge, "src-1", "tgt-1", "reference");

    const edges = graph.getEdges();
    assert.strictEqual(edges.length, 1);
    assert.strictEqual(edges[0].relationship, "reference");
  });

  test("AddEdge event does not add edge when source node missing", () => {
    eventMonitor.emit(GraphEvents.AddNode, "tgt-1", "Target", "file");
    eventMonitor.emit(GraphEvents.AddEdge, "src-1", "tgt-1", "reference");

    assert.strictEqual(graph.getEdges().length, 0);
  });

  test("RemoveEdge event integration removes edge from graph", () => {
    const source = new Node("src-1", "Source", "file");
    const target = new Node("tgt-1", "Target", "file");
    graph.addNode(source);
    graph.addNode(target);

    const edge = new Edge("edge-1", source, target, "contains");
    graph.addEdge(edge);
    assert.strictEqual(graph.getEdges().length, 1);

    eventMonitor.emit(GraphEvents.RemoveEdge, edge);
    assert.strictEqual(graph.getEdges().length, 0);
  });

  test("getNodes returns all nodes", () => {
    graph.addNode(new Node("a", "A", "file"));
    graph.addNode(new Node("b", "B", "folder"));
    graph.addNode(new Node("c", "C", "file"));

    assert.strictEqual(graph.getNodes().length, 3);
  });

  test("getEdges returns all edges", () => {
    const nodeA = new Node("a", "A", "file");
    const nodeB = new Node("b", "B", "file");
    const nodeC = new Node("c", "C", "file");
    graph.addNode(nodeA);
    graph.addNode(nodeB);
    graph.addNode(nodeC);

    graph.addEdge(new Edge("e1", nodeA, nodeB, "contains"));
    graph.addEdge(new Edge("e2", nodeB, nodeC, "reference"));

    assert.strictEqual(graph.getEdges().length, 2);
  });
});
