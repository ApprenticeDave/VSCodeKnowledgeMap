import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";
import { FileProcessor } from "./FileProcessor";
import { LogLevel, Utils } from "../Utils/Utils";
import { EventMonitor } from "../Utils/EventMonitor";

export class FileMonitor {
  private watcher: vscode.FileSystemWatcher | undefined;
  private fileProcessor: FileProcessor = new FileProcessor(1);
  private eventMonitor: EventMonitor;
  private currentWorkspace: string;

  constructor(currentWorkspace: string, eventMonitor: EventMonitor) {
    this.eventMonitor = eventMonitor;
    this.currentWorkspace = currentWorkspace;
    // Create a file system watcher for the extension folder
    this.init();
  }

  public init() {
    Utils.log("Initializing File Parser", LogLevel.Info);

    this.initWorkspace();

    this.setupListenToWorkspace();
  }

  private async initWorkspace() {
    //TODO: Add Existing Items and process
    Utils.log(
      `File Monitor - Work through ${this.currentWorkspace} and process structure into nodes and edges`,
      LogLevel.Info
    );

    const filesAndDirectories = await this.getFilesAndDirectoriesInWorkspace();
    filesAndDirectories.forEach((item) => {
      Utils.log(`File Monitor - Found file: ${item.fsPath}`, LogLevel.Info);
      this.processFile(item);
    });
    //TODO: Load from store
    //TODO: Update from Last changes
  }

  private async getFilesAndDirectoriesInWorkspace(): Promise<vscode.Uri[]> {
    if (this.currentWorkspace) {
      const pattern = new vscode.RelativePattern(this.currentWorkspace, "**/*");
      return await vscode.workspace.findFiles(pattern);
    }

    return [];
  }

  private async processFile(file: vscode.Uri) {
    const stats = await this.getFileStats(file.fsPath);

    Utils.log(
      `File Monitor - ${stats.isDirectory() ? "directory" : "file"}: ${
        file.fsPath
      }`,
      LogLevel.Info
    );
    const nodeId = file.fsPath;
    const nodeName = file.path.split("/").pop() || "unknown";
    const node = { id: nodeId, name: nodeName };

    this.eventMonitor.notifyChange("NodeAdded", node);
  }

  private setupListenToWorkspace() {
    const folderPath = this.currentWorkspace;
    if (folderPath) {
      Utils.log(
        `File Monitor - Initializing File Parser for folder: ${folderPath}`,
        LogLevel.Info
      );
      this.watcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(folderPath, "**/*")
      );

      this.watcher.onDidChange(this.onFileChange.bind(this));
      this.watcher.onDidCreate(this.onFileCreate.bind(this));
      this.watcher.onDidDelete(this.onFileDelete.bind(this));
    } else {
      Utils.log("File Monitor - No workspace folder found", LogLevel.Error);
    }
  }

  private getFileStats(path: string): Promise<fs.Stats> {
    return new Promise((resolve, reject) => {
      fs.stat(path, (err, stats) => {
        if (err) {
          reject(err);
        } else {
          resolve(stats);
        }
      });
    });
  }

  private onFileChange(uri: vscode.Uri) {
    Utils.log(`File Monitor - File changed: ${uri.fsPath}`, LogLevel.Info);
  }

  private onFileCreate(uri: vscode.Uri) {
    Utils.log(`File Monitor - File created: ${uri.fsPath}`, LogLevel.Info);
    // this.knowledgeGraph.addNode(
    //   new Node(uri.fsPath, path.basename(uri.fsPath))
    // );
    this.fileProcessor.addTask(this.fileProcessor.createFileTask(uri.fsPath));
  }

  private onFileDelete(uri: vscode.Uri) {
    Utils.log(`File Monitor - File deleted: ${uri.fsPath}`, LogLevel.Info);
    // this.knowledgeGraph.removeNode(uri.fsPath);
  }

  dispose() {
    if (this.watcher !== undefined) {
      this.watcher.dispose();
    }
  }
}
