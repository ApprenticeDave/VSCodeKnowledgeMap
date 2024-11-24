import * as fs from "fs";
import * as path from "path";
import { MarkdownProcessor } from "./FileTypeProcessors/MarkdownProcessor";
import { iLinker } from "./iLinker";
import { Logger, LogLevel } from "../Utils/Logger";
import { EventMonitor } from "../Utils/EventMonitor";

export class FileProcessor {
  private processors = new Map<string, iLinker>();
  private taskQueue: (() => Promise<void>)[] = [];
  private activeWorkers: number = 0;
  private maxWorkers: number;
  private eventMonitor: EventMonitor;

  constructor(maxWorkers: number, eventMonitor: EventMonitor) {
    this.maxWorkers = maxWorkers;
    this.eventMonitor = eventMonitor;
    // Convert this to a factory
    this.processors.set(".md", new MarkdownProcessor(this.eventMonitor));
  }

  // Add a task to the queue
  public addTask(task: () => Promise<void>): void {
    this.taskQueue.push(task);
    this.processQueue();
  }

  // Process the task queue
  private async processQueue(): Promise<void> {
    if (this.activeWorkers >= this.maxWorkers) {
      return;
    }

    const task = this.taskQueue.shift();
    if (!task) {
      return;
    }

    this.activeWorkers++;
    try {
      await task();
    } catch (error) {
      Logger.log("Task failed:", LogLevel.Error);
    } finally {
      this.activeWorkers--;
      this.processQueue();
    }
  }

  public createFileTask(filePath: string): () => Promise<void> {
    Logger.log(`File Processor - Creating File ${filePath}`, LogLevel.Info);
    return async () => {
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        case ".md":
          Logger.log(
            `Adding Markdown file: ${filePath} to queue.`,
            LogLevel.Info
          );
          this.processors
            .get(".md")
            ?.ProcessContent(filePath, fs.readFileSync(filePath, "utf8"));
        default:
          Logger.log(`Unsupported file type: ${ext}`, LogLevel.Warn);
      }
    };
  }

  public updateFileTask(filePath: string): () => Promise<void> {
    Logger.log(`File Processor - File Updated ${filePath}`, LogLevel.Info);
    return async () => {
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        case ".md":
          Logger.log(
            `Adding Markdown file: ${filePath} to queue.`,
            LogLevel.Info
          );
          this.processors
            .get(".md")
            ?.ProcessContent(filePath, fs.readFileSync(filePath, "utf8"));
        default:
          Logger.log(`Unsupported file type: ${ext}`, LogLevel.Warn);
      }
    };
  }
}
