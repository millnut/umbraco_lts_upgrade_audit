import Table from 'cli-table3';
import type { AuditReport } from '../../models/report.js';

/**
 * Table renderer for audit results
 * 
 * Uses cli-table3 for Unicode box drawing and column alignment
 */

export function renderResultsTable(report: AuditReport): string {
  const table = new Table({
    head: ['Rule', 'Matches', 'Hours'],
    colWidths: [50, 12, 12],
    style: {
      head: ['cyan', 'bold'],
      border: ['grey'],
    },
  });

  // Add rows for each rule result
  for (const ruleResult of report.ruleResults) {
    if (ruleResult.findingsCount > 0) {
      table.push([ruleResult.ruleName, ruleResult.findingsCount.toString(), ruleResult.totalHours.toFixed(1)]);

      // Add sub-rows for Rule 1 (NuGet packages) to show Umbraco vs Other split
      if (ruleResult.ruleId === 'rule-01-nuget-packages') {
        const umbracoPackages = report.findings.filter(
          (f) => f.ruleId === 'rule-01-nuget-packages' && f.metadata?.isUmbracoPackage === true
        );
        const otherPackages = report.findings.filter(
          (f) => f.ruleId === 'rule-01-nuget-packages' && f.metadata?.isUmbracoPackage === false
        );

        if (umbracoPackages.length > 0) {
          const umbracoHours = umbracoPackages.reduce((sum, f) => sum + f.hours, 0);
          table.push(['  └─ Umbraco.* packages', umbracoPackages.length.toString(), umbracoHours.toFixed(1)]);
        }

        if (otherPackages.length > 0) {
          const otherHours = otherPackages.reduce((sum, f) => sum + f.hours, 0);
          table.push(['  └─ Other packages', otherPackages.length.toString(), otherHours.toFixed(1)]);
        }
      }
    }
  }

  // Add separator
  table.push([{ colSpan: 3, content: '' }]);

  // Add total row
  const totalText = `TOTAL ESTIMATE:  ${report.summary.totalHours.toFixed(1)} hours  (~${report.summary.totalDays.toFixed(1)} days @ 8h/day)`;
  table.push([{ colSpan: 3, content: totalText, hAlign: 'center' }]);

  // Add spacing row
  table.push([{ colSpan: 3, content: '' }]);

  return table.toString();
}
