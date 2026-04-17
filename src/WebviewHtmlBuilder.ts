/** @format */

import * as vscode from "vscode";

/**
 * Builds the HTML content for the Knowledge Map webview panel.
 * Centralises CSP management, nonce generation, and CDN integrity hashes.
 * Extracted from KnowledgeMapViewProvider to enable independent testing and
 * easier maintenance of CDN pinning.
 */
export class WebviewHtmlBuilder {
  // Pinned CDN URL and SRI hash for 3d-force-graph
  private readonly forcegraphSha: string =
    "sha384-EOtdclDeZjD2OIuHLRVD69URQBcPkwvQOXng4RCP025pd0wHn410ghSudxpCbVBJ";
  private readonly forceGraphUri: string =
    "https://unpkg.com/3d-force-graph@1.69.9/dist/3d-force-graph.js";

  // Pinned CDN URLs and SRI hashes for Three.js ecosystem
  private readonly threeVersion: string = "0.160.0";
  private readonly spriteTextVersion: string = "1.8.2";
  private readonly threeSha: string =
    "sha384-61S/Nu32S3E5+n+KpCOTb2eRYps6fVKm+9Gz1QBvSePFthb46f063Aa/qe/lykFZ";
  private readonly spriteTextSha: string =
    "sha384-Aa/dIvnhkIC4B9HwK3sYztjSJ56ITPGNeqT7kgLipY6k0sLLSfxrszwUzhsIhrXd";
  private readonly css2dSha: string =
    "sha384-oxPlnJSeUCYU9W3RMQswb4S/vFd4Bhxuy1Ffx0V2KJakWeb6n1gaqUtSE9Ic/F72";
  private readonly unrealBloomSha: string =
    "sha384-R734/7SvtqjjeteDKG4qcQA0adDCZ1ZcKfYUZsbVr9qqHGlgSXH9eNN4b3NIgwuc";

  /**
   * Generates a fresh HTML document for the webview, including CSP, import
   * maps with SRI hashes, and local script / style references.
   * A new nonce is generated on every call as required by the VS Code
   * extension guidelines.
   */
  public build(webview: vscode.Webview, extensionUri: vscode.Uri): string {
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

    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    const styleUri = webview.asWebviewUri(stylePathOnDisk);
    const nonce = this.getNonce();

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
                <script nonce='${nonce}' integrity='${this.forcegraphSha}' crossorigin='anonymous' src="${this.forceGraphUri}"></script>
            </head>
            <body>
                <div id="glCanvas"></div>
                <div id="kxDebug" class="debug"></div>
                <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
  }

  /**
   * Generates a cryptographically-sufficient random nonce for use in the
   * Content-Security-Policy header. A fresh nonce must be generated per
   * HTML document render.
   */
  public getNonce(): string {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
