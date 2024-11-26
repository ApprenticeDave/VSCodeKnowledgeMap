// The module 'vscode' contains the VS Code extensibility API
import * as vscode from "vscode";
import { KnowledgeMapViewProvider } from "./KnowledgeMapViewProvider";
import { Logger, LogLevel } from "./Utils/Logger";
import { EventMonitor } from "./Utils/EventMonitor";

// Global variables
let eventMonitor: EventMonitor;
let extensionContext: vscode.ExtensionContext;

// This method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
  Logger.log("Extension - Activating", LogLevel.Info);
  eventMonitor = new EventMonitor();
  extensionContext = context;

  const provider = vscode.window.registerWebviewViewProvider(
    KnowledgeMapViewProvider.viewType,
    new KnowledgeMapViewProvider(context.extensionUri, eventMonitor)
  );

  const refreshCommand = vscode.commands.registerCommand(
    "vscodeknowledgemap.refreshKnowledgeMap",
    () => {
      // Implement the logic to refresh your knowledge map
      vscode.window.showInformationMessage("Knowledge Map refreshed!");
    }
  );

  context.subscriptions.push(provider);
  context.subscriptions.push(refreshCommand);
}

// Function to handle workspace changes
function workspaceChanged() {
  Logger.log("Extension - Workspace Changed", LogLevel.Info);
}

// This method is called when your extension is deactivated
export function deactivate() {}
