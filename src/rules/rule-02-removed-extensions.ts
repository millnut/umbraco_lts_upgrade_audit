import type { Rule, RuleContext, Finding } from './types.js';
import { findCSharpFiles } from '../scanners/file-scanner.js';
import { searchInFile } from '../scanners/code-searcher.js';
import { createFinding } from '../models/finding.js';
import { calculateHours } from '../utils/hours.js';
import { debug } from '../utils/logger.js';

/**
 * Rule 2: Removed Extension Methods
 * 
 * Detects 17 extension methods that have been removed in Umbraco 17.
 * These methods require code changes to use alternative approaches.
 * 
 * Hours: 1.0h per occurrence (requires code refactoring)
 */

const RULE_ID = 'rule-02-removed-extensions';
const BASE_HOURS = 1.0;

/**
 * List of removed extension methods
 */
const REMOVED_METHODS = [
  'GetAssemblyFile',
  'ToSingleItemCollection',
  'GenerateDataTable',
  'CreateTableData',
  'AddRowData',
  'ChildrenAsTable',
  'RetryUntilSuccessOrTimeout',
  'RetryUntilSuccessOrMaxAttempts',
  'HasFlagAny',
  'Deconstruct',
  'AsEnumerable',
  'ContainsKey',
  'GetValue',
  'DisposeIfDisposable',
  'SafeCast',
  'ToDictionary',
  'SanitizeThreadCulture',
];

/**
 * Build regex pattern to match method calls
 * Pattern: .(MethodName)\s*\(
 */
const PATTERN = new RegExp(
  `\\.(${REMOVED_METHODS.join('|')})\\s*\\(`,
  'g'
);

export const rule02RemovedExtensions: Rule = {
  id: RULE_ID,
  name: 'Removed Extension Methods',
  description: 'Detects usage of 17 extension methods removed in Umbraco 17',
  category: 'breaking-changes',
  baseHours: BASE_HOURS,
  enabled: true,
  filePatterns: ['**/*.cs'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const csFiles = await findCSharpFiles(context.projectPath);

    debug(`[${RULE_ID}] Scanning ${csFiles.length} C# files`);

    for (const filePath of csFiles) {
      const matches = await searchInFile(filePath, PATTERN, true);

      for (const match of matches) {
        const hours = calculateHours(BASE_HOURS, 1);

        const finding = createFinding(
          RULE_ID,
          filePath,
          match.lineNumber,
          match.lineContent,
          hours,
          'error',
          {
            methodName: extractMethodName(match.lineContent),
          }
        );

        findings.push(finding);
      }
    }

    debug(`[${RULE_ID}] Created ${findings.length} findings`);
    return findings;
  },
};

/**
 * Extract method name from line content
 */
function extractMethodName(lineContent: string): string | null {
  const match = lineContent.match(/\.(GetAssemblyFile|ToSingleItemCollection|GenerateDataTable|CreateTableData|AddRowData|ChildrenAsTable|RetryUntilSuccessOrTimeout|RetryUntilSuccessOrMaxAttempts|HasFlagAny|Deconstruct|AsEnumerable|ContainsKey|GetValue|DisposeIfDisposable|SafeCast|ToDictionary|SanitizeThreadCulture)\s*\(/);
  return match ? match[1] : null;
}
