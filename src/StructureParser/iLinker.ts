import * as vscode from "vscode";

export interface iLinker {
  processContent(fileURI: vscode.Uri, content: string): Promise<void>;
  canProcess(uri: vscode.Uri): boolean;
  processorName: string;
}
