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

/**
 * Cache for NuGet API responses during a single audit run
 */
const packageCache = new Map<string, NuGetPackageMetadata>();

export function clearPackageCache(): void {
  packageCache.clear();
}

/**
 * Public API
 */
export async function queryNuGetPackage(
  packageName: string
): Promise<NuGetPackageMetadata | null> {
  if (packageCache.has(packageName)) {
    debug(`Cache hit for package: ${packageName}`);
    return packageCache.get(packageName)!;
  }

  debug(`Querying NuGet API for package: ${packageName}`);

  try {
    const latestVersion = await fetchLatestVersion(packageName);

    if (!latestVersion) {
      const metadata: NuGetPackageMetadata = {
        packageName,
        latestVersion: null,
        isCompatible: null,
        error: 'No versions found',
      };
      packageCache.set(packageName, metadata);
      warn(`No package metadata found for: ${packageName}`);
      return metadata;
    }

    const targetFrameworks = await resolveTargetFrameworks(
      packageName,
      latestVersion
    );

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
/*                               Helper logic                                 */
/* -------------------------------------------------------------------------- */

/**
 * Resolve the latest package version via the registration API
 */
async function fetchLatestVersion(packageName: string): Promise<string | null> {
  const indexUrl = `https://api.nuget.org/v3/registration5-semver1/${packageName.toLowerCase()}/index.json`;
  const indexResponse = await fetch(indexUrl);

  if (indexResponse.status === 404) return null;
  if (!indexResponse.ok) {
    throw new Error(`NuGet API error: ${indexResponse.status}`);
  }

  const index = (await indexResponse.json()) as {
    items?: Array<{ '@id': string }>;
  };

  const pages = index.items ?? [];
  if (pages.length === 0) return null;

  // Walk pages from newest → oldest
  for (let p = pages.length - 1; p >= 0; p--) {
    const pageUrl = pages[p]['@id'];
    const pageResponse = await fetch(pageUrl);
    if (!pageResponse.ok) continue;

    const page = (await pageResponse.json()) as {
      items?: Array<{
        catalogEntry?: {
          version?: string;
        };
      }>;
    };

    const entries = page.items ?? [];

    // Walk versions from newest → oldest
    for (let i = entries.length - 1; i >= 0; i--) {
      const version = entries[i].catalogEntry?.version;
      if (version && isStableVersion(version)) {
        return version;
      }
    }
  }

  return null;
}

/**
 * Resolve target frameworks:
 * 1. catalogEntry (fast path)
 * 2. nuspec (authoritative fallback)
 */
async function resolveTargetFrameworks(
  packageName: string,
  version: string
): Promise<string[]> {
  const frameworksFromCatalog = await fetchFrameworksFromCatalog(
    packageName,
    version
  );

  if (frameworksFromCatalog.length > 0) {
    return frameworksFromCatalog;
  }

  debug(`Falling back to nuspec for ${packageName}@${version}`);
  return fetchFrameworksFromNuspec(packageName, version);
}

/**
 * Extract frameworks from registration catalogEntry
 */
async function fetchFrameworksFromCatalog(
  packageName: string,
  version: string
): Promise<string[]> {
  const url = `https://api.nuget.org/v3/registration5-semver1/${packageName.toLowerCase()}/index.json`;
  const response = await fetch(url);

  if (!response.ok) return [];

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

  for (const page of data.items ?? []) {
    for (const entry of page.items ?? []) {
      if (entry.catalogEntry?.version === version) {
        return (
          entry.catalogEntry.dependencyGroups
            ?.map(g => g.targetFramework)
            .filter((f): f is string => !!f) ?? []
        );
      }
    }
  }

  return [];
}

/**
 * Extract frameworks from .nuspec (source of truth)
 */
async function fetchFrameworksFromNuspec(
  packageName: string,
  version: string
): Promise<string[]> {
  const id = packageName.toLowerCase();
  const url = `https://api.nuget.org/v3-flatcontainer/${id}/${version}/${id}.nuspec`;
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

/* -------------------------------------------------------------------------- */
/*                               Batch helper                                 */
/* -------------------------------------------------------------------------- */

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

function isStableVersion(version: string): boolean {
  // Any '-' means prerelease in SemVer
  return !version.includes('-');
}