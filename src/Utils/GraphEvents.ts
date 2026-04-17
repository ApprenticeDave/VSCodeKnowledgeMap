/** @format */

/**
 * Typed constants for all graph event names used across the extension.
 * Using these constants instead of raw strings prevents typo-related bugs
 * and provides a single source of truth for all event names.
 */
export const GraphEvents = {
  // Commands: emitted by KnowledgeMapViewProvider / MarkdownProcessor,
  // consumed by KnowledgeGraph.initEvents()
  AddNode: "AddNode",
  DeleteNode: "DeleteNode",
  AddEdge: "AddEdge",
  RemoveEdge: "RemoveEdge",

  // Notifications: emitted by KnowledgeGraph,
  // consumed by KnowledgeMapViewProvider.initEvents()
  KnowledgeGraphNodeAdded: "KnowledgeGraphNodeAdded",
  KnowledgeGraphNodeRemoved: "KnowledgeGraphNodeRemoved",
  KnowledgeGraphEdgeAdded: "KnowledgeGraphEdgeAdded",
  KnowledgeGraphEdgeRemoved: "KnowledgeGraphEdgeRemoved",
  KnowledgeGraphEdgeUpdated: "KnowledgeGraphEdgeUpdated",
  KnowledgeGraphCleared: "KnowledgeGraphCleared",
} as const;

export type GraphEventName = (typeof GraphEvents)[keyof typeof GraphEvents];
