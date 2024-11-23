import * as vscode from "vscode";
import { FileProcessor } from "./FileProcessor";
import { LogLevel, Utils } from "../Utils/Utils";
import { EventMonitor } from "../Utils/EventMonitor";
import { FolderAndFileUtils } from "../Utils/FolderAndFileUtils";
import path from "path";

export class FileMonitor {
  private watcher: vscode.FileSystemWatcher | undefined;
  private fileProcessor: FileProcessor = new FileProcessor(1);
  private eventMonitor: EventMonitor;

  constructor(eventMonitor: EventMonitor) {
    this.eventMonitor = eventMonitor;

    // Create a file system watcher for the extension folder
    this.init();
  }

  public init() {
    Utils.log("Initializing File Parser", LogLevel.Info);
    this.GetFilesAndFoldersForWorkspace();
    this.setupListenToWorkspace();
  }

  private setupListenToWorkspace() {
    const folderPaths = vscode.workspace.workspaceFolders;

    if (folderPaths) {
      folderPaths.forEach((folder) => {
        Utils.log(
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
      Utils.log("File Monitor - No workspace folder found", LogLevel.Error);
    }
  }

  private onFileChange(uri: vscode.Uri) {
    Utils.log(`File Monitor - File changed: ${uri.fsPath}`, LogLevel.Info);
  }

  private onFileCreate(uri: vscode.Uri) {
    Utils.log(`File Monitor - File created: ${uri.fsPath}`, LogLevel.Info);
    this.emitEntryAdd(uri);
  }

  private onFileDelete(uri: vscode.Uri) {
    Utils.log(`File Monitor - File deleted: ${uri.fsPath}`, LogLevel.Info);
    this.eventMonitor.emit("ItemDeleted", uri.fsPath);
  }

  dispose() {
    if (this.watcher !== undefined) {
      this.watcher.dispose();
    }
  }

  private emitEntryAdd(uri: vscode.Uri, isWorkspace?: boolean) {
    const entryPath = uri.fsPath;
    const entryName = path.basename(uri.fsPath);
    const entryType = isWorkspace ? "workspace" : uri.scheme;
    Utils.log(
      `File Monitor - Adding ${entryType} Item - ${entryPath}`,
      LogLevel.Info
    );
    this.eventMonitor.emit("FileAdded", entryPath, entryName, entryType);
    if (!isWorkspace) {
      this.eventMonitor.emit(
        "EdgeAdd",
        uri.fsPath,
        FolderAndFileUtils.getFileDirectory(uri),
        "contains"
      );
    }
  }

  public async GetFilesAndFoldersForWorkspace() {
    Utils.log(`File Monitor - Processing Open Workspaces`, LogLevel.Info);
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
      Utils.log(`File Monitor - No workspace open`, LogLevel.Info);
      return;
    }

    for (const folder of workspaceFolders) {
      Utils.log(`File Monitor - Processing Workspace ${folder}`, LogLevel.Info);
      // Add Workspace Nodes
      this.emitEntryAdd(folder.uri, true);
      await this.processDirectory(folder.uri);
    }
    return;
  }

  private async processDirectory(uri: vscode.Uri): Promise<void> {
    // Read directory contents
    const entries = await vscode.workspace.fs.readDirectory(uri);

    for (const [name, type] of entries) {
      const entryUri = vscode.Uri.joinPath(uri, name);
      if (type === vscode.FileType.Directory) {
        this.emitEntryAdd(entryUri);
        // Recursively process subdirectories
        await this.processDirectory(entryUri);
      } else if (type === vscode.FileType.File) {
        // Create a node for the file
        this.emitEntryAdd(entryUri);
      }
    }
  }
}
