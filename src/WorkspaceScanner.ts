/** @format */

import * as vscode from "vscode";
import { Logger, LogLevel } from "./Utils/Logger";
import { EventMonitor } from "./Utils/EventMonitor";
import { GraphEvents } from "./Utils/GraphEvents";
import { ItemProcessor } from "./StructureParser/ItemProcessor";
import * as path from "path";

/**
 * Traverses workspace directories and emits graph events for discovered files
 * and folders. Extracted from KnowledgeMapViewProvider to enable independent
 * testing and future file-watcher support.
 */
export class WorkspaceScanner {
  constructor(private readonly eventMonitor: EventMonitor) {}

  /**
   * Recursively scans the given root URIs and emits AddNode / AddEdge events
   * for every file and folder encountered. Optionally registers each file
   * as a task on the supplied ItemProcessor.
   */
  public async scan(
    rootUris: vscode.Uri[],
    itemProcessor?: ItemProcessor,
  ): Promise<void> {
    const items: { uri: vscode.Uri; parent?: vscode.Uri }[] = [];

    for (const turi of rootUris) {
      items.push({ uri: turi });
    }

    while (items.length > 0) {
      const item = items.shift();
      if (item) {
        try {
          const stat = await vscode.workspace.fs.stat(item.uri);
          if (stat.type === vscode.FileType.Directory) {
            const files = await vscode.workspace.fs.readDirectory(item.uri);
            for (const file of files) {
              items.push({
                uri: vscode.Uri.joinPath(item.uri, file[0]),
                parent: item.uri,
              });
            }
            this.eventMonitor.emit(
              GraphEvents.AddNode,
              item.uri.fsPath,
              path.basename(item.uri.fsPath),
              "folder",
            );
          } else if (stat.type === vscode.FileType.File) {
            this.eventMonitor.emit(
              GraphEvents.AddNode,
              item.uri.fsPath,
              path.basename(item.uri.fsPath),
              "file",
            );
            itemProcessor?.createUriTask(item.uri);
          }

          if (item.parent) {
            this.eventMonitor.emit(
              GraphEvents.AddEdge,
              item.parent.fsPath,
              item.uri.fsPath,
              "contains",
            );
          }
        } catch (error) {
          Logger.log(
            `WorkspaceScanner - Skipping ${item.uri.fsPath}: ${error}`,
            LogLevel.Warn,
          );
        }
      }
    }
  }
}
