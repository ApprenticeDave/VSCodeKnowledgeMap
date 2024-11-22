import * as fs from "fs";
import * as path from "path";
import { MarkdownProcessor } from "./FileTypeProcessors/MarkdownProcessor";
import { iLinker } from "./iLinker";
import { LogLevel, Utils } from "../Utils/Utils";

export class FileProcessor {
  private processors = new Map<string, iLinker>();
  private taskQueue: (() => Promise<void>)[] = [];
  private activeWorkers: number = 0;
  private maxWorkers: number;

  constructor(maxWorkers: number) {
    this.maxWorkers = maxWorkers;
    this.processors.set(".md", new MarkdownProcessor());
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
      Utils.log("Task failed:", LogLevel.Error);
    } finally {
      this.activeWorkers--;
      this.processQueue();
    }
  }

  public createFileTask(filePath: string): () => Promise<void> {
    Utils.log(`File Processor - Creating File ${filePath}`, LogLevel.Info);
    return async () => {
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        case ".md":
          Utils.log(
            `Adding Markdown file: ${filePath} to queue.`,
            LogLevel.Info
          );
          this.processors
            .get(".md")
            ?.ProcessContent(filePath, fs.readFileSync(filePath, "utf8"));
        default:
          Utils.log(`Unsupported file type: ${ext}`, LogLevel.Warn);
      }
    };
  }

  public updateFileTask(filePath: string): () => Promise<void> {
    Utils.log(`File Processor - File Updated ${filePath}`, LogLevel.Info);
    return async () => {
      const ext = path.extname(filePath).toLowerCase();
      switch (ext) {
        case ".md":
          Utils.log(
            `Adding Markdown file: ${filePath} to queue.`,
            LogLevel.Info
          );
          this.processors
            .get(".md")
            ?.ProcessContent(filePath, fs.readFileSync(filePath, "utf8"));
        default:
          Utils.log(`Unsupported file type: ${ext}`, LogLevel.Warn);
      }
    };
  }
}
