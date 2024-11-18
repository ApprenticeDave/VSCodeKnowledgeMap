import { iLinker } from "../iLinker";
import { LogLevel, Utils } from "../../Utils/Utils";
import { EventMonitor } from "../../Utils/EventMonitor";

export class MarkdownProcessor implements iLinker {
  constructor() {}

  async ProcessContent(fileURI: string, content: string): Promise<void> {
    Utils.log(`Processing Markdown content: ${fileURI}`, LogLevel.Info);
    const links = this.extractLinks(content);
    Utils.log(`Found links: ${JSON.stringify(links)}`, LogLevel.Info);
    //TODO: Detect tags and create nodes and edges
    //TODO: content processing with knowledge graph and create nodes and edges
  }

  private async extractLinks(content: string): Promise<Map<string, string>> {
    const links = new Map<string, string>();
    const { unified } = await import("unified");
    const remarkParse = (await import("remark-parse")).default;
    const tree = unified().use(remarkParse).parse(content);

    const { visit } = await import("unist-util-visit");
    visit(tree, "link", (node: any) => {
      links.set(node.url, node.title || node.children[0].value);
    });
    return links;
  }
}
