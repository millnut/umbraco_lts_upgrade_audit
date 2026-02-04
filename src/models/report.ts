import type { RuleCategory, Finding } from '../rules/types.js';

/**
 * Project information extracted during scanning
 */
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

/**
 * Per-rule summary of results
 */
export interface RuleResult {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  findingsCount: number;
  totalHours: number;
  enabled: boolean;
}

/**
 * Category-based summary of findings
 */
export interface CategorySummary {
  category: RuleCategory;
  findings: number;
  hours: number;
}

/**
 * Aggregate summary statistics
 */
export interface AuditSummary {
  /** Total estimated hours */
  totalHours: number;

  /** Total estimated days (hours / 8) */
  totalDays: number;

  /** Number of rules that triggered findings */
  rulesTriggered: number;

  /** Total number of findings */
  totalFindings: number;

  /** Breakdown by category */
  byCategory: CategorySummary[];
}

/**
 * Diagnostic message (error, warning, info)
 */
export interface Diagnostic {
  level: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
}

/**
 * Complete audit report
 */
export interface AuditReport {
  /** Metadata about the scanned project */
  project: ProjectInfo;

  /** When the audit was performed */
  timestamp: Date;

  /** Tool version used */
  toolVersion: string;

  /** All findings from all rules */
  findings: Finding[];

  /** Summary statistics */
  summary: AuditSummary;

  /** Per-rule breakdown */
  ruleResults: RuleResult[];

  /** Any errors or warnings during the audit */
  diagnostics: Diagnostic[];
}
