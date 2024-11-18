import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { FileProcessor } from "./FileProcessor";
import { LogLevel, Utils } from "../Utils/Utils";
import { KnowledgeGraph } from "../KnowledgeGraph/KnowledgeGraph";
import { Node } from "../KnowledgeGraph/Node";
import { Edge } from "../KnowledgeGraph/Edge";

export class FileMonitor {
  private watcher: vscode.FileSystemWatcher | undefined;
  private fileProcessor: FileProcessor = new FileProcessor(1);
  private knowledgeGraph: KnowledgeGraph = new KnowledgeGraph();

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
      this.watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(folderPath, "**/*")
      );

      this.watcher.onDidChange(this.onFileChange.bind(this));
      this.watcher.onDidCreate(this.onFileCreate.bind(this));
      this.watcher.onDidDelete(this.onFileDelete.bind(this));
    } else {
      Utils.log("No workspace folder found", LogLevel.Error);
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
    this.knowledgeGraph.addNode(
      new Node(uri.fsPath, path.basename(uri.fsPath))
    );
    this.fileProcessor.addTask(this.fileProcessor.createFileTask(uri.fsPath));
  }

  private onFileDelete(uri: vscode.Uri) {
    Utils.log(`File deleted: ${uri.fsPath}`, LogLevel.Info);
    this.knowledgeGraph.removeNode(uri.fsPath);
  }

  dispose() {
    if (this.watcher !== undefined) {
      this.watcher.dispose();
    }
  }
}
