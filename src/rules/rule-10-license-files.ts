import { basename } from 'node:path';
import { createFinding } from '../models/finding.js';
import { scanFiles } from '../scanners/file-scanner.js';
import { calculateHours } from '../utils/hours.js';
import { debug } from '../utils/logger.js';
import type { Finding, Rule, RuleContext } from './types.js';

/**
 * Rule 10: Umbraco Forms and Deploy License File Changes
 *
 * Detects legacy Umbraco Forms and Deploy license files that need to be
 * updated for the new licensing structure in Umbraco 17.
 *
 * Detects:
 * - umbracoDeploy.lic
 * - umbracoForms.lic
 *
 * These files are commonly found in umbraco/Licenses directory.
 *
 * Hours: 0.5h total (not per file)
 */

const RULE_ID = 'rule-10-license-files';
const BASE_HOURS = 0.5;

const LICENSE_FILES = ['umbracoDeploy.lic', 'umbracoForms.lic'];

export const rule10LicenseFiles: Rule = {
  id: RULE_ID,
  name: 'License File Structure Changes',
  description: 'Detects Umbraco Forms and Deploy license files that need updating for new licensing structure',
  category: 'configuration',
  baseHours: BASE_HOURS,
  enabled: true,
  filePatterns: ['**/*.lic'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const licenseFiles = await scanFiles(['**/*.lic'], context.projectPath);

    debug(`[${RULE_ID}] Scanning ${licenseFiles.length} .lic files`);

    // Track if we've found any license files to report only once with total hours
    const foundFiles: string[] = [];

    for (const filePath of licenseFiles) {
      const fileName = basename(filePath);

      if (LICENSE_FILES.includes(fileName)) {
        foundFiles.push(filePath);
        debug(`[${RULE_ID}] Found license file: ${fileName} at ${filePath}`);
      }
    }

    // If we found any license files, create a single finding with the total hours
    if (foundFiles.length > 0) {
      const hours = calculateHours(BASE_HOURS, 1); // Fixed 0.5h total
      const fileList = foundFiles.map((f) => basename(f)).join(', ');

      const finding = createFinding(
        RULE_ID,
        foundFiles[0], // Primary file path
        0, // No specific line number
        fileList, // Line content contains the list of files found
        hours,
        'warning',
        {
          description:
            foundFiles.length === 1
              ? `Legacy license file detected: ${basename(foundFiles[0])}. Requires update for new Umbraco 17 licensing structure.`
              : `Legacy license files detected (${foundFiles.length} files). Requires update for new Umbraco 17 licensing structure.`,
          action: 'Change licensing structure for Forms and Deploy',
          filesFound: foundFiles.length,
          fileNames: foundFiles.map((f) => basename(f)),
        },
      );

      findings.push(finding);

      debug(`[${RULE_ID}] Created finding for ${foundFiles.length} license file(s): ${fileList}`);
    }

    debug(`[${RULE_ID}] Complete. Found ${findings.length} finding(s)`);
    return findings;
  },
};
