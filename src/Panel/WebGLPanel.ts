import * as vscode from "vscode";

export class WebGLPanel implements Disposable {
  private webpanel: vscode.WebviewPanel | undefined;
  constructor() {
    const mapViewDisposable = vscode.commands.registerCommand(
      "vscodeknowledgemap.OpenMapView",
      () => {
        this.webpanel = vscode.window.createWebviewPanel(
          "vscodeknowledgemap.OpenMapView", // Identifies the type of the webview. Used internally
          "Knowledge Map", // Title of the panel displayed to the user
          vscode.ViewColumn.One, // Editor column to show the new webview panel in
          { enableScripts: true } // Webview options. More on these later.
        );
      }
    );

    // panel.webview.html = getMapViewContent(
    //   panel.webview,
    //   context.extensionUri
    // );
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
                  <h1>Knowledge Map</h1>
                  <script src="${scriptUri}"></script>
                </body>
                </html>`;
  }
}
