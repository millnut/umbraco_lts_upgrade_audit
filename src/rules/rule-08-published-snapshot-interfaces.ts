import { createFinding } from '../models/finding.js';
import { searchMultiplePatterns } from '../scanners/code-searcher.js';
import { findCSharpFiles } from '../scanners/file-scanner.js';
import { debug } from '../utils/logger.js';
import type { Finding, Rule, RuleContext } from './types.js';

/**
 * Rule 8: Published Snapshot Interfaces
 *
 * Detects usage of IPublishedSnapshotAccessor and IPublishedSnapshot interfaces
 * that require updates in Umbraco 17.
 *
 * Hours:
 * - 0.5h fixed total if ANY *.generated.cs files contain these interfaces
 *   (regenerating all models is a one-time task)
 * - 0.5h per file for other *.cs files
 */

const RULE_ID = 'rule-08-published-snapshot-interfaces';
const BASE_HOURS_GENERATED_TOTAL = 0.5;
const BASE_HOURS_REGULAR = 0.5;

/**
 * List of published snapshot interfaces to detect
 */
const SNAPSHOT_INTERFACES = ['IPublishedSnapshotAccessor', 'IPublishedSnapshot'];

/**
 * Build regex patterns to match interface usage
 */
const PATTERNS = SNAPSHOT_INTERFACES.map((interfaceName) => new RegExp(`\\b${interfaceName}\\b`, 'g'));

/**
 * Check if a file is a generated file
 */
function isGeneratedFile(filePath: string): boolean {
  return filePath.endsWith('.generated.cs');
}

export const rule08PublishedSnapshotInterfaces: Rule = {
  id: RULE_ID,
  name: 'Published Snapshot Interfaces',
  description: 'Detects IPublishedSnapshotAccessor and IPublishedSnapshot usage requiring updates',
  category: 'breaking-changes',
  baseHours: BASE_HOURS_REGULAR, // Default for non-generated files
  enabled: true,
  filePatterns: ['**/*.cs'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const csFiles = await findCSharpFiles(context.projectPath);

    debug(`[${RULE_ID}] Scanning ${csFiles.length} C# files`);

    const generatedFilesWithMatches: Array<{ filePath: string; lineNumber: number; lineContent: string }> = [];
    const regularFilesWithMatches: Array<{
      filePath: string;
      lineNumber: number;
      lineContent: string;
      matchCount: number;
    }> = [];

    // Scan all files and categorize findings
    for (const filePath of csFiles) {
      const matches = await searchMultiplePatterns(filePath, PATTERNS, false);

      if (matches.length > 0) {
        const isGenerated = isGeneratedFile(filePath);
        const firstMatch = matches[0];

        if (isGenerated) {
          generatedFilesWithMatches.push({
            filePath,
            lineNumber: firstMatch.lineNumber,
            lineContent: firstMatch.lineContent,
          });
        } else {
          regularFilesWithMatches.push({
            filePath,
            lineNumber: firstMatch.lineNumber,
            lineContent: firstMatch.lineContent,
            matchCount: matches.length,
          });
        }
      }
    }

    // Create ONE finding for ALL generated files (0.5h fixed total)
    if (generatedFilesWithMatches.length > 0) {
      const firstGenerated = generatedFilesWithMatches[0];
      const interfaceName = extractInterfaceName(firstGenerated.lineContent);

      const finding = createFinding(
        RULE_ID,
        firstGenerated.filePath,
        firstGenerated.lineNumber,
        firstGenerated.lineContent,
        BASE_HOURS_GENERATED_TOTAL,
        'warning',
        {
          interfaceName: interfaceName || 'Unknown',
          fileType: 'generated',
          generatedFileCount: generatedFilesWithMatches.length,
          note: 'Regenerating all models is a one-time task',
        },
      );

      findings.push(finding);
    }

    // Create one finding per regular file (0.5h each)
    for (const fileMatch of regularFilesWithMatches) {
      const interfaceName = extractInterfaceName(fileMatch.lineContent);

      const finding = createFinding(
        RULE_ID,
        fileMatch.filePath,
        fileMatch.lineNumber,
        fileMatch.lineContent,
        BASE_HOURS_REGULAR,
        'warning',
        {
          interfaceName: interfaceName || 'Unknown',
          occurrenceCount: fileMatch.matchCount,
          fileType: 'regular',
        },
      );

      findings.push(finding);
    }

    debug(
      `[${RULE_ID}] Created ${findings.length} findings (${generatedFilesWithMatches.length} generated files, ${regularFilesWithMatches.length} regular files)`,
    );
    return findings;
  },
};

/**
 * Extract interface name from line content
 */
function extractInterfaceName(lineContent: string): string | null {
  const match = lineContent.match(/\b(IPublishedSnapshotAccessor|IPublishedSnapshot)\b/);
  return match ? match[1] : null;
}
