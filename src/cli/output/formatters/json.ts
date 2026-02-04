import type { AuditReport } from '../../../models/report.js';

/**
 * JSON formatter
 * 
 * Produces structured JSON suitable for programmatic consumption
 * and integration with other tools.
 */

export function formatJsonOutput(report: AuditReport): string {
  // Transform report to match contract schema
  const output = {
    meta: {
      tool: 'umbraco-audit',
      version: report.toolVersion,
      timestamp: report.timestamp.toISOString(),
    },
    project: {
      path: report.project.rootPath,
      umbracoVersion: report.project.umbracoVersion,
      projectFiles: report.project.projectFiles,
      filesScanned: report.project.filesScanned,
      scanDurationMs: report.project.scanDurationMs,
    },
    summary: {
      totalHours: report.summary.totalHours,
      totalDays: report.summary.totalDays,
      rulesTriggered: report.summary.rulesTriggered,
      totalFindings: report.summary.totalFindings,
    },
    rules: report.ruleResults.map((ruleResult) => ({
      id: ruleResult.ruleId,
      name: ruleResult.ruleName,
      category: ruleResult.category,
      matches: ruleResult.findingsCount,
      hours: ruleResult.totalHours,
      findings: report.findings
        .filter((f) => f.ruleId === ruleResult.ruleId)
        .map((f) => ({
          file: f.filePath,
          line: f.lineNumber,
          content: f.lineContent,
          metadata: f.metadata,
        })),
    })),
    diagnostics: report.diagnostics.map((d) => ({
      level: d.level,
      message: d.message,
      file: d.file,
    })),
  };

  return JSON.stringify(output, null, 2);
}
