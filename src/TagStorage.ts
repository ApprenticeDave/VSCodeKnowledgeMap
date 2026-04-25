/** @format */

import * as vscode from "vscode";

const NODE_TAGS_KEY = "knowledgeMap.nodeTags";
const ALL_TAGS_KEY = "knowledgeMap.allUsedTags";

/**
 * Persists per-node tags and the global list of all previously used tags
 * in VS Code's workspaceState so they survive extension restarts.
 */
export class TagStorage {
  constructor(private readonly context: vscode.ExtensionContext) {}

  /** Returns the tags currently associated with the given node ID. */
  public getTagsForNode(nodeId: string): string[] {
    const all = this.context.workspaceState.get<Record<string, string[]>>(
      NODE_TAGS_KEY,
      {},
    );
    return all[nodeId] ?? [];
  }

  /** Replaces the tag list for a node and updates the global tags list. */
  public async setTagsForNode(
    nodeId: string,
    tags: string[],
  ): Promise<void> {
    const all = this.context.workspaceState.get<Record<string, string[]>>(
      NODE_TAGS_KEY,
      {},
    );
    all[nodeId] = tags;
    await this.context.workspaceState.update(NODE_TAGS_KEY, all);
    await this.updateAllUsedTags(tags);
  }

  /** Returns every tag that has ever been used, de-duplicated and sorted. */
  public getAllUsedTags(): string[] {
    return this.context.workspaceState.get<string[]>(ALL_TAGS_KEY, []);
  }

  /** Returns a snapshot of all node-id → tags mappings. */
  public getAllNodeTags(): Record<string, string[]> {
    return this.context.workspaceState.get<Record<string, string[]>>(
      NODE_TAGS_KEY,
      {},
    );
  }

  private async updateAllUsedTags(newTags: string[]): Promise<void> {
    const existing = this.getAllUsedTags();
    const merged = Array.from(new Set([...existing, ...newTags])).sort();
    await this.context.workspaceState.update(ALL_TAGS_KEY, merged);
  }
}
