import { Utils } from "../Utils/Utils";

export class Node {
  public id: string;
  public name?: string;
  public nodetype?: string;

  constructor(idOrJson: string, name?: string, nodetype?: string) {
    if (Utils.IsJson(idOrJson)) {
      const obj = JSON.parse(idOrJson);
      this.id = obj.id;
      this.name = obj.name;
      if (obj.nodetype) {
        this.nodetype = obj.nodetype;
      }
    } else {
      this.id = idOrJson;
      if (name) {
        this.name = name;
      }
      if (nodetype) {
        this.nodetype = nodetype;
      }
    }
  }

  public equals(other: Node): boolean {
    return this.id === other.id;
  }
}
