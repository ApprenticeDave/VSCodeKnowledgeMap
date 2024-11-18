import { EventMonitor } from "../Utils/EventMonitor";
import { Node } from "./Node";
import { Edge } from "./Edge";

export class KnowledgeGraph {
  private eventMonitor: EventMonitor;
  private nodes: Map<string, Node>;
  private edges: Set<Edge>;

  constructor() {
    this.eventMonitor = new EventMonitor();
    this.nodes = new Map<string, Node>();
    this.edges = new Set<Edge>();

    this.eventMonitor.on("NodeAdded", (node: Node) => {});
    this.eventMonitor.on("NodeRemoved", (node: Node) => {});
    this.eventMonitor.on("EdgeAdded", (edge: Edge) => {});
    this.eventMonitor.on("EdgeRemoved", (edge: Edge) => {});
  }

  addNode(node: Node): void {
    this.nodes.set(node.id, node);
    this.eventMonitor.notifyChange("GLNodeAdded", node.toJson());
  }

  removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      this.nodes.delete(nodeId);
      this.edges.forEach((edge) => {
        if (edge.source === node || edge.target === node) {
          this.edges.delete(edge);
        }
      });
    }
  }

  addEdge(edge: Edge): void {
    if (this.nodes.has(edge.source.id) && this.nodes.has(edge.target.id)) {
      this.edges.add(edge);
    } else {
      throw new Error(
        "Both nodes must be added to the graph before adding an edge."
      );
    }
  }

  removeEdge(edge: Edge): void {
    this.edges.delete(edge);
  }

  getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  getEdges(): Edge[] {
    return Array.from(this.edges);
  }
}

/*
// TODO - This is genai stuff need to work through this and fix to make it actually work

// Create a new store
const store = $rdf.graph();

// Define some namespaces
const FOAF = $rdf.Namespace('http://xmlns.com/foaf/0.1/');
const EX = $rdf.Namespace('http://example.org/');

// Add some triples to the store
store.add($rdf.sym(EX('alice')), FOAF('name'), $rdf.literal('Alice'));
store.add($rdf.sym(EX('alice')), FOAF('knows'), $rdf.sym(EX('bob')));
store.add($rdf.sym(EX('bob')), FOAF('name'), $rdf.literal('Bob'));
const test ="";
// Query the store
const query = $rdf.SPARQLToQuery(`
  PREFIX foaf: <http://xmlns.com/foaf/0.1/>
  SELECT ?name
  WHERE {
    ?person foaf:name ?name .
  }
`, false, store);

store.query(query, (result) => {
  console.log(result['?name'].value);
});*/
