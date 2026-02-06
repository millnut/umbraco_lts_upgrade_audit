import { createFinding } from '../models/finding.js';
import { parseProjectFile } from '../scanners/csproj-parser.js';
import { findProjectFiles } from '../scanners/file-scanner.js';
import { calculateHours } from '../utils/hours.js';
import { debug } from '../utils/logger.js';
import type { Finding, Rule, RuleContext } from './types.js';

/**
 * Rule 4: Removed Packages
 *
 * Detects 3 packages that have been removed in Umbraco 17 and must be uninstalled.
 *
 * Hours: 0.5h per package found
 */

const RULE_ID = 'rule-04-removed-packages';
const BASE_HOURS = 0.5;

/**
 * List of removed packages from research.md
 */
const REMOVED_PACKAGES = ['Umbraco.Cloud.Cms.PublicAccess', 'Umbraco.Cloud.Identity.Cms', 'Umbraco.Cms.Web.BackOffice'];

export const rule04RemovedPackages: Rule = {
  id: RULE_ID,
  name: 'Removed Packages',
  description: 'Detects packages that have been removed in Umbraco 17',
  category: 'package-updates',
  baseHours: BASE_HOURS,
  enabled: true,
  filePatterns: ['**/*.csproj'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const csprojFiles = await findProjectFiles(context.projectPath);

    debug(`[${RULE_ID}] Found ${csprojFiles.length} .csproj files`);

    for (const csprojPath of csprojFiles) {
      const packages = await parseProjectFile(csprojPath);

      for (const pkg of packages) {
        if (REMOVED_PACKAGES.includes(pkg.name)) {
          const hours = calculateHours(BASE_HOURS, 1);

          const finding = createFinding(
            RULE_ID,
            csprojPath,
            0, // Line number not applicable for package reference
            `${pkg.name} (${pkg.version}) - Package removed in Umbraco 17`,
            hours,
            'error',
            {
              packageName: pkg.name,
              version: pkg.version,
              reason: 'Package removed or functionality merged into core',
            },
          );

          findings.push(finding);
        }
      }
    }

    debug(`[${RULE_ID}] Created ${findings.length} findings`);
    return findings;
  },
};
