import * as vscode from "vscode";
import { EventMonitor } from "../Utils/EventMonitor";

export class WebGLPanel implements Disposable {
  private webpanel: vscode.WebviewPanel | undefined;
  private extensionUri: vscode.Uri;
  private eventMonitor: EventMonitor = new EventMonitor();

  constructor(context: vscode.ExtensionContext) {
    this.extensionUri = context.extensionUri;

    this.init();

    const mapViewDisposable = vscode.commands.registerCommand(
      "vscodeknowledgemap.OpenMapView",
      () => {
        this.webpanel = vscode.window.createWebviewPanel(
          "vscodeknowledgemap.OpenMapView", // Identifies the type of the webview. Used internally
          "Knowledge Map", // Title of the panel displayed to the user
          vscode.ViewColumn.One, // Editor column to show the new webview panel in
          {
            enableScripts: true,
            localResourceRoots: [
              vscode.Uri.joinPath(this.extensionUri, "media"),
            ],
          } // Webview options. More on these later.
        );

        // Handle messages from the webview
        this.webpanel.webview.onDidReceiveMessage(
          (message) => {
            switch (message.command) {
              case "alert":
                vscode.window.showInformationMessage(message.text);
                return;
            }
          },
          undefined,
          context.subscriptions
        );

        this.init();
      }
    );
  }

  private init() {
    if (this.extensionUri && this.webpanel) {
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

      this.webpanel.webview.html = this.getMapViewContent(
        this.webpanel.webview,
        this.extensionUri
      );
    }

    this.eventMonitor.on("GLNodeAdded", (node) => {
      if (this.webpanel) {
        this.webpanel.webview.postMessage({
          command: "NodeAdded",
          node: node,
        });
      }
    });

    this.eventMonitor.on("GLNodeRemoved", (node) => {
      if (this.webpanel) {
        this.webpanel.webview.postMessage({
          command: "NodeRemoved",
          node: node,
        });
      }
    });

    this.eventMonitor.on("GLLinkAdded", (link) => {
      if (this.webpanel) {
        this.webpanel.webview.postMessage({
          command: "LinkAdded",
          node: link,
        });
      }
    });

    this.eventMonitor.on("GLLinkRemoved", (link) => {
      if (this.webpanel) {
        this.webpanel.webview.postMessage({
          command: "LinkRemoved",
          node: link,
        });
      }
    });
  }

  [Symbol.dispose](): void {}

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

    // Return the HTML content
    return `<!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Knowledge Map</title>
                  <link href="${styleUri}" rel="stylesheet">
                </head>
                <body>                  
                  <canvas id="glCanvas" style="width:100%;height:100%"></canvas>
                  <script src="${scriptUri}"></script>
                </body>
                </html>`;
  }
}
