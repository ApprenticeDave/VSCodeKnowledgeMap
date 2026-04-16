/** @format */

import * as vscode from "vscode";
import { Logger, LogLevel } from "./Utils/Logger";
import { KnowledgeGraph } from "./KnowledgeGraph/KnowledgeGraph";
import { EventMonitor } from "./Utils/EventMonitor";
import { ItemProcessor } from "./StructureParser/ItemProcessor";
import { Node } from "./KnowledgeGraph/Node";
import { Edge } from "./KnowledgeGraph/Edge";
import * as path from "path";

type WebviewMessage =
  | { command: "log"; text: string }
  | { command: "openNode"; filePath: string }
  | { command: "WebViewLoaded" };

export class KnowledgeMapViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "vscodeknowledgemap.knowledgeMapView";
  private eventMonitor: EventMonitor;
  private knowledgeGraph?: KnowledgeGraph;
  private webviewView?: vscode.WebviewView;
  private forcegraphSha: string =
    "sha384-EOtdclDeZjD2OIuHLRVD69URQBcPkwvQOXng4RCP025pd0wHn410ghSudxpCbVBJ";
  private forgraphURI: string =
    "https://unpkg.com/3d-force-graph@1.69.9/dist/3d-force-graph.js";

  // Pinned CDN URLs and SRI hashes for Three.js ecosystem
  private threeVersion: string = "0.160.0";
  private spriteTextVersion: string = "1.8.2";
  private threeSha: string =
    "sha384-61S/Nu32S3E5+n+KpCOTb2eRYps6fVKm+9Gz1QBvSePFthb46f063Aa/qe/lykFZ";
  private spriteTextSha: string =
    "sha384-Aa/dIvnhkIC4B9HwK3sYztjSJ56ITPGNeqT7kgLipY6k0sLLSfxrszwUzhsIhrXd";
  private css2dSha: string =
    "sha384-oxPlnJSeUCYU9W3RMQswb4S/vFd4Bhxuy1Ffx0V2KJakWeb6n1gaqUtSE9Ic/F72";
  private unrealBloomSha: string =
    "sha384-R734/7SvtqjjeteDKG4qcQA0adDCZ1ZcKfYUZsbVr9qqHGlgSXH9eNN4b3NIgwuc";

  private rootUris: vscode.Uri[];
  private itemProcessor?: ItemProcessor;
  constructor(
    private readonly extensionUri: vscode.Uri,
    rootUri: vscode.Uri[],
  ) {
    this.eventMonitor = new EventMonitor();
    this.extensionUri = extensionUri;
    this.rootUris = rootUri;
  }

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
  ) {
    this.webviewView = webviewView;

    this.webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
    };

    this.webviewView.webview.html = this.getMapViewContent(
      webviewView.webview,
      this.extensionUri,
    );

    // Set up event listeners
    this.webviewView.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      switch (message.command) {
        case "log":
          Logger.log(
            `KnowledgeMap View Provider - WebGL Script - ${message.text}`,
            LogLevel.Info,
          );
          return;
        case "openNode":
          if (typeof message.filePath !== "string" || message.filePath.length === 0) {
            Logger.log(
              `KnowledgeMap View Provider - Invalid filePath in openNode message`,
              LogLevel.Warn,
            );
            return;
          }
          Logger.log(
            `KnowledgeMap View Provider - WebGL Script - Open file in editor ${message.filePath}`,
            LogLevel.Info,
          );
          this.openNodeInEditor(message.filePath);
          break;
        case "WebViewLoaded":
          Logger.log(
            "KnowledgeMap View Provider - WebGL Script - Webview Loaded",
            LogLevel.Info,
          );

          this.initEvents();
          this.knowledgeGraph = new KnowledgeGraph(this.eventMonitor);
          this.itemProcessor = new ItemProcessor(this.eventMonitor);
          await this.Generate();
          await this.itemProcessor.start();
          break;
      }
    }, undefined);
  }

  public async updateRootUris(rootUri: vscode.Uri[]) {
    this.itemProcessor?.stop();
    this.itemProcessor?.clearTasks();
    this.knowledgeGraph?.clearGraph();
    this.rootUris = rootUri;
    this.Generate();
    this.itemProcessor?.start();
  }

  private async Generate() {
    let items: { uri: vscode.Uri; parent?: vscode.Uri }[] = [];

    for (const turi of this.rootUris) {
      items.push({ uri: turi });
    }

    while (items.length > 0) {
      const item = items.shift();
      if (item) {
        const stat = await vscode.workspace.fs.stat(item.uri);
        if (stat.type === vscode.FileType.Directory) {
          const files = await vscode.workspace.fs.readDirectory(item.uri);
          for (const file of files) {
            items.push({
              uri: vscode.Uri.joinPath(item.uri, file[0]),
              parent: item.uri,
            });
          }
          this.eventMonitor.emit(
            "AddNode",
            item.uri.fsPath,
            path.basename(item.uri.fsPath),
            "folder",
          );
        } else if (stat.type === vscode.FileType.File) {
          this.eventMonitor.emit(
            "AddNode",
            item.uri.fsPath,
            path.basename(item.uri.fsPath),
            "file",
          );

          this.itemProcessor?.createUriTask(item.uri);
        }

        if (item.parent) {
          this.eventMonitor.emit(
            "AddEdge",
            item.parent.fsPath,
            item.uri.fsPath,
            "contain",
          );
        }
      }
    }
  }

  public initEvents() {
    Logger.log(
      `KnowledgeMap View Provider - Init Events - Listen for Knowledgegraph Updates`,
      LogLevel.Info,
    );
    this.eventMonitor.on("KnowledgeGraphNodeAdded", (node) => {
      if (this.webviewView) {
        Logger.log(
          `KnowledgeMap View Provider - Adding Node to WebGL Panel: ${node}`,
          LogLevel.Info,
        );
        this.webviewView.webview.postMessage({
          command: "addNode",
          node: node,
        });
      } else {
        Logger.log(
          `KnowledgeMap View Provider - Webview not initialized`,
          LogLevel.Info,
        );
      }
    });

    this.eventMonitor.on("KnowledgeGraphNodeRemoved", (node) => {
      if (this.webviewView) {
        this.webviewView.webview.postMessage({
          command: "removeNode",
          node: node,
        });
      }
    });

    this.eventMonitor.on("KnowledgeGraphEdgeAdded", (edge) => {
      if (this.webviewView) {
        this.webviewView.webview.postMessage({
          command: "addEdge",
          node: edge,
        });
      }
    });

    this.eventMonitor.on("KnowledgeGraphEdgeRemoved", (edge) => {
      if (this.webviewView) {
        this.webviewView.webview.postMessage({
          command: "removeEdge",
          node: edge,
        });
      }
    });

    this.eventMonitor.on("ClearView", (node) => {
      if (this.webviewView) {
        this.webviewView.webview.postMessage({
          command: "clearView",
        });
      }
    });
  }

  public async openNodeInEditor(nodePath: string) {
    try {
      // Validate input type
      if (typeof nodePath !== "string" || nodePath.length === 0) {
        Logger.log(
          `KnowledgeMap View Provider - Invalid nodePath: expected non-empty string`,
          LogLevel.Warn,
        );
        return;
      }

      // Reject paths containing null bytes or control characters
      if (/[\x00-\x1f\x7f-\x9f\u2028\u2029]/.test(nodePath)) {
        Logger.log(
          `KnowledgeMap View Provider - Rejected path with control characters`,
          LogLevel.Warn,
        );
        return;
      }

      // Handle external URLs with user confirmation
      if (nodePath.startsWith("http://") || nodePath.startsWith("https://")) {
        Logger.log(
          `KnowledgeMap View Provider - Opening external link - ${nodePath}`,
          LogLevel.Info,
        );
        const choice = await vscode.window.showInformationMessage(
          `Open external link?\n${nodePath}`,
          { modal: true },
          "Open",
        );
        if (choice === "Open") {
          await vscode.env.openExternal(vscode.Uri.parse(nodePath));
        }
        return;
      }

      // Normalize the path to resolve traversal sequences
      const normalizedPath = path.resolve(nodePath);
      const fileUri = vscode.Uri.file(normalizedPath);

      // Check if the file is within the workspace
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
      if (!workspaceFolder) {
        Logger.log(
          `KnowledgeMap View Provider - File is not within the workspace - ${normalizedPath}`,
          LogLevel.Warn,
        );
        return;
      }

      const document = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    } catch (error) {
      Logger.log(
        `KnowledgeMap View Provider - Error opening file: ${error}`,
        LogLevel.Error,
      );
    }
  }

  public OpenKnowledgeMapAt(uri: vscode.Uri) {
    Logger.log(
      "KnowledgeMap View Provider - Opening Knowledge Map at: ${uri.fsPath}",
      LogLevel.Info,
    );
    this.itemProcessor?.stop();
    this.itemProcessor?.clearTasks();
    this.knowledgeGraph?.clearGraph();
    this.rootUris = [uri];
    this.Generate();
    this.itemProcessor?.start();
  }

  private getMapViewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri,
  ): string {
    const scriptPathOnDisk = vscode.Uri.joinPath(
      extensionUri,
      "media",
      "script.js",
    );
    const stylePathOnDisk = vscode.Uri.joinPath(
      extensionUri,
      "media",
      "style.css",
    );

    // Convert the resource path to a webview URI
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const styleUri = webview.asWebviewUri(stylePathOnDisk);
    const nonce = this.getNonce();

    // Return the HTML content
    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
                <meta http-equiv="Content-Security-Policy"
                content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}' ${webview.cspSource} https://unpkg.com/three@${this.threeVersion}/ https://unpkg.com/three-spritetext@${this.spriteTextVersion}/ https://unpkg.com/3d-force-graph@1.69.9/; style-src ${webview.cspSource};"
                />
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Knowledge Map</title>
                <link href="${styleUri}" rel="stylesheet">

                <script  nonce="${nonce}" type="importmap">
                {
                  "imports": {
                    "three": "https://unpkg.com/three@${this.threeVersion}/build/three.module.js",
                    "SpriteText" : "https://unpkg.com/three-spritetext@${this.spriteTextVersion}/dist/three-spritetext.mjs",
                    "CSS2D": "https://unpkg.com/three@${this.threeVersion}/examples/jsm/renderers/CSS2DRenderer.js",
                    "UnrealBloom": "https://unpkg.com/three@${this.threeVersion}/examples/jsm/postprocessing/UnrealBloomPass.js"
                  },
                  "integrity": {
                    "https://unpkg.com/three@${this.threeVersion}/build/three.module.js": "${this.threeSha}",
                    "https://unpkg.com/three-spritetext@${this.spriteTextVersion}/dist/three-spritetext.mjs": "${this.spriteTextSha}",
                    "https://unpkg.com/three@${this.threeVersion}/examples/jsm/renderers/CSS2DRenderer.js": "${this.css2dSha}",
                    "https://unpkg.com/three@${this.threeVersion}/examples/jsm/postprocessing/UnrealBloomPass.js": "${this.unrealBloomSha}"
                  }
                }
                </script>
                <script nonce='${nonce}' integrity='${this.forcegraphSha}' crossorigin='anonymous' src="${this.forgraphURI}"></script>
            </head>
            <body>
                <div id="glCanvas"></div>
                <div id="kxDebug" class="debug"></div>
                <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
  }

  private getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
