import { stat } from 'fs/promises';
import { resolve } from 'path';
import type { AuditReport, ProjectInfo, RuleResult, CategorySummary } from '../../models/report.js';
import type { RuleContext } from '../../rules/types.js';
import { registerRule, executeAllRules, getAllRules } from '../../rules/index.js';
import { findProjectFiles } from '../../scanners/file-scanner.js';
import { parseProjectFile, extractUmbracoVersion } from '../../scanners/csproj-parser.js';
import { formatConsoleOutput } from '../output/formatters/console.js';
import { formatJsonOutput } from '../output/formatters/json.js';
import { formatHtmlOutput } from '../output/formatters/html.js';
import { setDebugMode, debug, error, info, warn } from '../../utils/logger.js';
import { hoursToDays } from '../../utils/hours.js';

// Import all rules
import { rule01NuGetPackages } from '../../rules/rule-01-nuget-packages.js';
import { rule02ObsoleteControllers } from '../../rules/rule-02-obsolete-controller-classes.js';
import { rule03TiptapImport } from '../../rules/rule-03-tiptap-import.js';
import { rule04RemovedPackages } from '../../rules/rule-04-removed-packages.js';
import { rule05ProgramCs } from '../../rules/rule-05-program-cs.js';
import { rule06ViewImports } from '../../rules/rule-06-view-imports.js';
import { rule07AngularDetection } from '../../rules/rule-07-angular-detection.js';
import { rule08PublishedSnapshotInterfaces } from '../../rules/rule-08-published-snapshot-interfaces.js';

/**
 * Audit command options
 */
export interface AuditCommandOptions {
  output: 'console' | 'json' | 'html';
  verbose: boolean;
  debug: boolean;
  noColor: boolean;
}

/**
 * Execute the audit command
 * 
 * @param projectPath - Path to project directory, .sln, or .csproj
 * @param options - Command options
 */
export async function executeAuditCommand(
  projectPath: string,
  options: AuditCommandOptions
): Promise<void> {
  const startTime = Date.now();

  // Enable debug mode if requested
  if (options.debug) {
    setDebugMode(true);
    debug('Debug mode enabled');
  }

  // Resolve absolute path
  const absolutePath = resolve(projectPath);
  debug(`Resolved path: ${absolutePath}`);

  // Validate path exists
  try {
    await stat(absolutePath);
  } catch {
    error(`Path not found: ${projectPath}`);
    process.exit(1);
  }

  // Register all rules
  registerRule(rule01NuGetPackages);
  registerRule(rule02ObsoleteControllers);
  registerRule(rule03TiptapImport);
  registerRule(rule04RemovedPackages);
  registerRule(rule05ProgramCs);
  registerRule(rule06ViewImports);
  registerRule(rule07AngularDetection);
  registerRule(rule08PublishedSnapshotInterfaces);

  debug(`Registered ${getAllRules().length} rules`);

  // Find project files
  const projectFiles = await findProjectFiles(absolutePath);

  if (projectFiles.length === 0) {
    error('No .csproj files found. Are you sure this is an Umbraco project?');
    process.exit(1);
  }

  info(`Found ${projectFiles.length} project file(s)`);

  // Detect Umbraco version from first project file
  let umbracoVersion: string | null = null;
  if (projectFiles.length > 0) {
    const packages = await parseProjectFile(projectFiles[0]);
    umbracoVersion = extractUmbracoVersion(packages);
    
    if (umbracoVersion) {
      info(`Detected Umbraco version: ${umbracoVersion}`);
      
      // Check if version is 13.x but not 13.13.0
      if (umbracoVersion.startsWith('13.') && umbracoVersion !== '13.13.0') {
        warn('Before upgrading to v17, you must first upgrade to Umbraco 13.13.0 (the final LTS release of v13).');
        warn('Please upgrade to 13.13.0 first, then proceed with the v17 upgrade.');
      }
    } else {
      error('Could not detect Umbraco version. This may not be an Umbraco project.');
      process.exit(1);
    }
  }

  // Create rule execution context
  const context: RuleContext = {
    projectPath: absolutePath,
    projectFiles,
    allFiles: [], // Will be populated by individual rules
    debug: options.debug,
  };

  // Execute all rules
  info('\nRunning audit rules...\n');
  const findings = await executeAllRules(context);

  const scanDuration = Date.now() - startTime;

  // Build report
  const report: AuditReport = buildReport(
    absolutePath,
    umbracoVersion,
    projectFiles,
    findings,
    scanDuration
  );

  // Output report
  if (options.output === 'console') {
    console.log(formatConsoleOutput(report, options.verbose));
  } else if (options.output === 'json') {
    console.log(formatJsonOutput(report));
  } else if (options.output === 'html') {
    console.log(formatHtmlOutput(report));
  }

  process.exit(0);
}

/**
 * Build audit report from findings
 */
function buildReport(
  rootPath: string,
  umbracoVersion: string | null,
  projectFiles: string[],
  findings: any[],
  scanDurationMs: number
): AuditReport {
  const project: ProjectInfo = {
    rootPath,
    umbracoVersion,
    projectFiles,
    filesScanned: 0, // TODO: track actual file count
    scanDurationMs,
  };

  // Calculate summary
  const totalHours = findings.reduce((sum, f) => sum + f.hours, 0);
  const totalDays = hoursToDays(totalHours);

  // Group by rule
  const ruleResults: RuleResult[] = [];
  const allRules = getAllRules();

  for (const rule of allRules) {
    const ruleFindings = findings.filter((f) => f.ruleId === rule.id);
    const totalHours = ruleFindings.reduce((sum, f) => sum + f.hours, 0);

    ruleResults.push({
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      findingsCount: ruleFindings.length,
      totalHours,
      enabled: rule.enabled,
    });
  }

  // Group by category
  const categories = new Map<string, CategorySummary>();
  for (const finding of findings) {
    const rule = allRules.find((r) => r.id === finding.ruleId);
    if (!rule) continue;

    const category = rule.category;
    if (!categories.has(category)) {
      categories.set(category, {
        category,
        findings: 0,
        hours: 0,
      });
    }

    const cat = categories.get(category)!;
    cat.findings += 1;
    cat.hours += finding.hours;
  }

  const summary = {
    totalHours,
    totalDays,
    rulesTriggered: ruleResults.filter((r) => r.findingsCount > 0).length,
    totalFindings: findings.length,
    byCategory: Array.from(categories.values()),
  };

  return {
    project,
    timestamp: new Date(),
    toolVersion: '0.1.0',
    findings,
    summary,
    ruleResults,
    diagnostics: [],
  };
}
