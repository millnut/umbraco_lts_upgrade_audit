/**
 * Rule Categories for grouping audit findings
 */
export type RuleCategory =
  | 'package-updates' // NuGet package changes
  | 'breaking-changes' // Removed/renamed APIs
  | 'configuration' // Config file changes
  | 'frontend'; // JavaScript/TypeScript changes

/**
 * Severity level for findings
 */
export type FindingSeverity = 'error' | 'warning' | 'info';

/**
 * Context provided to rules during execution
 */
export interface RuleContext {
  /** Root path of the project being scanned */
  projectPath: string;
  /** List of all .csproj files found */
  projectFiles: string[];
  /** All files discovered during scanning */
  allFiles: string[];
  /** Debug mode enabled */
  debug: boolean;
}

/**
 * A single audit rule that detects upgrade-relevant patterns
 */
export interface Rule {
  /** Unique identifier (e.g., "rule-01-nuget-packages") */
  id: string;

  /** Human-readable name for display */
  name: string;

  /** Detailed description of what the rule detects */
  description: string;

  /** Category for grouping in reports */
  category: RuleCategory;

  /** Base hours estimate per occurrence */
  baseHours: number;

  /** Whether the rule is enabled (can be overridden via config) */
  enabled: boolean;

  /** File patterns this rule applies to (glob patterns) */
  filePatterns: string[];

  /** Execute the rule against scanned files */
  execute(context: RuleContext): Promise<Finding[]>;
}

/**
 * Code snippet with surrounding context
 */
export interface CodeSnippet {
  /** Lines before the finding */
  before: string[];

  /** The finding line itself */
  line: string;

  /** Lines after the finding */
  after: string[];

  /** Starting line number of the snippet */
  startLine: number;
}

/**
 * A single instance where a rule matched in the codebase
 */
export interface Finding {
  /** Reference to the rule that generated this finding */
  ruleId: string;

  /** Absolute path to the file containing the finding */
  filePath: string;

  /** Line number (1-based) where the finding occurs */
  lineNumber: number;

  /** The matching line content (trimmed) */
  lineContent: string;

  /** Code snippet with surrounding context (for verbose mode) */
  codeSnippet?: CodeSnippet;

  /** Calculated hours for this specific finding */
  hours: number;

  /** Severity level for prioritization */
  severity: FindingSeverity;

  /** Additional metadata specific to the rule */
  metadata?: Record<string, unknown>;
}
