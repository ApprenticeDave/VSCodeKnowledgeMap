/** @format */

import * as vscode from "vscode";
import { Logger, LogLevel } from "./Utils/Logger";
import { EventMonitor } from "./Utils/EventMonitor";
import { GraphEvents } from "./Utils/GraphEvents";
import * as path from "path";

type WebviewMessage =
  | { command: "log"; text: string }
  | { command: "openNode"; filePath: string }
  | { command: "WebViewLoaded" }
  | { command: "addTag"; nodeId: string; tag: string }
  | { command: "removeTag"; nodeId: string; tag: string }
  | { command: "requestAllTags" };

/**
 * Routes messages between the webview and the extension host.
 *
 * - Inbound: handles messages sent from the WebGL script via
 *   `webview.onDidReceiveMessage` (log, openNode, WebViewLoaded, addTag, removeTag, requestAllTags).
 * - Outbound: wires KnowledgeGraph events from the EventMonitor to
 *   `webview.postMessage` calls so the graph view stays in sync.
 *
 * Extracted from KnowledgeMapViewProvider to make each concern independently
 * testable and to fix the listener-duplication bug (#36) by keeping listener
 * registration in one place.
 */
export class MessageRouter {
  /**
   * @param eventMonitor  Shared event bus used to subscribe to graph updates.
   * @param onWebViewLoaded  Callback invoked when the WebViewLoaded message is
   *   received. The caller is responsible for (re-)creating the KnowledgeGraph,
   *   ItemProcessor, and triggering a workspace scan.
   * @param onAddTag  Callback invoked when the webview requests a tag be added.
   * @param onRemoveTag  Callback invoked when the webview requests a tag be removed.
   * @param onRequestAllTags  Callback invoked when the webview requests all used tags.
   */
  constructor(
    private readonly eventMonitor: EventMonitor,
    private readonly onWebViewLoaded: () => Promise<void>,
    private readonly onAddTag: (
      nodeId: string,
      tag: string,
    ) => Promise<void> = async () => {},
    private readonly onRemoveTag: (
      nodeId: string,
      tag: string,
    ) => Promise<void> = async () => {},
    private readonly onRequestAllTags: () => string[] = () => [],
  ) {}

  /**
   * Registers the inbound message handler on the given webview.
   * Returns a Disposable that should be tracked alongside the webview
   * lifecycle so it is cleaned up when the view is hidden or disposed.
   */
  public wireInbound(webview: vscode.Webview): vscode.Disposable {
    return webview.onDidReceiveMessage(async (message: WebviewMessage) => {
      switch (message.command) {
        case "log":
          Logger.log(
            `KnowledgeMap View Provider - WebGL Script - ${message.text}`,
            LogLevel.Info,
          );
          return;

        case "openNode":
          if (
            typeof message.filePath !== "string" ||
            message.filePath.length === 0
          ) {
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
          await this.openNodeInEditor(message.filePath);
          break;

        case "WebViewLoaded":
          Logger.log(
            "KnowledgeMap View Provider - WebGL Script - Webview Loaded",
            LogLevel.Info,
          );
          // Remove all previous EventMonitor listeners to prevent accumulation
          // across hide/show cycles before re-registering (fixes #36).
          this.eventMonitor.removeAllListeners();
          await this.onWebViewLoaded();
          break;

        case "addTag":
          if (message.nodeId && message.tag) {
            await this.onAddTag(message.nodeId, message.tag);
          }
          break;

        case "removeTag":
          if (message.nodeId && message.tag) {
            await this.onRemoveTag(message.nodeId, message.tag);
          }
          break;

        case "requestAllTags":
          webview.postMessage({
            command: "allTagsData",
            allTags: this.onRequestAllTags(),
          });
          break;
      }
    });
  }

  /**
   * Subscribes to KnowledgeGraph notification events on the EventMonitor and
   * forwards each one as a postMessage to the webview. Should be called once
   * the KnowledgeGraph has been (re-)created so the view stays in sync.
   *
   * Note: callers must invoke `eventMonitor.removeAllListeners()` before
   * calling this method to avoid duplicate listeners across hide/show cycles.
   */
  public wireOutbound(webviewView: vscode.WebviewView): void {
    Logger.log(
      `KnowledgeMap View Provider - Init Events - Listen for Knowledgegraph Updates`,
      LogLevel.Info,
    );

    this.eventMonitor.on(GraphEvents.KnowledgeGraphNodeAdded, (node) => {
      if (webviewView) {
        Logger.log(
          `KnowledgeMap View Provider - Adding Node to WebGL Panel: ${node}`,
          LogLevel.Info,
        );
        webviewView.webview.postMessage({
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

    this.eventMonitor.on(GraphEvents.KnowledgeGraphNodeRemoved, (node) => {
      if (webviewView) {
        webviewView.webview.postMessage({
          command: "removeNode",
          node: node,
        });
      }
    });

    this.eventMonitor.on(GraphEvents.KnowledgeGraphEdgeAdded, (edge) => {
      if (webviewView) {
        webviewView.webview.postMessage({
          command: "addEdge",
          node: edge,
        });
      }
    });

    this.eventMonitor.on(GraphEvents.KnowledgeGraphEdgeRemoved, (edge) => {
      if (webviewView) {
        webviewView.webview.postMessage({
          command: "removeEdge",
          node: edge,
        });
      }
    });

    this.eventMonitor.on(GraphEvents.KnowledgeGraphEdgeUpdated, (edge) => {
      if (webviewView) {
        webviewView.webview.postMessage({
          command: "updateEdge",
          edge: edge,
        });
      }
    });

    this.eventMonitor.on(GraphEvents.KnowledgeGraphCleared, () => {
      if (webviewView) {
        webviewView.webview.postMessage({
          command: "clearView",
        });
      }
    });

    this.eventMonitor.on(
      GraphEvents.KnowledgeGraphNodeTagsUpdated,
      (node) => {
        if (webviewView) {
          webviewView.webview.postMessage({
            command: "nodeTagsUpdated",
            nodeId: node.id,
            tags: node.tags,
            allTags: this.onRequestAllTags(),
          });
        }
      },
    );
  }

  /**
   * Opens a file-system path in the VS Code text editor, or prompts the user
   * before navigating to an external URL. Validates and sanitises the input
   * before acting.
   */
  public async openNodeInEditor(nodePath: string): Promise<void> {
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
      if (
        nodePath.startsWith("http://") ||
        nodePath.startsWith("https://")
      ) {
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
}
