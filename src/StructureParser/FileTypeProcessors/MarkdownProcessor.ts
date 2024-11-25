import { iLinker } from "../iLinker";
import { Logger, LogLevel } from "../../Utils/Logger";
import { EventMonitor } from "../../Utils/EventMonitor";

export class MarkdownProcessor implements iLinker {
  private eventMonitor: EventMonitor;

  constructor(eventMonitor: EventMonitor) {
    this.eventMonitor = eventMonitor;
  }

  async ProcessContent(fileURI: string, content: string): Promise<void> {
    Logger.log(`Processing Markdown content: ${fileURI}`, LogLevel.Info);
    const links = this.extractLinks(content);

    Logger.log(`Found links: ${JSON.stringify(links)}`, LogLevel.Info);
    (await links).forEach((key, value) => {
      this.eventMonitor.emit("NodeAdded", key, value, "documentlink");
      this.eventMonitor.emit("EdgeAdd", fileURI, key, value);
    });
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
