import * as vscode from "vscode";

export enum LogLevel {
  Info = "INFO",
  Warn = "WARN",
  Error = "ERROR",
}

export class Utils {
  private static outputChannel: vscode.OutputChannel;

  constructor() {
    Utils.outputChannel = vscode.window.createOutputChannel("Knowledge Map");
  }

  public static log(message: string, level: LogLevel = LogLevel.Info) {
    const timestamp = new Date().toISOString();
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel("Knowledge Map");
    }
    this.outputChannel.appendLine(
      `[${timestamp}] [${level}] Visual Studio Code - Knowledge Map Extension -  ${message}`
    );
  }

  public static IsJson(input: any): boolean {
    try {
      const json = JSON.parse(input);
      return typeof json === "object";
    } catch (e) {
      return false;
    }
  }
}
