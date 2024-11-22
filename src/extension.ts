// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FolderAndFileUtils } from "./Utils/FolderAndFileUtils";
import { LogLevel, Utils } from "./Utils/Utils";
import { KnowledgeGraph } from "./KnowledgeGraph/KnowledgeGraph";
import { EventMonitor } from "./Utils/EventMonitor";
import { WebGLPanel } from "./Panel/WebGLPanel";

let workspaceFolderChangeDisposable: vscode.Disposable;
let knowledgeGraph: KnowledgeGraph;
let graphpanel: WebGLPanel;
let eventMonitor: EventMonitor;
let extensionContext: vscode.ExtensionContext;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  Utils.log("Extenson - Activating", LogLevel.Info);

  // extensionContext = context;
  extensionContext = context;
  const currentWorkspace = FolderAndFileUtils.getCurrentWorkspace();
  FolderAndFileUtils.getRecursiveFolderItems(currentWorkspace);

  eventMonitor = new EventMonitor();
  graphpanel = new WebGLPanel(extensionContext, eventMonitor);

  knowledgeGraph = new KnowledgeGraph(eventMonitor);

  eventMonitor.on("GLPanelReady", () => {
    knowledgeGraph.generateNodesAndEdgesForWorkspace();
  });

  // Listen for workspace folder changes
  workspaceFolderChangeDisposable =
    vscode.workspace.onDidChangeWorkspaceFolders((event) => {
      WorkspaceChanged();
    });
}

function WorkspaceChanged() {
  Utils.log("Extension - Workspace Changed", LogLevel.Info);
}

// This method is called when your extension is deactivated
export function deactivate() {}
