import type { Rule, RuleContext, Finding } from './types.js';
import { scanFiles } from '../scanners/file-scanner.js';
import { searchInFile } from '../scanners/code-searcher.js';
import { createFinding } from '../models/finding.js';
import { calculateHours } from '../utils/hours.js';
import { debug } from '../utils/logger.js';

/**
 * Rule 3: Tiptap Import Change
 * 
 * Detects import of '@umbraco-cms/backoffice/external/tiptap' which has changed
 * in Umbraco 17's new backoffice architecture.
 * 
 * Hours: 0.5h per file with import
 */

const RULE_ID = 'rule-03-tiptap-import';
const BASE_HOURS = 0.5;

const TIPTAP_IMPORT_PATTERN = '@umbraco-cms/backoffice/external/tiptap';

export const rule03TiptapImport: Rule = {
  id: RULE_ID,
  name: 'Tiptap Import Changes',
  description: 'Detects Tiptap imports that need updating for Umbraco 17 backoffice',
  category: 'frontend',
  baseHours: BASE_HOURS,
  enabled: true,
  filePatterns: ['**/*.ts', '**/*.js'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const tsFiles = await scanFiles(['**/*.ts', '**/*.js'], context.projectPath);

    debug(`[${RULE_ID}] Scanning ${tsFiles.length} TypeScript/JavaScript files`);

    for (const filePath of tsFiles) {
      const matches = await searchInFile(filePath, TIPTAP_IMPORT_PATTERN, true);

      if (matches.length > 0) {
        // Count as one finding per file (not per import line)
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
            importCount: matches.length,
          }
        );

        findings.push(finding);
      }
    }

    debug(`[${RULE_ID}] Created ${findings.length} findings`);
    return findings;
  },
};
