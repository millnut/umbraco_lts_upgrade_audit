import type { Rule, RuleContext, Finding } from './types.js';
import { scanFiles } from '../scanners/file-scanner.js';
import { searchInFile } from '../scanners/code-searcher.js';
import { createFinding } from '../models/finding.js';
import { calculateHours } from '../utils/hours.js';
import { debug } from '../utils/logger.js';

/**
 * Rule 5: Program.cs UseInstallerEndpoints
 * 
 * Detects use of UseInstallerEndpoints() which has been removed in Umbraco 17.
 * This is typically found in Program.cs files.
 * 
 * Hours: 0.5h fixed (single configuration change)
 */

const RULE_ID = 'rule-05-program-cs';
const BASE_HOURS = 0.5;

const PATTERN = 'UseInstallerEndpoints()';

export const rule05ProgramCs: Rule = {
  id: RULE_ID,
  name: 'Program.cs Changes',
  description: 'Detects UseInstallerEndpoints() method that has been removed',
  category: 'configuration',
  baseHours: BASE_HOURS,
  enabled: true,
  filePatterns: ['**/Program.cs'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const programFiles = await scanFiles('**/Program.cs', context.projectPath);

    debug(`[${RULE_ID}] Found ${programFiles.length} Program.cs files`);

    for (const filePath of programFiles) {
      const matches = await searchInFile(filePath, PATTERN, true);

      if (matches.length > 0) {
        // Fixed hours per file (not per occurrence)
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
            occurrenceCount: matches.length,
          }
        );

        findings.push(finding);
      }
    }

    debug(`[${RULE_ID}] Created ${findings.length} findings`);
    return findings;
  },
};
