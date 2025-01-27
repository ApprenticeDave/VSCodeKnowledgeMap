import * as vscode from "vscode";

export interface iLinker {
  ProcessContent(fileURI: vscode.Uri, content: string): Promise<void>;
  canProcess(uri: vscode.Uri): boolean;
  ProcesscorName: string;
}
