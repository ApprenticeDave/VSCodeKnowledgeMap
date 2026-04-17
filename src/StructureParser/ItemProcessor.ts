/** @format */

import * as vscode from "vscode";
import { MarkdownProcessor } from "./ItemTypeProcessors/MarkdownProcessor";
import { iLinker } from "./iLinker";
import { Logger, LogLevel } from "../Utils/Logger";
import { EventMonitor } from "../Utils/EventMonitor";
import { Utils } from "../Utils/Utils";

export class ItemProcessor {
  private taskQueue: (() => Promise<void>)[] = [];
  private running: boolean = false;
  private maxWorkers: number;
  private processors: iLinker[];
  private ignorelist: string[];
  private eventMonitor: EventMonitor;

  constructor(eventMonitor: EventMonitor) {
    this.eventMonitor = eventMonitor;
    this.maxWorkers =
      vscode.workspace
        .getConfiguration("knowledgeMap")
        .get("numberConcurrentProcesses") || 1;
    this.ignorelist =
      vscode.workspace.getConfiguration("knowledgeMap").get("ignoreList") || [];
    this.processors = [new MarkdownProcessor(this.eventMonitor)];
  }

  public clearTasks() {
    this.taskQueue = [];
  }

  public async start(): Promise<void> {
    if (!this.running) {
      this.running = true;
      await this.processQueue();
    }
  }

  public stop() {
    this.running = false;
  }

  private async processQueue(): Promise<void> {
    const executing: Set<Promise<void>> = new Set();

    while (this.running && this.taskQueue.length > 0) {
      if (executing.size >= this.maxWorkers) {
        await Promise.race(executing);
        continue;
      }

      const task = this.taskQueue.shift();
      if (!task) {
        continue;
      }

      const taskPromise = (async () => {
        try {
          await task();
        } catch (error) {
          Logger.log("Task failed:", LogLevel.Error);
        }
      })();

      executing.add(taskPromise);
      taskPromise.finally(() => executing.delete(taskPromise));
    }

    // Wait for all remaining in-progress tasks to finish
    if (executing.size > 0) {
      await Promise.all(executing);
    }
  }

  private addTask(task: () => Promise<void>) {
    this.taskQueue.push(task);
  }

  public createUriTask(uri: vscode.Uri) {
    if (this.ignorelist && Utils.isMatched(uri.fsPath, this.ignorelist)) {
      Logger.log(`File Processor - Ignoring Task ${uri}`, LogLevel.Info);
    } else {
      Logger.log(`File Processor - Creating Task ${uri}`, LogLevel.Info);

      this.processors
        .filter((processor) => processor.canProcess(uri))
        .forEach((processor) => {
          this.addTask(async () => {
            const fileContent = await vscode.workspace.fs.readFile(uri);
            const text = new TextDecoder().decode(fileContent);
            await processor.processContent(uri, text);
          });
        });
    }
  }
}
