export interface ProjectInfo {
  /** Root path that was scanned */
  rootPath: string;

  /** Detected Umbraco version */
  umbracoVersion: string | null;

  /** List of .csproj files found */
  projectFiles: string[];

  /** Total files scanned */
  filesScanned: number;

  /** Scan duration in milliseconds */
  scanDurationMs: number;
}
