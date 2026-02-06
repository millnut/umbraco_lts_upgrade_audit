import type { CodeSnippet, Finding, FindingSeverity } from '../rules/types.js';

/**
 * Creates a new Finding instance
 *
 * @param ruleId - Rule identifier that generated this finding
 * @param filePath - Absolute path to the file
 * @param lineNumber - Line number (1-based)
 * @param lineContent - Content of the line
 * @param hours - Calculated hours
 * @param severity - Finding severity level
 * @param metadata - Optional additional metadata
 * @returns Finding instance
 */
export function createFinding(
  ruleId: string,
  filePath: string,
  lineNumber: number,
  lineContent: string,
  hours: number,
  severity: FindingSeverity = 'warning',
  metadata?: Record<string, unknown>,
): Finding {
  return {
    ruleId,
    filePath,
    lineNumber,
    lineContent: lineContent.trim(),
    hours,
    severity,
    metadata,
  };
}

/**
 * Adds a code snippet to a finding
 *
 * @param finding - Finding to augment
 * @param codeSnippet - Code snippet with context
 * @returns Finding with code snippet
 */
export function addCodeSnippet(finding: Finding, codeSnippet: CodeSnippet): Finding {
  return {
    ...finding,
    codeSnippet,
  };
}
