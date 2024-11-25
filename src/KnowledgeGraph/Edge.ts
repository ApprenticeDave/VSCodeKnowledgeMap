import { Node } from "./Node";

export class Edge {
  public id: string;
  public source: Node;
  public target!: Node;
  public relationship!: string;
  public weight: number = 1;
  public curvature: number = 0.8;
  public rotation: number = 0;
  public particles: number = 1;

  constructor(
    idOrJson: string,
    source?: Node,
    target?: Node,
    relationship?: string,
    weight?: number
  ) {
    if (source) {
      this.id = idOrJson;
      this.source = source;
      if (target) {
        this.target = target;
      }
      if (relationship) {
        this.relationship = relationship;
      }
      if (weight) {
        this.weight = weight;
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
