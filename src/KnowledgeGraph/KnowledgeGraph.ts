import * as vscode from "vscode";
import { EventMonitor } from "../Utils/EventMonitor";
import { NodeType, Node } from "./Node";
import { Edge } from "./Edge";
import { LogLevel, Utils } from "../Utils/Utils";
import * as path from "path";
import { FolderAndFileUtils } from "../Utils/FolderAndFileUtils";

export class KnowledgeGraph {
  private eventMonitor: EventMonitor;
  private nodes: Map<string, Node>;
  private edges: Set<Edge>;

  constructor(eventMonitor: EventMonitor) {
    Utils.log("Knowledge Graph - Constructor - Initialize", LogLevel.Info);
    this.eventMonitor = eventMonitor;
    this.nodes = new Map<string, Node>();
    this.edges = new Set<Edge>();
    this.initEvents();
  }

  public initEvents() {
    Utils.log("KnowledgeGraph - initEvents - Add Eventhandling", LogLevel.Info);
    this.eventMonitor.on("FileMonitorNodeAdded", (node: Node) => {
      this.addNode(node);
    });
    this.eventMonitor.on("FileMonitorNodeRemoved", (node: Node) => {
      this.removeNode(node.id);
    });
    this.eventMonitor.on("FileMonitorEdgeAdded", (edge: Edge) => {
      this.addEdge(edge);
    });
    this.eventMonitor.on("FileMonitorEdgeRemoved", (edge: Edge) => {
      this.removeEdge(edge);
    });
  }

  public addNode(node: Node): void {
    Utils.log(`Knowledge Graph - Adding node: ${node.id}`, LogLevel.Info);
    this.nodes.set(node.id, node);
    Utils.log(
      `Knowledge Graph - Notify Node Added - node: ${node.id}`,
      LogLevel.Info
    );
    this.eventMonitor.notifyChange("KnowledgeGraphNodeAdded", node);
  }

  public removeNode(nodeId: string): void {
    Utils.log(`Knowledge Graph - Removing node: ${nodeId}`, LogLevel.Info);
    const node = this.nodes.get(nodeId);
    if (node) {
      this.nodes.delete(nodeId);
      this.edges.forEach((edge) => {
        if (edge.source === node || edge.target === node) {
          this.edges.delete(edge);
        }
      });
    }
  }

  public addEdge(edge: Edge): void {
    Utils.log(`Knowledge Graph - Add edge: ${edge.id}`, LogLevel.Info);
    if (this.nodes.has(edge.source.id) && this.nodes.has(edge.target.id)) {
      this.edges.add(edge);
      this.eventMonitor.notifyChange("KnowledgeGraphEdgeAdded", edge);
    } else {
      Utils.log(
        `Knowledge Graph - Both nodes must be added to the graph before adding an edge.`,
        LogLevel.Error
      );
    }
  }

  public removeEdge(edge: Edge): void {
    Utils.log(`Knowledge Graph - Remove edge: ${edge.id}`, LogLevel.Info);
    if (this.edges.has(edge)) {
      this.edges.delete(edge);
    }
  }

  public getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  public getEdges(): Edge[] {
    return Array.from(this.edges);
  }

  public async generateNodesAndEdgesForWorkspace() {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      return;
    }

    for (const folder of workspaceFolders) {
      const dirPath = folder.uri.fsPath;
      const dirName = path.basename(dirPath);

      const workspaceNode = new Node(dirPath, dirName, NodeType.Workspace);
      this.addNode(workspaceNode);

      await this.processDirectory(workspaceNode);
    }
    return;
  }

  private async processDirectory(node: Node): Promise<void> {
    // Read directory contents
    const entries = await vscode.workspace.fs.readDirectory(
      FolderAndFileUtils.stringToUri(node.id)
    );

    for (const [name, type] of entries) {
      const entryUri = vscode.Uri.joinPath(
        FolderAndFileUtils.stringToUri(node.id),
        name
      );
      const entryPath = entryUri.fsPath;
      const entryName = path.basename(entryPath);
      if (type === vscode.FileType.Directory) {
        const directoryNode = new Node(entryPath, entryName, NodeType.Folder);
        this.addNode(directoryNode);

        const edge = new Edge(
          `${node.id}-${directoryNode.id}`,
          node,
          directoryNode
        );
        this.addEdge(edge);

        // Recursively process subdirectories
        await this.processDirectory(directoryNode);
      } else if (type === vscode.FileType.File) {
        // Create a node for the file
        const fileNode = new Node(entryPath, entryName, NodeType.File);
        this.addNode(fileNode);
        // Create an edge between the directory and the file
        const edge = new Edge(`${node.id}-${fileNode.id}`, node, fileNode);
        this.addEdge(edge);
      }
    }
  }
}
