// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { FileParser } from "./StructureParser/fileParser";
import { LogLevel, Utils } from "./Utils/Utils";
import { WebGLPanel } from "./Panel/WebGLPanel";

let fileParser: FileParser;
let mappanel: WebGLPanel;
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  InitExtensionDependencies();
  Utils.log("Activating", LogLevel.Info);

  // Listen for workspace folder changes
  const workspaceFolderChangeDisposable =
    vscode.workspace.onDidChangeWorkspaceFolders((event) => {
      WorkspaceChanged();
    });
}

function WorkspaceChanged() {
  if (fileParser) {
    fileParser.dispose();
  }
  InitExtensionDependencies();
}

function InitExtensionDependencies() {
  Utils.log("Initializing Dependencies", LogLevel.Info);
  fileParser = new FileParser();
  mappanel = new WebGLPanel();
}

// This method is called when your extension is deactivated
export function deactivate() {
  if (fileParser) {
    fileParser.dispose();
  }
}
