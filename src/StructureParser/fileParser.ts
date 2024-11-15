import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";

import { LogLevel, Utils } from "../Utils/Utils";

export class FileParser {
  private watcher: vscode.FileSystemWatcher | undefined;

  constructor() {
    // Create a file system watcher for the extension folder
    this.init();
  }

  public init() {
    Utils.log("Initializing File Parser", LogLevel.Info);
    const folderPath = this.getCurrentWorkspaceFolder();
    if (folderPath) {
      Utils.log(
        `Initializing File Parser for folder: ${folderPath}`,
        LogLevel.Info
      );
      this.watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(folderPath, '**/*'));

      this.watcher.onDidChange(this.onFileChange.bind(this));
      this.watcher.onDidCreate(this.onFileCreate.bind(this));
      this.watcher.onDidDelete(this.onFileDelete.bind(this));
    } else {
      console.error("No workspace folder found");
    }
  }

  private getCurrentWorkspaceFolder(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      return workspaceFolders[0].uri.fsPath;
    }
    return undefined;
  }

  private onFileChange(uri: vscode.Uri) {
    Utils.log(`File changed: ${uri.fsPath}`, LogLevel.Info);
  }

  private onFileCreate(uri: vscode.Uri) {
    Utils.log(`File created: ${uri.fsPath}`, LogLevel.Info);
  }

  private onFileDelete(uri: vscode.Uri) {
    Utils.log(`File deleted: ${uri.fsPath}`, LogLevel.Info);
  }

  dispose() {
    if (this.watcher !== undefined) {
      this.watcher.dispose();
    }
  }
}
