import * as vscode from "vscode";
import * as micromatch from "micromatch";

export class Utils {
  public static IsJson(input: any): boolean {
    if (input === null || input === undefined) {
      return false;
    }
    try {
      const json = JSON.parse(input);
      return typeof json === "object";
    } catch (e) {
      return false;
    }
  }

  public static isMatched(
    input: string,
    patterns: string[] | undefined
  ): boolean {
    return micromatch.isMatch(input, patterns ?? []);
  }
}
