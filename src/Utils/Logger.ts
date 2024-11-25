import * as vscode from "vscode";

export enum LogLevel {
  Info = "INFO",
  Warn = "WARN",
  Error = "ERROR",
}

export class Logger {
  private static outputChannel: vscode.OutputChannel;

  constructor() {
    Logger.outputChannel = vscode.window.createOutputChannel("Knowledge Map");
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
}
