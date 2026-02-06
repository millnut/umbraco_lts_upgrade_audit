import { readFile } from 'node:fs/promises';
import { createFinding } from '../models/finding.js';
import { scanFiles } from '../scanners/file-scanner.js';
import { calculateHours } from '../utils/hours.js';
import { debug } from '../utils/logger.js';
import type { Finding, Rule, RuleContext } from './types.js';

/**
 * Rule 9: Outdated Property Editors in UDA Files
 *
 * Detects obsolete property editors in Umbraco Document Type (*.uda) files
 * that need migration in Umbraco 17.
 *
 * Detects:
 * - "Umbraco.MediaPicker" (v1/v2, replaced by MediaPicker3)
 * - "Nested Content" (replaced by Block List)
 * - "Stacked Content" (replaced by Block List)
 *
 * Hours: 1h per occurrence
 */

const RULE_ID = 'rule-09-uda-property-editors';
const BASE_HOURS = 1.0;

// Pattern to match outdated property editors
// Using word boundaries to prevent false positives like "Umbraco.MediaPicker3"
const OUTDATED_EDITORS = [
  {
    name: 'Umbraco.MediaPicker',
    // Match "Umbraco.MediaPicker" but not "Umbraco.MediaPicker3"
    pattern: /"Umbraco\.MediaPicker"(?!3)/,
    replacement: 'MediaPicker3',
  },
  {
    name: 'Nested Content',
    pattern: /"Nested Content"/,
    replacement: 'Block List Editor',
  },
  {
    name: 'Stacked Content',
    pattern: /"Stacked Content"/,
    replacement: 'Block List Editor',
  },
];

export const rule09UdaPropertyEditors: Rule = {
  id: RULE_ID,
  name: 'Outdated Property Editors',
  description: 'Detects obsolete property editors in *.uda files that need migration for Umbraco 17',
  category: 'breaking-changes',
  baseHours: BASE_HOURS,
  enabled: true,
  filePatterns: ['**/*.uda'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const udaFiles = await scanFiles(['**/*.uda'], context.projectPath);

    debug(`[${RULE_ID}] Scanning ${udaFiles.length} .uda files`);

    for (const filePath of udaFiles) {
      const content = await readFile(filePath, 'utf-8');

      for (const editor of OUTDATED_EDITORS) {
        // Search for each pattern
        const regex = new RegExp(editor.pattern.source, 'g');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          regex.lastIndex = 0; // Reset regex state
          if (regex.test(line)) {
            const hours = calculateHours(BASE_HOURS, 1);

            const finding = createFinding(
              RULE_ID,
              filePath,
              index + 1, // Convert to 1-based line number
              line.trim(),
              hours,
              'warning',
              {
                outdatedEditor: editor.name,
                recommendedReplacement: editor.replacement,
              },
            );

            findings.push(finding);
          }
        });
      }
    }

    debug(`[${RULE_ID}] Created ${findings.length} findings`);
    return findings;
  },
};
