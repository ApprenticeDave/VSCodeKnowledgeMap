import { Node } from "./Node";

export class Edge {
  public source: Node;
  public target: Node;
  public weight: number;
  public label: string;

  constructor(source: Node, target: Node, weight: number, label: string) {
    this.source = source;
    this.target = target;
    this.weight = weight;
    this.label = label;
  }

  public toJson(): string {
    return JSON.stringify(this);
  }
}
