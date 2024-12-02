import * as vscode from "vscode";
import { FileProcessor } from "./FileProcessor";
import { Logger, LogLevel } from "../Utils/Logger";
import { EventMonitor } from "../Utils/EventMonitor";
import { FolderAndFileUtils } from "../Utils/FolderAndFileUtils";
import { Utils } from "../Utils/Utils";
import path from "path";
import * as fs from "fs";

export class FileMonitor {
  private watcher: vscode.FileSystemWatcher | undefined;
  private fileProcessor?: FileProcessor;
  private eventMonitor: EventMonitor;
  private ignorelist: string[] | undefined = [];
  private runnning: boolean = false;

  constructor(eventMonitor: EventMonitor, isGraphPopulated: boolean) {
    this.eventMonitor = eventMonitor;
    this.ignorelist = vscode.workspace
      .getConfiguration()
      .get("knowledgeMap.ignoreList");

    const proccount = vscode.workspace
      .getConfiguration()
      .get<number>("knowledgeMap.numberConcurrentProcesses");
    const numberofprocesses = proccount ? proccount : 1;

    this.fileProcessor = new FileProcessor(
      numberofprocesses,
      this.eventMonitor
    );
    // Create a file system watcher for the extension folder
    this.init(isGraphPopulated);
  }

  public async init(isGraphPopulated: boolean = false) {
    Logger.log("Initializing File Parser", LogLevel.Info);
    if (!isGraphPopulated) {
      Logger.log(
        "Initializing File Parser - Graph not populated geneating files",
        LogLevel.Info
      );

      await this.GetFilesAndFoldersForWorkspace().then(() => {
        this.fileProcessor?.processStart();
      });

      this.setupListenToWorkspace();
    }
  }

  private setupListenToWorkspace() {
    const folderPaths = vscode.workspace.workspaceFolders;

    if (folderPaths) {
      folderPaths.forEach((folder) => {
        Logger.log(
          `File Monitor - Initializing File Parser for folder: ${folder}`,
          LogLevel.Info
        );
        this.watcher = vscode.workspace.createFileSystemWatcher(
          new vscode.RelativePattern(folder, "**/*")
        );

        this.watcher.onDidChange(this.onFileChange.bind(this));
        this.watcher.onDidCreate(this.onFileCreate.bind(this));
        this.watcher.onDidDelete(this.onFileDelete.bind(this));
      });
    } else {
      Logger.log("File Monitor - No workspace folder found", LogLevel.Error);
    }
  }

  private onFileChange(uri: vscode.Uri) {
    Logger.log(`File Monitor - File changed: ${uri.fsPath}`, LogLevel.Info);
  }

  private onFileCreate(uri: vscode.Uri) {
    Logger.log(`File Monitor - File created: ${uri.fsPath}`, LogLevel.Info);
    if (!Utils.isMatched(uri.path, this.ignorelist)) {
      this.emitEntryAdd(uri);
    }
  }

  private onFileDelete(uri: vscode.Uri) {
    Logger.log(`File Monitor - File deleted: ${uri.fsPath}`, LogLevel.Info);
    this.eventMonitor.emit("NodeDeleted", uri.fsPath);
  }

  dispose() {
    if (this.watcher !== undefined) {
      this.watcher.dispose();
    }
  }

  private getTypeByUri(uri: string): string {
    let type = "file";
    let f = vscode.workspace.workspaceFolders
      ? vscode.workspace.workspaceFolders[0]?.uri.fsPath
      : undefined;

    if (uri === f) {
      type = "workspace";
    } else if (fs.lstatSync(uri).isDirectory()) {
      type = "folder";
    } else if (uri.startsWith("http://") || uri.startsWith("https://")) {
      type = "weblink";
    }

    return type;
  }

  private emitEntryAdd(uri: vscode.Uri) {
    const entryPath = uri.fsPath;

    if (!Utils.isMatched(entryPath, this.ignorelist)) {
      const entryName = path.basename(entryPath);
      const entryType = this.getTypeByUri(entryPath);
      Logger.log(
        `File Monitor - Adding ${entryType} Item - ${entryPath}`,
        LogLevel.Info
      );
      this.eventMonitor.emit("NodeAdded", entryPath, entryName, entryType);
      this.fileProcessor?.createFileTask(entryPath);
      if (entryType !== "workspace") {
        this.eventMonitor.emit(
          "EdgeAdd",
          FolderAndFileUtils.getFileDirectory(uri),
          uri.fsPath,
          "contains"
        );
      }
    }
  }

  private emitEntryUpdate(uri: vscode.Uri) {
    const entryPath = uri.fsPath;
    const entryName = path.basename(entryPath);
    Logger.log(
      `File Monitor - Updating File Item - ${entryPath}`,
      LogLevel.Info
    );
    this.eventMonitor.emit("NodeUpdated", entryPath, entryName);
    this.fileProcessor?.createFileTask(entryPath);
  }

  public async GetFilesAndFoldersForWorkspace() {
    Logger.log(`File Monitor - Processing Open Workspaces`, LogLevel.Info);
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      Logger.log(`File Monitor - No workspace open`, LogLevel.Info);
      return;
    }

    for (const folder of workspaceFolders) {
      Logger.log(
        `File Monitor - Processing Workspace ${folder}`,
        LogLevel.Info
      );
      // Add Workspace Nodes
      this.emitEntryAdd(folder.uri);
      await this.processDirectory(folder.uri);
    }
    return;
  }

  private async processDirectory(uri: vscode.Uri): Promise<void> {
    // Read directory contents
    const entries = await vscode.workspace.fs.readDirectory(uri);

    for (const [name, type] of entries) {
      const entryUri = vscode.Uri.joinPath(uri, name);
      this.emitEntryAdd(entryUri);

      if (type === vscode.FileType.Directory) {
        // Recursively process subdirectories
        await this.processDirectory(entryUri);
      }
    }
  }
}
