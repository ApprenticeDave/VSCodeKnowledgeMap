import * as path from "path";
import * as vscode from "vscode";
import * as fs from "fs";

export class FolderAndFileUtils {
  public static getRecursiveFolderItems(
    uri: string | undefined
  ): Promise<vscode.Uri[]> {
    if (uri) {
      const pattern = new vscode.RelativePattern(uri, "**/*");
      return new Promise<vscode.Uri[]>((resolve, reject) => {
        vscode.workspace.findFiles(pattern).then(resolve, reject);
      });
    }
    return new Promise<vscode.Uri[]>((resolve, reject) => {});
  }

  public static async getRecursiveDirectoriesForFileList(uris: vscode.Uri[]) {
    const results = await Promise.all(
      uris.map(async (file) => {
        const stat = await vscode.workspace.fs.stat(file);
        return stat.type === vscode.FileType.Directory ? file : undefined;
      })
    );

    // Filter out undefined values
    return results.filter((dir): dir is vscode.Uri => dir !== undefined);
  }

  public static getURIBaseName(uri: vscode.Uri): string {
    return path.basename(uri.fsPath);
  }

  public static getFileDirectory(uri: vscode.Uri): string {
    return path.dirname(uri.fsPath);
  }

  public static getCurrentWorkspace(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      return workspaceFolders[0].uri.fsPath;
    }
    return undefined;
  }

  // Utility method to convert a string to a vscode.Uri
  public static stringToUri(path: string): vscode.Uri {
    return vscode.Uri.file(path);
  }
}
