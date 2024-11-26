import * as vscode from "vscode";
import { FolderAndFileUtils } from "./Utils/FolderAndFileUtils";
import { Logger, LogLevel } from "./Utils/Logger";
import { KnowledgeGraph } from "./KnowledgeGraph/KnowledgeGraph";
import { EventMonitor } from "./Utils/EventMonitor";
import { FileMonitor } from "./StructureParser/FileMonitor";

export class KnowledgeMapViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "vscodeknowledgemap.knowledgeMapView";
  private eventMonitor: EventMonitor;
  private knowledgeGraph?: KnowledgeGraph;
  private fileMonitor?: FileMonitor;
  private webviewView?: vscode.WebviewView;

  constructor(
    private readonly extensionUri: vscode.Uri,
    eventMonitor?: EventMonitor
  ) {
    this.eventMonitor = eventMonitor || new EventMonitor();
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this.webviewView = webviewView;

    this.webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
    };

    this.webviewView.webview.html = this.getMapViewContent(
      webviewView.webview,
      this.extensionUri
    );

    // Set up event listeners
    this.webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.command) {
        case "log":
          Logger.log(
            `KnowledgeMap View Provider - WebGL Script - ${message.text}`,
            LogLevel.Info
          );
          return;
        case "openFile":
          this.openFileInEditor(message.filePath);
          break;
        case "WebViewLoaded":
          this.initEvents();
          this.knowledgeGraph = new KnowledgeGraph(this.eventMonitor);

          this.fileMonitor = new FileMonitor(
            this.eventMonitor,
            this.knowledgeGraph.getNodes().length > 0
          );
          break;
      }
    }, undefined);
  }

  public initEvents() {
    Logger.log(
      `KnowledgeMap View Provider - Init Events - Listen for Knowledgegraph Updates`,
      LogLevel.Info
    );
    this.eventMonitor.on("KnowledgeGraphNodeAdded", (node) => {
      if (this.webviewView) {
        Logger.log(
          `KnowledgeMap View Provider - Adding Node to WebGL Panel: ${node}`,
          LogLevel.Info
        );
        this.webviewView.webview.postMessage({
          command: "addNode",
          node: node,
        });
      } else {
        Logger.log(
          `KnowledgeMap View Provider - Webview not initialized`,
          LogLevel.Info
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

    this.eventMonitor.on("ClearView", (node) => {
      if (this.webviewView) {
        this.webviewView.webview.postMessage({
          command: "clearView",
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
  }

  public async openFileInEditor(filePath: string) {
    try {
      const fileUri = vscode.Uri.file(filePath);

      // Optional: Check if the file is within the workspace
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
      if (!workspaceFolder) {
        Logger.log(
          `KnowledgeMap View Provider - File is not within the workspace: ${filePath}`,
          LogLevel.Warn
        );
        return;
      }

      const document = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    } catch (error) {
      Logger.log(
        `KnowledgeMap View Provider - Error opening file: ${error}`,
        LogLevel.Error
      );
    }
  }

  private getMapViewContent(
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ): string {
    const scriptPathOnDisk = vscode.Uri.joinPath(
      extensionUri,
      "media",
      "script.js"
    );
    const stylePathOnDisk = vscode.Uri.joinPath(
      extensionUri,
      "media",
      "style.css"
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
                content="default-src 'none'; img-src ${webview.cspSource} https:; script-src ${webview.cspSource} http://unpkg.com/  https://unpkg.com/three/build/three.module.js 'unsafe-inline'; style-src ${webview.cspSource} 'unsafe-inline';"
                />
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Knowledge Map</title>
                <link href="${styleUri}" rel="stylesheet">
              
                <script  nonce="${nonce}" type="importmap">
                { 
                  "imports": { 
                    "three": "https://unpkg.com/three/build/three.module.js", 
                    "SpriteText" : "https://unpkg.com/three-spritetext/dist/three-spritetext.mjs",
                    "CSS2D": "https://unpkg.com/three/examples/jsm/renderers/CSS2DRenderer.js"
                  }
                }
                </script>
                <script nonce='${nonce}' integrity='sha384-VBHo9QV4TsNpgSaAzBubIBIEdydupStwcesSWycClIfvhaJI4tS5noz/nX+ejBJg' crossorigin='anonymous' src="https://unpkg.com/3d-force-graph"></script>
            </head>
            <body>
                <div id="glCanvas"></div>
                <script>
                  window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                      case 'setBackgroundColor':
                        document.body.style.backgroundColor = message.color;
                        break;
                    }
                  });
                </script>
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
