import { Node } from "./Node";

export class Edge {
  public id: string;
  public source: Node;
  public target!: Node;

  constructor(idOrJson: string, source?: Node, target?: Node) {
    if (source) {
      this.id = idOrJson;
      this.source = source;
      if (target) {
        this.target = target;
      }
    } else {
      const obj = JSON.parse(idOrJson);
      this.id = obj.id;
      this.source = obj.source;
      this.target = obj.target;
    }
  }

  public toJson(): string {
    return JSON.stringify(this);
  }

  public to3DForceGraphLink(): string {
    return `{"source": "${this.source.id}", "target": "${this.target.id}"}`;
  }
}
