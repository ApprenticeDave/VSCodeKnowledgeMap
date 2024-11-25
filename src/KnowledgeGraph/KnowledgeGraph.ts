import { EventMonitor } from "../Utils/EventMonitor";
import { Node } from "./Node";
import { Edge } from "./Edge";
import { Logger, LogLevel } from "../Utils/Logger";
import { off } from "process";

export class KnowledgeGraph {
  private eventMonitor: EventMonitor;
  private nodes: Map<string, Node>;
  private edges: Set<Edge>;

  constructor(eventMonitor: EventMonitor) {
    Logger.log("Knowledge Graph - Constructor - Initialize", LogLevel.Info);
    this.eventMonitor = eventMonitor;
    this.nodes = new Map<string, Node>();
    this.edges = new Set<Edge>();
    this.initEvents();
  }

  public initEvents() {
    Logger.log(
      "KnowledgeGraph - initEvents - Add Eventhandling",
      LogLevel.Info
    );
    this.eventMonitor.on(
      "NodeAdded",
      (uri: string, name: string, type: string) => {
        this.addNode(new Node(uri, name, type));
      }
    );

    this.eventMonitor.on("NodeDeleted", (uri: string) => {
      const node = this.nodes.get(uri);
      if (node) {
        this.removeNode(node);
      }
    });

    this.eventMonitor.on(
      "EdgeAdd",
      (
        sourceUri: string,
        targetUri: string,
        relationship: string,
        weight?: number
      ) => {
        const sourceNode = this.nodes.get(sourceUri);
        const targetNode = this.nodes.get(targetUri);

        if (!sourceNode || !targetNode) {
          Logger.log(
            `Knowledge Graph - Both nodes must be added to the graph before adding an edge.`,
            LogLevel.Error
          );
          return;
        }

        let edgetoAdd = new Edge(
          `${sourceUri}-${targetUri}`,
          this.nodes.get(sourceUri),
          this.nodes.get(targetUri),
          relationship
        );

        if (weight) {
          edgetoAdd.weight = weight;
        }

        this.addEdge(edgetoAdd);
      }
    );

    this.eventMonitor.on("EdgeRemoved", (edge: Edge) => {
      this.removeEdge(edge);
    });
  }

  public addNode(node: Node): void {
    Logger.log(`Knowledge Graph - Adding node: ${node.id}`, LogLevel.Info);
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
      Logger.log(
        `Knowledge Graph - Notify Node Added - node: ${node.id}`,
        LogLevel.Info
      );
      this.eventMonitor.notifyChange("KnowledgeGraphNodeAdded", node);
    } else {
      Logger.log(
        `Knowledge Graph - Node already exists: ${node.id}`,
        LogLevel.Info
      );
    }
  }

  public updateNode(node: Node): void {}

  public removeNode(nodeToRemove: Node): void {
    Logger.log(
      `Knowledge Graph - Removing node: ${nodeToRemove.name}`,
      LogLevel.Info
    );
    const node = this.nodes.get(nodeToRemove.id);
    if (node) {
      this.nodes.delete(node.id);
      this.eventMonitor.notifyChange("KnowledgeGraphNodeRemoved", node);
      this.edges.forEach((edge) => {
        if (edge.source === node || edge.target === node) {
          Logger.log(
            `Knowledge Graph - Removing node Edges: ${edge}`,
            LogLevel.Info
          );
          this.removeEdge(edge);
          Logger.log(
            `Knowledge Graph - Removing sub dir nodes: ${edge.source}`,
            LogLevel.Info
          );
          if (edge.relationship === "contains" && edge.source !== node) {
            this.removeNode(edge.source);
          }
        }
      });
    }
  }

  public addEdge(edge: Edge): void {
    Logger.log(`Knowledge Graph - Add edge: ${edge.id}`, LogLevel.Info);
    if (this.nodes.has(edge.source.id) && this.nodes.has(edge.target.id)) {
      this.edges.add(edge);

      this.eventMonitor.notifyChange("KnowledgeGraphEdgeAdded", edge);
    } else {
      Logger.log(
        `Knowledge Graph - Both nodes must be added to the graph before adding an edge.`,
        LogLevel.Error
      );
    }
  }

  public updateEdge(edge: Edge): void {
    Logger.log(`Knowledge Graph - Update edge: ${edge.id}`, LogLevel.Info);
    if (this.edges.has(edge)) {
      this.edges.delete(edge);
      this.edges.add(edge);
      this.eventMonitor.notifyChange("KnowledgeGraphEdgeUpdated", edge);
    }
  }

  public removeEdge(edge: Edge): void {
    Logger.log(`Knowledge Graph - Remove edge: ${edge.id}`, LogLevel.Info);
    if (this.edges.has(edge)) {
      this.edges.delete(edge);
      this.eventMonitor.notifyChange("KnowledgeGraphEdgeRemoved", edge);
    }
  }

  public getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  public getEdges(): Edge[] {
    return Array.from(this.edges);
  }

  public getEdgesForNode(node: Node): Edge[] {
    return Array.from(this.edges).filter(
      (edge) => edge.source === node || edge.target === node
    );
  }
}
