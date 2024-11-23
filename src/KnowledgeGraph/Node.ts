export class Node {
  public name: string;
  public id: string;
  public nodetype?: string;

  constructor(idOrJson: string, name?: string, nodetype?: string) {
    if (name) {
      this.name = name;
      this.id = idOrJson;
      if (nodetype) {
        this.nodetype = nodetype;
      }
    } else {
      const obj = JSON.parse(idOrJson);
      this.name = obj.name;
      this.id = obj.id;
      if (obj.nodetype) {
        this.nodetype = obj.nodetype;
      }
    }
  }
}
