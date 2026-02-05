import type { Rule, RuleContext, Finding } from './types.js';
import { findProjectFiles } from '../scanners/file-scanner.js';
import { parseProjectFile, isUmbracoPackage } from '../scanners/csproj-parser.js';
import { batchQueryPackages } from '../scanners/nuget-client.js';
import { createFinding } from '../models/finding.js';
import { calculateHours } from '../utils/hours.js';
import { debug } from '../utils/logger.js';

/**
 * Rule 1: NuGet Package Updates
 * 
 * Detects packages that need updating for Umbraco 17 / .NET 10 compatibility.
 * Queries NuGet API to determine latest versions and compatibility.
 * 
 * Hours: 1h for major version bumps, 0.5h for minor/patch updates
 */

const RULE_ID = 'rule-01-nuget-packages';
const BASE_HOURS_MINOR = 0.5;
const BASE_HOURS_MAJOR = 1.0;

/**
 * Extract major version from a version string (e.g., "13.0.0" -> 13)
 */
function getMajorVersion(version: string): number {
  const match = version.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Check if version change is a major version bump
 */
function isMajorVersionBump(currentVersion: string, latestVersion: string): boolean {
  const currentMajor = getMajorVersion(currentVersion);
  const latestMajor = getMajorVersion(latestVersion);
  return latestMajor > currentMajor;
}

export const rule01NuGetPackages: Rule = {
  id: RULE_ID,
  name: 'NuGet Package Updates',
  description:
    'Detects NuGet packages that need updating for Umbraco 17 and .NET 10 compatibility',
  category: 'package-updates',
  baseHours: BASE_HOURS_MINOR, // Default for reporting, actual hours calculated per package
  enabled: true,
  filePatterns: ['**/*.csproj'],

  async execute(context: RuleContext): Promise<Finding[]> {
    debug(`[${RULE_ID}] Starting execution`);

    const findings: Finding[] = [];
    const csprojFiles = await findProjectFiles(context.projectPath);

    debug(`[${RULE_ID}] Found ${csprojFiles.length} .csproj files`);

    // Collect all unique packages across all projects
    const allPackages = new Map<string, { version: string; files: string[] }>();

    for (const csprojPath of csprojFiles) {
      const packages = await parseProjectFile(csprojPath);

      for (const pkg of packages) {
        if (!allPackages.has(pkg.name)) {
          allPackages.set(pkg.name, {
            version: pkg.version,
            files: [csprojPath],
          });
        } else {
          allPackages.get(pkg.name)!.files.push(csprojPath);
        }
      }
    }

    debug(`[${RULE_ID}] Found ${allPackages.size} unique packages`);

    // Query NuGet for all packages
    const packageNames = Array.from(allPackages.keys());
    const nugetResults = await batchQueryPackages(packageNames);

    // Create findings for packages that need updates
    for (const [packageName, packageInfo] of allPackages) {
      const nugetData = nugetResults.get(packageName);

      if (!nugetData || !nugetData.latestVersion) {
        // Skip packages that couldn't be queried
        continue;
      }

      const currentVersion = packageInfo.version;
      const latestVersion = nugetData.latestVersion;

      // Determine if update is needed (simple version comparison)
      const needsUpdate = currentVersion !== latestVersion;

      if (needsUpdate) {
        // Create one finding per package (not per file)
        const isMajorBump = isMajorVersionBump(currentVersion, latestVersion);
        const baseHours = isMajorBump ? BASE_HOURS_MAJOR : BASE_HOURS_MINOR;
        const hours = calculateHours(baseHours, 1);

        const metadata = {
          packageName,
          currentVersion,
          latestVersion,
          isUmbracoPackage: isUmbracoPackage(packageName),
          isCompatible: nugetData.isCompatible,
          filesAffected: packageInfo.files,
        };

        // Use the first file where the package appears
        const finding = createFinding(
          RULE_ID,
          packageInfo.files[0],
          0, // Line number not applicable for package-level finding
          `${packageName}: ${currentVersion} → ${latestVersion}`,
          hours,
          'warning',
          metadata
        );

        findings.push(finding);
      }
    }

    debug(`[${RULE_ID}] Created ${findings.length} findings`);
    return findings;
  },
};
