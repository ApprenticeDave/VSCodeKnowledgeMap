import { iLinker } from "../iLinker";
import { Logger, LogLevel } from "../../Utils/Logger";
import { EventMonitor } from "../../Utils/EventMonitor";
import { Utils } from "../../Utils/Utils";
import { Node } from "../../KnowledgeGraph/Node";
import { Edge } from "../../KnowledgeGraph/Edge";

export class MarkdownProcessor implements iLinker {
  private eventMonitor: EventMonitor;
  public ProcesscorName: string = "MarkdownProcessor";
  private processorPattern = ["*.md"];
  constructor(eventMonitor: EventMonitor) {
    this.eventMonitor = eventMonitor;
  }
  canProcess(fileURI: string): boolean {
    return Utils.isMatched(fileURI, this.processorPattern);
  }

  public async ProcessContent(fileURI: string, content: string): Promise<void> {
    Logger.log(`Processing Markdown content: ${fileURI}`, LogLevel.Info);
    const links = this.extractLinks(content);

    Logger.log(`Found links: ${JSON.stringify(links)}`, LogLevel.Info);
    (await links).forEach((key, value) => {
      this.eventMonitor.emit("NodeAdded", key, value, "documentlink");
      this.eventMonitor.emit("EdgeAdd", fileURI, key, value);
    });
  }

  private async extractNodes(content: string): Promise<Node[]> {
    const nodes: Node[] = [];
    // No nodes to output for markdown at this point
    return nodes;
  }

  private async extractLinks(content: string): Promise<Map<string, string>> {
    const links = new Map<string, string>();
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const matches = content.matchAll(linkRegex);

    for (const match of matches) {
      const linkURL = match[1];
      const linkName = match[2];
      links.set(linkURL, linkName);
    }

    return links;
  }
}
