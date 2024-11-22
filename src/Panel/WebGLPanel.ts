import * as vscode from "vscode";
import { EventMonitor } from "../Utils/EventMonitor";
import { LogLevel, Utils } from "../Utils/Utils";

export class WebGLPanel implements Disposable {
  private graphicsWebviewPanel: vscode.WebviewPanel | undefined;
  private extensionUri: vscode.Uri;
  private eventMonitor: EventMonitor;

  constructor(context: vscode.ExtensionContext, eventMonitor: EventMonitor) {
    this.extensionUri = context.extensionUri;
    this.eventMonitor = eventMonitor;
    this.initPanel();
  }

  [Symbol.dispose](): void {
    if (this.graphicsWebviewPanel) {
      this.graphicsWebviewPanel.dispose();
    }
  }

  public initPanel() {
    // Check if the panel already exists
    if (this.graphicsWebviewPanel) {
      this.graphicsWebviewPanel.reveal(vscode.ViewColumn.One);
    } else {
      // Create a new panel
      const mapViewDisposable = vscode.commands.registerCommand(
        "vscodeknowledgemap.OpenMapView",
        () => {
          this.graphicsWebviewPanel = vscode.window.createWebviewPanel(
            "vscodeknowledgemap.OpenMapView",
            "Knowledge Map",
            vscode.ViewColumn.Two,
            {
              enableScripts: true,
              retainContextWhenHidden: true,
              localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, "media"),
              ],
            }
          );

          this.graphicsWebviewPanel.webview.html = this.getMapViewContent(
            this.graphicsWebviewPanel.webview,
            this.extensionUri
          );

          // Set up event listeners
          this.graphicsWebviewPanel.webview.onDidReceiveMessage((message) => {
            switch (message.command) {
              case "log":
                Utils.log(
                  `WebGLPanel - WebGL Script - ${message.text}`,
                  LogLevel.Info
                );
                return;
              case "openFile":
                this.openFileInEditor(message.filePath);
                break;
              case "WebViewLoaded":
                this.eventMonitor.emit("GLPanelReady");
                break;
            }
          }, undefined);

          // Handle panel disposal
          this.graphicsWebviewPanel.onDidDispose(() => {
            this.graphicsWebviewPanel = undefined;
          }, null);

          if (this.extensionUri && this.graphicsWebviewPanel) {
            //setup scripts and styles
            const scriptPathOnDisk = vscode.Uri.joinPath(
              this.extensionUri,
              "media",
              "script.js"
            );
            const stylePathOnDisk = vscode.Uri.joinPath(
              this.extensionUri,
              "media",
              "style.css"
            );

            this.graphicsWebviewPanel.webview.html = this.getMapViewContent(
              this.graphicsWebviewPanel.webview,
              this.extensionUri
            );
          }

          this.initEvents();
        }
      );
    }
  }

  public async openFileInEditor(filePath: string) {
    try {
      const fileUri = vscode.Uri.file(filePath);

      // Optional: Check if the file is within the workspace
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);
      if (!workspaceFolder) {
        Utils.log(
          `File is not within the workspace: ${filePath}`,
          LogLevel.Warn
        );
        return;
      }

      const document = await vscode.workspace.openTextDocument(fileUri);
      await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
    } catch (error) {
      Utils.log(`WebglPanel - Error opening file: ${error}`, LogLevel.Error);
    }
  }

  public initEvents() {
    Utils.log(
      `WebGLPanel - Init Events - Listen for Knowledgegraph Updates`,
      LogLevel.Info
    );
    this.eventMonitor.on("KnowledgeGraphNodeAdded", (node) => {
      if (this.graphicsWebviewPanel) {
        Utils.log(
          `WebGLPanel - Adding Node to WebGL Panel: ${node}`,
          LogLevel.Info
        );
        this.graphicsWebviewPanel.webview.postMessage({
          command: "addNode",
          node: node,
        });
      } else {
        Utils.log(`WebGLPanel - Webview not initialized`, LogLevel.Info);
      }
    });

    this.eventMonitor.on("KnowledgeGraphNodeRemoved", (node) => {
      if (this.graphicsWebviewPanel) {
        this.graphicsWebviewPanel.webview.postMessage({
          command: "removeNode",
          node: node,
        });
      }
    });

    this.eventMonitor.on("ClearView", (node) => {
      if (this.graphicsWebviewPanel) {
        this.graphicsWebviewPanel.webview.postMessage({
          command: "clearView",
        });
      }
    });

    this.eventMonitor.on("KnowledgeGraphEdgeAdded", (edge) => {
      if (this.graphicsWebviewPanel) {
        this.graphicsWebviewPanel.webview.postMessage({
          command: "addEdge",
          node: edge,
        });
      }
    });

    this.eventMonitor.on("KnowledgeGraphEdgeRemoved", (edge) => {
      if (this.graphicsWebviewPanel) {
        this.graphicsWebviewPanel.webview.postMessage({
          command: "removeEdge",
          node: edge,
        });
      }
    });
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
               
                <script  nonce="${nonce}" crossorigin="anonymous" src="http://unpkg.com/3d-force-graph"></script>
                <script type="importmap">{ "imports": { "three": "https://unpkg.com/three/build/three.module.js" }}</script>
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
