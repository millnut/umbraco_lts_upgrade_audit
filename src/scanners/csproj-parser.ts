import { readFile } from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';
import { debug } from '../utils/logger.js';

/**
 * .csproj XML parsing utilities
 *
 * Why: NuGet package references are in XML format.
 * fast-xml-parser handles .NET XML quirks reliably.
 */

/**
 * Package reference from .csproj
 */
export interface PackageReference {
  name: string;
  version: string;
}

/**
 * Parse .csproj file and extract package references
 *
 * @param csprojPath - Absolute path to .csproj file
 * @returns Array of package references
 */
export async function parseProjectFile(csprojPath: string): Promise<PackageReference[]> {
  debug(`Parsing .csproj file: ${csprojPath}`);

  const content = await readFile(csprojPath, 'utf-8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const parsed = parser.parse(content);
  const packages: PackageReference[] = [];

  // Navigate the XML structure to find PackageReference elements
  const project = parsed.Project;
  if (!project) {
    debug('No Project element found in .csproj');
    return packages;
  }

  // ItemGroup can be a single object or an array
  const itemGroups = Array.isArray(project.ItemGroup) ? project.ItemGroup : [project.ItemGroup];

  for (const itemGroup of itemGroups) {
    if (!itemGroup) continue;

    // PackageReference can be a single object or an array
    const packageRefs = itemGroup.PackageReference;
    if (!packageRefs) continue;

    const refs = Array.isArray(packageRefs) ? packageRefs : [packageRefs];

    for (const ref of refs) {
      const name = ref['@_Include'];
      const version = ref['@_Version'];

      if (name && version) {
        packages.push({ name, version });
      }
    }
  }

  debug(`Found ${packages.length} package references`);
  return packages;
}

/**
 * Check if a package name matches Umbraco packages
 *
 * @param packageName - Package name to check
 * @returns True if it's an Umbraco package
 */
export function isUmbracoPackage(packageName: string): boolean {
  return packageName.startsWith('Umbraco.');
}

/**
 * Extract Umbraco version from package references
 *
 * @param packages - List of package references
 * @returns Umbraco version string or null
 */
export function extractUmbracoVersion(packages: PackageReference[]): string | null {
  // Look for Umbraco.Cms package
  const umbracoCms = packages.find((p) => p.name === 'Umbraco.Cms');
  if (umbracoCms) {
    return umbracoCms.version;
  }

  // Fallback to any Umbraco.* package
  const umbracoPackage = packages.find((p) => isUmbracoPackage(p.name));
  return umbracoPackage?.version || null;
}
