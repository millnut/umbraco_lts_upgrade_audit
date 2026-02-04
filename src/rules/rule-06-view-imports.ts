import type { Rule, RuleContext, Finding } from './types.js';
import { findRazorFiles } from '../scanners/file-scanner.js';
import { searchMultiplePatterns } from '../scanners/code-searcher.js';
import { createFinding } from '../models/finding.js';
import { calculateHours } from '../utils/hours.js';
import { debug } from '../utils/logger.js';

/**
 * Rule 6: ViewImports Smidge Removal
 * 
 * Detects Smidge TagHelper references in _ViewImports.cshtml which need removal
 * in Umbraco 17 (asset bundling changed).
 * 
 * Hours: 0.5h fixed (configuration change)
 */

const RULE_ID = 'rule-06-view-imports';
const BASE_HOURS = 0.5;

const SMIDGE_PATTERNS = [
  'Smidge',
  '@addTagHelper *, Smidge',
  '@inject Smidge',
];

export const rule06ViewImports: Rule = {
  id: RULE_ID,
  name: 'ViewImports Smidge Removal',
  description: 'Detects Smidge references in _ViewImports.cshtml that need removal',
  category: 'configuration',
  baseHours: BASE_HOURS,
  enabled: true,
  filePatterns: ['**/_ViewImports.cshtml'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const razorFiles = await findRazorFiles(context.projectPath);

    // Filter for _ViewImports.cshtml files only
    const viewImportsFiles = razorFiles.filter((path) => path.includes('_ViewImports.cshtml'));

    debug(`[${RULE_ID}] Found ${viewImportsFiles.length} _ViewImports.cshtml files`);

    for (const filePath of viewImportsFiles) {
      const matches = await searchMultiplePatterns(filePath, SMIDGE_PATTERNS, false);

      if (matches.length > 0) {
        // Fixed hours per file
        const hours = calculateHours(BASE_HOURS, 1);
        const firstMatch = matches[0];

        const finding = createFinding(
          RULE_ID,
          filePath,
          firstMatch.lineNumber,
          firstMatch.lineContent,
          hours,
          'warning',
          {
            matchCount: matches.length,
          }
        );

        findings.push(finding);
      }
    }

    debug(`[${RULE_ID}] Created ${findings.length} findings`);
    return findings;
  },
};
