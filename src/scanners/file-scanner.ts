import fg from 'fast-glob';
import { debug } from '../utils/logger.js';

/**
 * Recursively discover files matching patterns
 * 
 * Why: Constitution principle IV (Performance) requires efficient scanning.
 * fast-glob is optimized for large directory trees.
 */

/**
 * Scan for files matching glob patterns
 * 
 * @param patterns - Glob patterns to match
 * @param cwd - Current working directory (project root)
 * @param ignore - Patterns to ignore
 * @returns Array of absolute file paths
 */
export async function scanFiles(
  patterns: string | string[],
  cwd: string,
  ignore: string[] = ['**/node_modules/**', '**/bin/**', '**/obj/**']
): Promise<string[]> {
  debug(`Scanning files with patterns: ${JSON.stringify(patterns)}`);
  debug(`CWD: ${cwd}`);
  debug(`Ignore: ${JSON.stringify(ignore)}`);

  const files = await fg(patterns, {
    cwd,
    absolute: true,
    ignore,
    onlyFiles: true,
  });

  debug(`Found ${files.length} files`);
  return files;
}

/**
 * Find all .csproj files in a directory tree
 * 
 * @param projectPath - Root path to scan
 * @returns Array of .csproj file paths
 */
export async function findProjectFiles(projectPath: string): Promise<string[]> {
  return scanFiles('**/*.csproj', projectPath);
}

/**
 * Find all C# source files
 * 
 * @param projectPath - Root path to scan
 * @returns Array of .cs file paths
 */
export async function findCSharpFiles(projectPath: string): Promise<string[]> {
  return scanFiles('**/*.cs', projectPath);
}

/**
 * Find all JavaScript/TypeScript files in App_Plugins
 * 
 * @param projectPath - Root path to scan
 * @returns Array of .js/.ts file paths
 */
export async function findAppPluginFiles(projectPath: string): Promise<string[]> {
  return scanFiles('**/App_Plugins/**/*.{js,ts,html}', projectPath);
}

/**
 * Find all Razor view files
 * 
 * @param projectPath - Root path to scan
 * @returns Array of .cshtml file paths
 */
export async function findRazorFiles(projectPath: string): Promise<string[]> {
  return scanFiles('**/*.cshtml', projectPath);
}
