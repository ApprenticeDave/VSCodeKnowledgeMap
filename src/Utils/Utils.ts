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

  public static isIgnored(
    uri: vscode.Uri,
    patterns: string[] | undefined
  ): boolean {
    if (patterns) {
      const micromatch = require("micromatch");

      if (micromatch([uri.path], patterns).length > 0) {
        return true;
      }
    }
    return false;
  }
}
