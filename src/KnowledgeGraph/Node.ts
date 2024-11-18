export class Node {
  public name: string;
  public id: string;

  constructor(id: string, name: string) {
    this.name = name;
    this.id = id;
  }

  public toJson(): string {
    return JSON.stringify(this);
  }
}
