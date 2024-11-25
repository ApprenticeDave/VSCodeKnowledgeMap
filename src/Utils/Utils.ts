import * as vscode from "vscode";

export class Utils {
  constructor() {}

  public static IsJson(input: any): boolean {
    try {
      const json = JSON.parse(input);
      return typeof json === "object";
    } catch (e) {
      return false;
    }
  }
}
