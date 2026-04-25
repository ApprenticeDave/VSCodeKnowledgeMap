// The module 'vscode' contains the VS Code extensibility API
import * as vscode from "vscode";
import { KnowledgeMapViewProvider } from "./KnowledgeMapViewProvider";
import { Logger, LogLevel } from "./Utils/Logger";


// Global variables
let knowledgeMapProvider: KnowledgeMapViewProvider;

// This method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
  Logger.log("Extension - Activating", LogLevel.Info);
  let rootUris: vscode.Uri[];

  if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
    Logger.log("No workspace or folder is currently open", LogLevel.Warn);
    vscode.window.showWarningMessage("No workspace or folder is currently open.");
    return;
  }else{
    rootUris = vscode.workspace.workspaceFolders?.map((folder) => folder.uri);
  }

  knowledgeMapProvider = new KnowledgeMapViewProvider(context.extensionUri, rootUris, context);
  // Register the Knowledge Map View Provider
  const provider = vscode.window.registerWebviewViewProvider(
    KnowledgeMapViewProvider.viewType,
    knowledgeMapProvider
  );

  let openKXToFileCommand = vscode.commands.registerCommand('vscodeknowledgemap.OpenKnowledgeMapAt', (uri: vscode.Uri) => {
    rootUris = [uri];
    knowledgeMapProvider.updateRootUris(rootUris);
  });

  const addTagToFileCommand = vscode.commands.registerCommand(
    'vscodeknowledgemap.addTagToFile',
    async (uri: vscode.Uri) => {
      const nodeId = uri?.fsPath ?? vscode.window.activeTextEditor?.document.uri.fsPath;
      if (!nodeId) {
        vscode.window.showWarningMessage("No file selected to tag.");
        return;
      }

      const allTags = knowledgeMapProvider.getAllUsedTags();
      const tagItems: vscode.QuickPickItem[] = allTags.map((t) => ({
        label: t,
        description: "previously used",
      }));

      const picked = await vscode.window.showQuickPick(
        [...tagItems, { label: "$(add) Enter a new tag...", alwaysShow: true }],
        {
          placeHolder: "Select or type a tag to apply",
          canPickMany: false,
          matchOnDescription: true,
        },
      );

      if (!picked) {
        return;
      }

      let tag: string;
      if (picked.label.startsWith("$(add)")) {
        const input = await vscode.window.showInputBox({
          prompt: "Enter a new tag",
          placeHolder: "e.g. important, todo, reference",
          validateInput: (v) =>
            v.trim().length === 0 ? "Tag cannot be empty" : undefined,
        });
        if (!input) {
          return;
        }
        tag = input.trim();
      } else {
        tag = picked.label;
      }

      await knowledgeMapProvider.addTagToNode(nodeId, tag);
      vscode.window.showInformationMessage(`Tag "${tag}" added to ${nodeId.split(/[\\/]/).pop() ?? nodeId}`);
    },
  );

  context.subscriptions.push(provider);
  context.subscriptions.push(openKXToFileCommand);
  context.subscriptions.push(addTagToFileCommand);

  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders((event) => {
      // Update the rootUris and the knowledgeMapProvider if needed
      rootUris = vscode.workspace.workspaceFolders?.map((folder) => folder.uri) || [];
      knowledgeMapProvider.updateRootUris(rootUris);
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {
  Logger.log("Extension - Deactivating", LogLevel.Info);
}
