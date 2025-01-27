// The module 'vscode' contains the VS Code extensibility API
import * as vscode from "vscode";
import { KnowledgeMapViewProvider } from "./KnowledgeMapViewProvider";
import { Logger, LogLevel } from "./Utils/Logger";


// Global variables
let extensionContext: vscode.ExtensionContext;
let knowledgeMapProvider: KnowledgeMapViewProvider;

// This method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
  Logger.log("Extension - Activating", LogLevel.Info);
  let rootUris: vscode.Uri[];
  extensionContext = context;

  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    Logger.log("No workspace or folder is currently open", LogLevel.Warn);
    vscode.window.showWarningMessage("No workspace or folder is currently open.");
    return;
  }else{
    rootUris = vscode.workspace.workspaceFolders?.map((folder) => folder.uri);
  }

  knowledgeMapProvider = new KnowledgeMapViewProvider(context.extensionUri, rootUris);
  // Register the Knowledge Map View Provider
  const provider = vscode.window.registerWebviewViewProvider(
    KnowledgeMapViewProvider.viewType,
    knowledgeMapProvider
  );

  let openKXToFileCommand = vscode.commands.registerCommand('vscodeknowledgemap.OpenKnowledgeMapAt', (uri: vscode.Uri) => {
    rootUris = [uri];
    knowledgeMapProvider.updateRootUris(rootUris);
  });

  context.subscriptions.push(provider);
  context.subscriptions.push(openKXToFileCommand);

  vscode.workspace.onDidChangeWorkspaceFolders((event) => {
    // Update the rootUris and the knowledgeMapProvider if needed
    rootUris = vscode.workspace.workspaceFolders?.map((folder) => folder.uri) || [];
    knowledgeMapProvider.updateRootUris(rootUris);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {
  Logger.log("Extension - Deactivating", LogLevel.Info);
}
