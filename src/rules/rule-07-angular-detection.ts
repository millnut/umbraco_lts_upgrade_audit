import type { Rule, RuleContext, Finding } from './types.js';
import { findAppPluginFiles } from '../scanners/file-scanner.js';
import { searchMultiplePatterns } from '../scanners/code-searcher.js';
import { createFinding } from '../models/finding.js';
import { debug } from '../utils/logger.js';
import { readFileSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import ignore from 'ignore';

/**
 * Rule 7: Angular Detection
 * 
 * Detects AngularJS patterns in App_Plugins that need migration to Umbraco 17's
 * new backoffice architecture (Lit/Web Components).
 * 
 * Hours: 2h base + 0.5h per 10 files
 */

const RULE_ID = 'rule-07-angular-detection';
const BASE_HOURS = 5 * 8; // 5 days * 8 hours/day = 40 hours
const ADDITIONAL_HOURS_PER_10_FILES = 4;

/**
 * AngularJS patterns from research.md
 */
const ANGULAR_PATTERNS = [
  /angular\.module\(/,
  /ng-controller/,
  /ng-app/,
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
  filePatterns: ['**/App_Plugins/**/*.js', '**/App_Plugins/**/*.html'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const appPluginFiles = await findAppPluginFiles(context.projectPath);

    // Load .gitignore rules - try parent directory first, then current
    const parentPath = dirname(context.projectPath);
    let gitignorePath = join(parentPath, '.gitignore');
    let gitignoreRoot = parentPath;
    const ig = ignore();
    
    if (existsSync(gitignorePath)) {
      try {
        const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
        ig.add(gitignoreContent);
        debug(`[${RULE_ID}] Loaded .gitignore from parent directory: ${gitignorePath}`);
      } catch (err) {
        debug(`[${RULE_ID}] Failed to read parent .gitignore: ${err}`);
      }
    } else {
      // Try current project directory
      gitignorePath = join(context.projectPath, '.gitignore');
      gitignoreRoot = context.projectPath;
      
      if (existsSync(gitignorePath)) {
        try {
          const gitignoreContent = readFileSync(gitignorePath, 'utf-8');
          ig.add(gitignoreContent);
          debug(`[${RULE_ID}] Loaded .gitignore from project directory: ${gitignorePath}`);
        } catch (err) {
          debug(`[${RULE_ID}] Failed to read project .gitignore: ${err}`);
        }
      } else {
        debug(`[${RULE_ID}] No .gitignore file found in parent or project directory`);
      }
    }

    // Filter files based on .gitignore (convert to relative paths for ignore package)
    const filteredFiles = appPluginFiles.filter((filePath) => {
      const relativePath = relative(gitignoreRoot, filePath);
      return !ig.ignores(relativePath);
    });

    debug(`[${RULE_ID}] Found ${filteredFiles.length} App_Plugins JS/TS/HTML files`);

    // Track files with Angular patterns
    const angularFiles = new Set<string>();

    for (const filePath of filteredFiles) {
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

    debug(`[${RULE_ID}] Found ${angularFiles.size} unique files with Angular patterns`);
    return findings;
  },
};
