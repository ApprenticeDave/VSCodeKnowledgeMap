/** @format */

import * as vscode from "vscode";
import { Logger, LogLevel } from "./Utils/Logger";
import { KnowledgeGraph } from "./KnowledgeGraph/KnowledgeGraph";
import { EventMonitor } from "./Utils/EventMonitor";
import { ItemProcessor } from "./StructureParser/ItemProcessor";
import { WorkspaceScanner } from "./WorkspaceScanner";
import { WebviewHtmlBuilder } from "./WebviewHtmlBuilder";
import { MessageRouter } from "./MessageRouter";
import { TagStorage } from "./TagStorage";
import { GraphEvents } from "./Utils/GraphEvents";

export class KnowledgeMapViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "vscodeknowledgemap.knowledgeMapView";

  private eventMonitor: EventMonitor;
  private knowledgeGraph?: KnowledgeGraph;
  private webviewView?: vscode.WebviewView;
  private rootUris: vscode.Uri[];
  private itemProcessor?: ItemProcessor;
  private _viewDisposables: vscode.Disposable[] = [];
  private readonly tagStorage: TagStorage;

  private readonly htmlBuilder: WebviewHtmlBuilder;
  private readonly scanner: WorkspaceScanner;

  constructor(
    private readonly extensionUri: vscode.Uri,
    rootUri: vscode.Uri[],
    private readonly context: vscode.ExtensionContext,
  ) {
    this.eventMonitor = new EventMonitor();
    this.rootUris = rootUri;
    this.htmlBuilder = new WebviewHtmlBuilder();
    this.scanner = new WorkspaceScanner(this.eventMonitor);
    this.tagStorage = new TagStorage(context);
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
  ) {
    this.webviewView = webviewView;

    // Dispose any disposables from a previous webview session
    this._viewDisposables.forEach((d) => d.dispose());
    this._viewDisposables = [];

    this.webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
    };

    this.webviewView.webview.html = this.htmlBuilder.build(
      webviewView.webview,
      this.extensionUri,
    );

    const router = new MessageRouter(
      this.eventMonitor,
      async () => {
        this.knowledgeGraph = new KnowledgeGraph(this.eventMonitor);
        this.itemProcessor = new ItemProcessor(this.eventMonitor);
        router.wireOutbound(webviewView);
        await this.scanner.scan(this.rootUris, this.itemProcessor);
        await this.itemProcessor.start();
        this.applyStoredTags();
      },
      async (nodeId, tag) => {
        const tags = this.tagStorage.getTagsForNode(nodeId);
        if (!tags.includes(tag)) {
          const updated = [...tags, tag];
          await this.tagStorage.setTagsForNode(nodeId, updated);
          this.eventMonitor.emit(GraphEvents.UpdateNodeTags, nodeId, updated);
        }
      },
      async (nodeId, tag) => {
        const tags = this.tagStorage.getTagsForNode(nodeId);
        const updated = tags.filter((t) => t !== tag);
        await this.tagStorage.setTagsForNode(nodeId, updated);
        this.eventMonitor.emit(GraphEvents.UpdateNodeTags, nodeId, updated);
      },
      () => this.tagStorage.getAllUsedTags(),
    );

    // Set up event listeners; track the returned disposable for cleanup
    this._viewDisposables.push(router.wireInbound(this.webviewView.webview));

    // Clean up all view-scoped disposables when the webview is permanently disposed;
    // track this disposable too so it is cleaned up on re-show.
    this._viewDisposables.push(webviewView.onDidDispose(() => {
      this._viewDisposables.forEach((d) => d.dispose());
      this._viewDisposables = [];
    }));
  }

  public async updateRootUris(rootUri: vscode.Uri[]) {
    this.itemProcessor?.stop();
    this.itemProcessor?.clearTasks();
    this.knowledgeGraph?.clearGraph();
    this.rootUris = rootUri;
    await this.scanner.scan(this.rootUris, this.itemProcessor);
    this.itemProcessor?.start();
    this.applyStoredTags();
  }

  public async OpenKnowledgeMapAt(uri: vscode.Uri) {
    Logger.log(
      `KnowledgeMap View Provider - Opening Knowledge Map at: ${uri.fsPath}`,
      LogLevel.Info,
    );
    this.itemProcessor?.stop();
    this.itemProcessor?.clearTasks();
    this.knowledgeGraph?.clearGraph();
    this.rootUris = [uri];
    await this.scanner.scan(this.rootUris, this.itemProcessor);
    this.itemProcessor?.start();
    this.applyStoredTags();
  }

  /**
   * Adds a tag to a node identified by its file-system path and persists it.
   * Called by the `addTagToFile` command so the user can tag nodes from the
   * Explorer context menu or the Command Palette.
   */
  public async addTagToNode(nodeId: string, tag: string): Promise<void> {
    const tags = this.tagStorage.getTagsForNode(nodeId);
    if (!tags.includes(tag)) {
      const updated = [...tags, tag];
      await this.tagStorage.setTagsForNode(nodeId, updated);
      this.eventMonitor.emit(GraphEvents.UpdateNodeTags, nodeId, updated);
    }
  }

  /** Returns all previously used tags for display in QuickPick suggestions. */
  public getAllUsedTags(): string[] {
    return this.tagStorage.getAllUsedTags();
  }

  /**
   * After nodes are added to the graph, emit UpdateNodeTags for any nodes
   * that already have stored tags so the webview reflects persisted state.
   */
  private applyStoredTags(): void {
    const allNodeTags = this.tagStorage.getAllNodeTags();
    for (const [nodeId, tags] of Object.entries(allNodeTags)) {
      if (tags.length > 0) {
        this.eventMonitor.emit(GraphEvents.UpdateNodeTags, nodeId, tags);
      }
    }
  }
}
