import type { Rule, RuleContext, Finding } from './types.js';
import { findAppPluginFiles } from '../scanners/file-scanner.js';
import { searchMultiplePatterns } from '../scanners/code-searcher.js';
import { createFinding } from '../models/finding.js';
import { debug } from '../utils/logger.js';

/**
 * Rule 7: Angular Detection
 * 
 * Detects AngularJS patterns in App_Plugins that need migration to Umbraco 17's
 * new backoffice architecture (Lit/Web Components).
 * 
 * Hours: 2h base + 0.5h per 10 files
 */

const RULE_ID = 'rule-07-angular-detection';
const BASE_HOURS = 2.0;
const ADDITIONAL_HOURS_PER_10_FILES = 0.5;

/**
 * AngularJS patterns from research.md
 */
const ANGULAR_PATTERNS = [
  'angular.module(',
  'ng-controller',
  'ng-app',
  /\$scope/,
  /\$http/,
  /\.controller\(/,
  /\.directive\(/,
  /\.service\(/,
  /\.factory\(/,
];

export const rule07AngularDetection: Rule = {
  id: RULE_ID,
  name: 'Angular Files Detected',
  description: 'Detects AngularJS code in App_Plugins that needs migration',
  category: 'frontend',
  baseHours: BASE_HOURS,
  enabled: true,
  filePatterns: ['**/App_Plugins/**/*.js'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const appPluginFiles = await findAppPluginFiles(context.projectPath);

    debug(`[${RULE_ID}] Found ${appPluginFiles.length} App_Plugins JS/TS files`);

    // Track files with Angular patterns
    const angularFiles = new Set<string>();

    for (const filePath of appPluginFiles) {
      const matches = await searchMultiplePatterns(filePath, ANGULAR_PATTERNS, false);

      if (matches.length > 0) {
        angularFiles.add(filePath);

        // Create finding for each file with Angular code
        const finding = createFinding(
          RULE_ID,
          filePath,
          matches[0].lineNumber,
          matches[0].lineContent,
          0, // Hours calculated at summary level
          'warning',
          {
            patternCount: matches.length,
          }
        );

        findings.push(finding);
      }
    }

    // Calculate total hours: 2h base + 0.5h per 10 files
    if (angularFiles.size > 0) {
      const fileCount = angularFiles.size;
      const additionalGroups = Math.floor(fileCount / 10);
      const totalHours = BASE_HOURS + additionalGroups * ADDITIONAL_HOURS_PER_10_FILES;

      debug(`[${RULE_ID}] ${fileCount} files with Angular, ${totalHours}h total`);

      // Update hours for all findings to distribute total evenly
      const hoursPerFile = totalHours / fileCount;
      findings.forEach((finding) => {
        finding.hours = hoursPerFile;
      });
    }

    debug(`[${RULE_ID}] Created ${findings.length} findings`);
    return findings;
  },
};
