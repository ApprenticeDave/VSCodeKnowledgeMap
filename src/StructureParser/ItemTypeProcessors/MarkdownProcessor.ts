import { iLinker } from "../iLinker";
import { Logger, LogLevel } from "../../Utils/Logger";
import { EventMonitor } from "../../Utils/EventMonitor";
import { Utils } from "../../Utils/Utils";
import * as vscode from "vscode";

export class MarkdownProcessor implements iLinker {
  private eventMonitor: EventMonitor;
  public ProcesscorName: string = "MarkdownProcessor";
  private processorPattern = ["**/*.md"];
  constructor(eventMonitor: EventMonitor) {
    this.eventMonitor = eventMonitor;
  }

  public canProcess(fileURI: vscode.Uri): boolean {
    const isMatched = Utils.isMatched(fileURI.fsPath, this.processorPattern);
    Logger.log("MarkdownProcessor canProcess: " + isMatched, LogLevel.Info);
    return isMatched;
  }

  public async ProcessContent(
    fileURI: vscode.Uri,
    content: string
  ): Promise<void> {
    Logger.log(`Processing Markdown content: ${fileURI}`, LogLevel.Info);
    const links = this.extractLinks(content);

    Logger.log(`Found links: ${JSON.stringify(links)}`, LogLevel.Info);
    (await links).forEach((name, url) => {
      this.eventMonitor.emit("AddNode", url, name, "link");
      this.eventMonitor.emit("AddEdge", fileURI.fsPath, url, "reference");
    });
  }

  private async extractLinks(content: string): Promise<Map<string, string>> {
    const links = new Map<string, string>();
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const matches = content.matchAll(linkRegex);

    for (const match of matches) {
      const linkName = match[1];
      const linkURL = match[2];
      links.set(linkURL, linkName);
    }

    return links;
  }
}
