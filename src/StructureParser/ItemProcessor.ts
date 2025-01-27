import * as fs from "fs";
import * as vscode from "vscode";
import { MarkdownProcessor } from "./ItemTypeProcessors/MarkdownProcessor";
import { iLinker } from "./iLinker";
import { Logger, LogLevel } from "../Utils/Logger";
import { EventMonitor } from "../Utils/EventMonitor";

export class ItemProcessor {
  private taskQueue: (() => Promise<void>)[] = [];
  private running: boolean = false;
  private activeWorkers: number = 0;
  private maxWorkers: number;
  private processors: iLinker[];
  private ignorelist: string[];
  private eventMonitor: EventMonitor;

  constructor(eventMonitor: EventMonitor) {
    this.eventMonitor = eventMonitor;
    this.maxWorkers =
      vscode.workspace.getConfiguration("knowledgeMap").get("maxWorkers") || 1;
    this.ignorelist =
      vscode.workspace.getConfiguration("knowledgeMap").get("ignorelist") || [];
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
    while (this.running && this.taskQueue.length > 0) {
      if (this.activeWorkers >= this.maxWorkers) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // Wait before retrying
        continue;
      }

      const task = this.taskQueue.shift();
      if (!task) {
        continue;
      }

      this.activeWorkers++;
      try {
        await task();
      } catch (error) {
        Logger.log("Task failed:", LogLevel.Error);
      } finally {
        this.activeWorkers--;
      }
    }
  }

  private addTask(task: () => Promise<void>) {
    this.taskQueue.push(task);
  }

  public createUriTask(uri: vscode.Uri) {
    if (this.ignorelist && this.ignorelist.includes(uri.fsPath)) {
      Logger.log(`File Processor - Ignoring Task ${uri}`, LogLevel.Info);
    } else {
      Logger.log(`File Processor - Creating Task ${uri}`, LogLevel.Info);

      this.processors
        .filter((processor) => processor.canProcess(uri))
        .forEach((processor) => {
          this.addTask(() =>
            processor.ProcessContent(uri, fs.readFileSync(uri.fsPath, "utf8"))
          );
        });
    }
  }
}
