// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FileMonitor } from "./StructureParser/FileMonitor";
import { LogLevel, Utils } from "./Utils/Utils";
import { WebGLPanel } from "./Panel/WebGLPanel";

let fileChangeMonitor: FileMonitor;
let webGLPanel: WebGLPanel;
let extensionContext: vscode.ExtensionContext; // Global variable to store the context

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  extensionContext = context;

  InitExtensionDependencies();
  Utils.log("Activating", LogLevel.Info);

  // Listen for workspace folder changes
  const workspaceFolderChangeDisposable =
    vscode.workspace.onDidChangeWorkspaceFolders((event) => {
      WorkspaceChanged();
    });
}

function WorkspaceChanged() {
  if (fileChangeMonitor) {
    fileChangeMonitor.dispose();
  }
  InitExtensionDependencies();
}

function InitExtensionDependencies() {
  Utils.log("Initializing Dependencies", LogLevel.Info);
  fileChangeMonitor = new FileMonitor();
  webGLPanel = new WebGLPanel(extensionContext);
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (fileChangeMonitor) {
    fileChangeMonitor.dispose();
  }
}
