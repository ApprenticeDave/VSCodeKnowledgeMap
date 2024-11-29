export interface iLinker {
  ProcessContent(fileURI: string, content: string): void;
  canProcess(fileURI: string): boolean;
  ProcesscorName: string;
}
