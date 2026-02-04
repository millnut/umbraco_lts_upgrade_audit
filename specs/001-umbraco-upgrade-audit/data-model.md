# Data Model: Umbraco LTS Upgrade Audit CLI

**Date**: 2026-02-04  
**Phase**: 1 - Design  
**Status**: Complete

## Entity Definitions

### Rule

Represents a single audit rule that detects upgrade-relevant patterns.

```typescript
interface Rule {
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

type RuleCategory = 
  | 'package-updates'      // NuGet package changes
  | 'breaking-changes'     // Removed/renamed APIs
  | 'configuration'        // Config file changes
  | 'frontend';            // JavaScript/TypeScript changes
```

### Finding

Represents a single instance where a rule matched in the codebase.

```typescript
interface Finding {
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

interface CodeSnippet {
  /** Lines before the finding */
  before: string[];
  
  /** The finding line itself */
  line: string;
  
  /** Lines after the finding */
  after: string[];
  
  /** Starting line number of the snippet */
  startLine: number;
}

type FindingSeverity = 'error' | 'warning' | 'info';
```

### PackageInfo (Rule 1 specific)

Extended metadata for NuGet package findings.

```typescript
interface PackageInfo {
  /** Package name (e.g., "Umbraco.Cms") */
  name: string;
  
  /** Currently installed version */
  currentVersion: string;
  
  /** Latest available version from NuGet */
  latestVersion: string | null;
  
  /** Whether latest version is compatible with Umbraco 17/.NET 10 */
  isCompatible: boolean | null;
  
  /** Whether this is an official Umbraco package */
  isUmbracoPackage: boolean;
  
  /** Compatibility notes or warnings */
  notes?: string;
}
```

### AuditReport

The aggregate result of scanning a project.

```typescript
interface AuditReport {
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

interface ProjectInfo {
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

interface AuditSummary {
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

interface CategorySummary {
  category: RuleCategory;
  findings: number;
  hours: number;
}

interface RuleResult {
  ruleId: string;
  ruleName: string;
  category: RuleCategory;
  findingsCount: number;
  totalHours: number;
  enabled: boolean;
}

interface Diagnostic {
  level: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
}
```

### RuleContext

Context passed to rules during execution.

```typescript
interface RuleContext {
  /** Root path of the project being scanned */
  rootPath: string;
  
  /** All discovered files matching the rule's patterns */
  files: ScannedFile[];
  
  /** Logger for debug output */
  logger: Logger;
  
  /** Configuration overrides */
  config: RuleConfig;
}

interface ScannedFile {
  /** Absolute path */
  path: string;
  
  /** Path relative to project root */
  relativePath: string;
  
  /** File content (lazy-loaded) */
  getContent(): Promise<string>;
  
  /** File content as lines (lazy-loaded) */
  getLines(): Promise<string[]>;
}

interface RuleConfig {
  /** Override base hours for this rule */
  hoursOverride?: number;
  
  /** Custom patterns to include/exclude */
  includePatterns?: string[];
  excludePatterns?: string[];
}
```

### Configuration

User configuration schema.

```typescript
interface UserConfig {
  /** Rule-specific overrides */
  rules?: {
    [ruleId: string]: {
      enabled?: boolean;
      baseHours?: number;
      includePatterns?: string[];
      excludePatterns?: string[];
    };
  };
  
  /** Output preferences */
  output?: {
    format?: 'console' | 'json' | 'html';
    showCodeSnippets?: boolean;
    colorEnabled?: boolean;
  };
  
  /** Paths to exclude from scanning */
  excludePaths?: string[];
}
```

## Validation Schemas (Zod)

```typescript
import { z } from 'zod';

export const PackageReferenceSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+/),
});

export const UserConfigSchema = z.object({
  rules: z.record(z.object({
    enabled: z.boolean().optional(),
    baseHours: z.number().positive().optional(),
    includePatterns: z.array(z.string()).optional(),
    excludePatterns: z.array(z.string()).optional(),
  })).optional(),
  output: z.object({
    format: z.enum(['console', 'json', 'html']).optional(),
    showCodeSnippets: z.boolean().optional(),
    colorEnabled: z.boolean().optional(),
  }).optional(),
  excludePaths: z.array(z.string()).optional(),
}).strict();

export const CLIArgsSchema = z.object({
  path: z.string().min(1),
  output: z.enum(['console', 'json', 'html']).default('console'),
  config: z.string().optional(),
  verbose: z.boolean().default(false),
  debug: z.boolean().default(false),
  color: z.boolean().default(true),
});
```

## Entity Relationships

```
┌─────────────┐     executes      ┌─────────────┐
│    Rule     │─────────────────▶│   Finding   │
│             │     1:many        │             │
└─────────────┘                   └─────────────┘
       │                                 │
       │                                 │
       ▼                                 ▼
┌─────────────┐                   ┌─────────────┐
│RuleCategory │                   │ PackageInfo │
│   (enum)    │                   │ (metadata)  │
└─────────────┘                   └─────────────┘
                                         
┌─────────────┐     contains      ┌─────────────┐
│ AuditReport │─────────────────▶│  Finding[]  │
│             │                   └─────────────┘
│             │     contains      ┌─────────────┐
│             │─────────────────▶│ RuleResult[]│
│             │                   └─────────────┘
│             │     contains      ┌─────────────┐
│             │─────────────────▶│AuditSummary │
└─────────────┘                   └─────────────┘
```

## State Transitions

The audit process follows a linear state machine:

```
IDLE → SCANNING → ANALYZING → REPORTING → COMPLETE
  │        │          │           │
  └────────┴──────────┴───────────┴──→ ERROR (from any state)
```

| State | Description | Outputs |
|-------|-------------|---------|
| IDLE | Waiting for input path | — |
| SCANNING | Discovering files in project | File list, progress % |
| ANALYZING | Running rules against files | Findings (streaming) |
| REPORTING | Generating output | AuditReport |
| COMPLETE | Audit finished successfully | Exit code 0 |
| ERROR | Unrecoverable error | Diagnostic, Exit code 2 |
