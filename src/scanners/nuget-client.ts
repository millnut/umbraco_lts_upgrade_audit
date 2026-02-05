import { debug, warn } from '../utils/logger.js';

/**
 * NuGet API client for package version lookup
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

const packageCache = new Map<string, NuGetPackageMetadata>();

export function clearPackageCache(): void {
  packageCache.clear();
}

export async function queryNuGetPackage(
  packageName: string
): Promise<NuGetPackageMetadata | null> {
  if (packageCache.has(packageName)) {
    debug(`Cache hit for package: ${packageName}`);
    return packageCache.get(packageName)!;
  }

  debug(`Querying NuGet API for package: ${packageName}`);

  try {
    const latestEntry = await fetchLatestStableEntry(packageName);

    if (!latestEntry) {
      const metadata: NuGetPackageMetadata = {
        packageName,
        latestVersion: null,
        isCompatible: null,
        error: 'No stable versions found',
      };
      packageCache.set(packageName, metadata);
      warn(`No stable package metadata found for: ${packageName}`);
      return metadata;
    }

    const { version: latestVersion, dependencyGroups } = latestEntry;

    let targetFrameworks =
      dependencyGroups
        ?.map(g => g.targetFramework)
        .filter((f): f is string => !!f) ?? [];

    if (targetFrameworks.length === 0) {
      debug(`Falling back to nuspec for ${packageName}@${latestVersion}`);
      targetFrameworks = await fetchFrameworksFromNuspec(
        packageName,
        latestVersion
      );
    }

    const isCompatible =
      targetFrameworks.length === 0
        ? null
        : isSupportedFramework(targetFrameworks);

    const metadata: NuGetPackageMetadata = {
      packageName,
      latestVersion,
      isCompatible,
    };

    packageCache.set(packageName, metadata);
    debug(`Retrieved package metadata: ${JSON.stringify(metadata)}`);
    return metadata;
  } catch (error) {
    debug(`Failed to query NuGet API for ${packageName}: ${error}`);
    warn(`Failed to retrieve package metadata for: ${packageName}`);
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

/* -------------------------------------------------------------------------- */
/*                                Core logic                                  */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the latest stable catalog entry (SemVer2, prerelease excluded).
 * This supports both:
 *  • index with inline items
 *  • index pointing to page URLs
 */
async function fetchLatestStableEntry(
  packageName: string
): Promise<{
  version: string;
  dependencyGroups?: Array<{ targetFramework?: string }>;
} | null> {
  const indexUrl =
    `https://api.nuget.org/v3/registration5-gz-semver2/${packageName.toLowerCase()}/index.json`;

  const indexResponse = await fetch(indexUrl);
  if (indexResponse.status === 404) return null;
  if (!indexResponse.ok) {
    throw new Error(`NuGet API error: ${indexResponse.status}`);
  }

  const index = await indexResponse.json() as any;

  // Try to extract entries from inline items first
  if (Array.isArray(index.items) && index.items.length > 0) {
    const inlineEntries = extractEntriesFromInlineItems(index.items);
    const stableInline = findLatestStable(inlineEntries);
    if (stableInline) return stableInline;
  }

  // Fallback: fetch pages from @id (for non-inline formats)
  const pages = Array.isArray(index.items) ? index.items : [];
  for (let p = pages.length - 1; p >= 0; p--) {
    const pageUrl = pages[p]['@id'];
    if (!pageUrl) continue;
    
    const pageResponse = await fetch(pageUrl);
    if (!pageResponse.ok) continue;

    const page = await pageResponse.json() as any;
    if (Array.isArray(page.items)) {
      const entries = extractEntriesFromInlineItems(page.items);
      const stable = findLatestStable(entries);
      if (stable) return stable;
    }
  }

  return null;
}

/**
 * Helper to flatten "items" blocks (index or page) into {version, dependencyGroups}
 * Handles both inline format (Serilog) and page format (Umbraco.Cloud.Cms.PublicAccess)
 */
function extractEntriesFromInlineItems(items: any[]): Array<{
  version: string;
  dependencyGroups?: Array<{ targetFramework?: string }>;
}> {
  const result: any[] = [];

  for (const item of items) {
    // Check if this item has nested items array (inline format like Serilog)
    if (Array.isArray(item.items)) {
      for (const subItem of item.items) {
        const catalogEntry = subItem.catalogEntry;
        if (catalogEntry && typeof catalogEntry.version === 'string') {
          result.push({
            version: catalogEntry.version,
            dependencyGroups: catalogEntry.dependencyGroups,
          });
        }
      }
    }
    // Also check if the item itself has catalogEntry (some formats)
    else if (item.catalogEntry && typeof item.catalogEntry.version === 'string') {
      result.push({
        version: item.catalogEntry.version,
        dependencyGroups: item.catalogEntry.dependencyGroups,
      });
    }
  }

  return result;
}

/**
 * Pick highest stable (semver) from a flat array
 */
function findLatestStable(
  entries: Array<{
    version: string;
    dependencyGroups?: Array<{ targetFramework?: string }>;
  }>
) {
  // reverse sort by semver (simple lexicographical works for NuGet numbering)
  const sorted = entries
    .filter(e => isStableVersion(e.version))
    .sort((a, b) => (a.version > b.version ? -1 : 1));

  return sorted.length > 0 ? sorted[0] : null;
}

/**
 * Extract frameworks from .nuspec (source of truth fallback)
 */
async function fetchFrameworksFromNuspec(
  packageName: string,
  version: string
): Promise<string[]> {
  const id = packageName.toLowerCase();
  const url =
    `https://api.nuget.org/v3-flatcontainer/${id}/${version}/${id}.nuspec`;

  const response = await fetch(url);
  if (!response.ok) return [];

  const xml = await response.text();

  return Array.from(
    xml.matchAll(/<group\s+targetFramework="([^"]+)"/gi)
  ).map(match => match[1]);
}

/**
 * Compatibility rule
 */
function isSupportedFramework(targetFrameworks: string[]): boolean {
  return targetFrameworks.some(tf =>
    tf.includes('net10.0') ||
    tf.includes('net9.0') ||
    tf.includes('net8.0') ||
    tf.includes('netstandard2.0')
  );
}

/**
 * Stable SemVer check
 */
function isStableVersion(version: string): boolean {
  // Any '-' means prerelease in SemVer
  return !version.includes('-');
}

/**
 * Batch helper
 */
export async function batchQueryPackages(
  packageNames: string[]
): Promise<Map<string, NuGetPackageMetadata | null>> {
  debug(`Batch querying ${packageNames.length} packages`);
  const results = new Map<string, NuGetPackageMetadata | null>();
  await Promise.all(
    packageNames.map(async name => {
      const metadata = await queryNuGetPackage(name);
      results.set(name, metadata);
    })
  );
  return results;
}
