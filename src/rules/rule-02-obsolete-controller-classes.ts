import { createFinding } from '../models/finding.js';
import { searchMultiplePatterns } from '../scanners/code-searcher.js';
import { findCSharpFiles } from '../scanners/file-scanner.js';
import { calculateHours } from '../utils/hours.js';
import { debug } from '../utils/logger.js';
import type { Finding, Rule, RuleContext } from './types.js';

/**
 * Rule 2: Obsolete Controller Classes
 *
 * Detects 3 controller base classes that no longer exist in Umbraco 17.
 * These classes require updating to use new controller base classes.
 *
 * Hours: 1.0h per file (requires class refactoring)
 */

const RULE_ID = 'rule-02-obsolete-controllers';
const BASE_HOURS = 1.0;

/**
 * List of obsolete controller classes
 */
const OBSOLETE_CLASSES = ['UmbracoApiController', 'UmbracoAuthorizedApiController', 'UmbracoAuthorizedJsonController'];

/**
 * Build regex patterns to match class usage (inheritance, type references)
 */
const PATTERNS = OBSOLETE_CLASSES.map((className) => new RegExp(`\\b${className}\\b`, 'g'));

export const rule02ObsoleteControllers: Rule = {
  id: RULE_ID,
  name: 'Obsolete Controller Classes',
  description: 'Detects usage of controller classes that no longer exist in Umbraco 17',
  category: 'breaking-changes',
  baseHours: BASE_HOURS,
  enabled: true,
  filePatterns: ['**/*.cs'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const csFiles = await findCSharpFiles(context.projectPath);

    debug(`[${RULE_ID}] Scanning ${csFiles.length} C# files`);

    // Track files with obsolete classes (one finding per file)
    const filesWithObsoleteClasses = new Map<string, { lineNumber: number; lineContent: string; className: string }>();

    for (const filePath of csFiles) {
      const matches = await searchMultiplePatterns(filePath, PATTERNS, false);

      if (matches.length > 0) {
        const firstMatch = matches[0];
        const className = extractClassName(firstMatch.lineContent);

        filesWithObsoleteClasses.set(filePath, {
          lineNumber: firstMatch.lineNumber,
          lineContent: firstMatch.lineContent,
          className: className || 'Unknown',
        });
      }
    }

    // Create one finding per file (not per occurrence)
    for (const [filePath, matchInfo] of filesWithObsoleteClasses) {
      const hours = calculateHours(BASE_HOURS, 1);

      const finding = createFinding(RULE_ID, filePath, matchInfo.lineNumber, matchInfo.lineContent, hours, 'error', {
        className: matchInfo.className,
      });

      findings.push(finding);
    }

    debug(`[${RULE_ID}] Created ${findings.length} findings`);
    return findings;
  },
};

/**
 * Extract class name from line content
 */
function extractClassName(lineContent: string): string | null {
  const match = lineContent.match(
    /\b(UmbracoApiController|UmbracoAuthorizedApiController|UmbracoAuthorizedJsonController)\b/,
  );
  return match ? match[1] : null;
}
