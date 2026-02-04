import { debug } from '../utils/logger.js';

/**
 * NuGet API client for package version lookup
 * 
 * Why: Rule 1 needs to check package versions against NuGet.
 * Implements caching to minimize API calls per constitution performance principle.
 */

/**
 * Package metadata from NuGet API
 */
export interface NuGetPackageMetadata {
  packageName: string;
  latestVersion: string | null;
  isCompatible: boolean | null;
  error?: string;
}

/**
 * Cache for NuGet API responses during a single audit run
 */
const packageCache = new Map<string, NuGetPackageMetadata>();

/**
 * Clear the package cache (useful for testing)
 */
export function clearPackageCache(): void {
  packageCache.clear();
}

/**
 * Query NuGet API for package metadata
 * 
 * @param packageName - Package name to lookup
 * @returns Package metadata or null if not found
 */
export async function queryNuGetPackage(
  packageName: string
): Promise<NuGetPackageMetadata | null> {
  // Check cache first
  if (packageCache.has(packageName)) {
    debug(`Cache hit for package: ${packageName}`);
    return packageCache.get(packageName)!;
  }

  debug(`Querying NuGet API for package: ${packageName}`);

  try {
    // Use NuGet V3 API registration endpoint
    const url = `https://api.nuget.org/v3/registration5-semver1/${packageName.toLowerCase()}/index.json`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        debug(`Package not found on NuGet: ${packageName}`);
        const metadata: NuGetPackageMetadata = {
          packageName,
          latestVersion: null,
          isCompatible: null,
          error: 'Package not found',
        };
        packageCache.set(packageName, metadata);
        return metadata;
      }
      throw new Error(`NuGet API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as {
      items?: Array<{
        items?: Array<{
          catalogEntry?: {
            version?: string;
            dependencyGroups?: Array<{ targetFramework?: string }>;
          };
        }>;
      }>;
    };

    // Extract latest version from the catalog
    const items = data.items || [];
    if (items.length === 0) {
      debug(`No versions found for package: ${packageName}`);
      const metadata: NuGetPackageMetadata = {
        packageName,
        latestVersion: null,
        isCompatible: null,
        error: 'No versions found',
      };
      packageCache.set(packageName, metadata);
      return metadata;
    }

    // Get the last item which contains the latest versions
    const lastItem = items[items.length - 1];
    const catalogEntries = lastItem.items || [];

    if (catalogEntries.length === 0) {
      debug(`No catalog entries for package: ${packageName}`);
      const metadata: NuGetPackageMetadata = {
        packageName,
        latestVersion: null,
        isCompatible: null,
      };
      packageCache.set(packageName, metadata);
      return metadata;
    }

    // Get the latest version (last entry)
    const latestEntry = catalogEntries[catalogEntries.length - 1];
    const latestVersion = latestEntry.catalogEntry?.version || null;

    // Check for .NET 10 compatibility in dependency groups
    const dependencyGroups = latestEntry.catalogEntry?.dependencyGroups || [];
    const isCompatible = dependencyGroups.some(
      (group: { targetFramework?: string }) =>
        group.targetFramework?.includes('net10.0') ||
        group.targetFramework?.includes('net9.0') ||
        group.targetFramework?.includes('netstandard2.0')
    );

    const metadata: NuGetPackageMetadata = {
      packageName,
      latestVersion,
      isCompatible: dependencyGroups.length > 0 ? isCompatible : null,
    };

    packageCache.set(packageName, metadata);
    debug(`Retrieved package metadata: ${JSON.stringify(metadata)}`);

    return metadata;
  } catch (error) {
    debug(`Failed to query NuGet API for ${packageName}: ${error}`);
    const metadata: NuGetPackageMetadata = {
      packageName,
      latestVersion: null,
      isCompatible: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    packageCache.set(packageName, metadata);
    return metadata;
  }
}

/**
 * Batch query multiple packages
 * 
 * @param packageNames - Array of package names
 * @returns Map of package name to metadata
 */
export async function batchQueryPackages(
  packageNames: string[]
): Promise<Map<string, NuGetPackageMetadata | null>> {
  debug(`Batch querying ${packageNames.length} packages`);

  const results = new Map<string, NuGetPackageMetadata | null>();

  // Query packages in parallel
  const promises = packageNames.map(async (name) => {
    const metadata = await queryNuGetPackage(name);
    results.set(name, metadata);
  });

  await Promise.all(promises);

  return results;
}
