import { readFile } from 'fs/promises';
import type { CodeSnippet } from '../rules/types.js';
import { debug } from '../utils/logger.js';

/**
 * Code search and pattern matching utilities
 * 
 * Why: Rules need to find specific patterns in source files.
 * Line-by-line regex matching provides accurate line numbers.
 */

/**
 * Result from a pattern search
 */
export interface SearchMatch {
  lineNumber: number; // 1-based
  lineContent: string;
  filePath: string;
}

/**
 * Search for a pattern in a file
 * 
 * @param filePath - File to search
 * @param pattern - Regex pattern or string to find
 * @param caseSensitive - Whether search is case-sensitive
 * @returns Array of matches
 */
export async function searchInFile(
  filePath: string,
  pattern: string | RegExp,
  caseSensitive = true
): Promise<SearchMatch[]> {
  debug(`Searching in file: ${filePath}`);
  debug(`Pattern: ${pattern}`);

  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const matches: SearchMatch[] = [];

  const regex =
    typeof pattern === 'string'
      ? new RegExp(pattern, caseSensitive ? 'g' : 'gi')
      : pattern;

  lines.forEach((line, index) => {
    if (regex.test(line)) {
      matches.push({
        lineNumber: index + 1, // Convert to 1-based
        lineContent: line.trim(),
        filePath,
      });
      // Reset regex lastIndex for global regexes
      regex.lastIndex = 0;
    }
  });

  debug(`Found ${matches.length} matches in ${filePath}`);
  return matches;
}

/**
 * Extract code snippet with surrounding context
 * 
 * @param filePath - File to extract from
 * @param lineNumber - Center line (1-based)
 * @param contextLines - Number of lines before/after
 * @returns Code snippet with context
 */
export async function extractCodeSnippet(
  filePath: string,
  lineNumber: number,
  contextLines = 3
): Promise<CodeSnippet> {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // Convert to 0-based index
  const index = lineNumber - 1;

  // Calculate bounds
  const startIndex = Math.max(0, index - contextLines);
  const endIndex = Math.min(lines.length - 1, index + contextLines);

  const before = lines.slice(startIndex, index);
  const line = lines[index] || '';
  const after = lines.slice(index + 1, endIndex + 1);

  return {
    before,
    line,
    after,
    startLine: startIndex + 1, // Convert back to 1-based
  };
}

/**
 * Search for multiple patterns in a file (OR logic)
 * 
 * @param filePath - File to search
 * @param patterns - Array of patterns
 * @param caseSensitive - Whether search is case-sensitive
 * @returns Array of matches
 */
export async function searchMultiplePatterns(
  filePath: string,
  patterns: Array<string | RegExp>,
  caseSensitive = true
): Promise<SearchMatch[]> {
  const allMatches: SearchMatch[] = [];

  for (const pattern of patterns) {
    const matches = await searchInFile(filePath, pattern, caseSensitive);
    allMatches.push(...matches);
  }

  // Remove duplicates based on line number
  const uniqueMatches = Array.from(
    new Map(allMatches.map((m) => [m.lineNumber, m])).values()
  );

  return uniqueMatches.sort((a, b) => a.lineNumber - b.lineNumber);
}
