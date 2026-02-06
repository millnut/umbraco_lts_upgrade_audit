import type { AuditReport } from '../../../models/report.js';
import { getH5YRFooter, getUmbracoLogo } from '../ascii-logo.js';
import { renderResultsTable } from '../table-renderer.js';

/**
 * Console formatter with logo, table, and totals
 *
 * Output format:
 * 1. Umbraco ASCII logo in brand blue
 * 2. Results table
 * 3. H5YR footer message
 */

export function formatConsoleOutput(report: AuditReport, verbose: boolean): string {
  const output: string[] = [];

  // 1. Logo
  output.push(getUmbracoLogo(report.toolVersion));
  output.push('\n');

  // 2. Table
  output.push(renderResultsTable(report));
  output.push('\n');

  // 3. Verbose findings (if enabled)
  if (verbose && report.findings.length > 0) {
    output.push('Detailed Findings:\n');
    output.push('─'.repeat(80));
    output.push('\n\n');

    for (const finding of report.findings) {
      output.push(`[${finding.ruleId}] ${finding.filePath}:${finding.lineNumber}\n`);
      output.push(`  ${finding.lineContent}\n`);

      if (finding.codeSnippet) {
        output.push('\n  Code context:\n');
        finding.codeSnippet.before.forEach((line, idx) => {
          output.push(`    ${finding.codeSnippet!.startLine + idx} | ${line}\n`);
        });
        output.push(`  → ${finding.lineNumber} | ${finding.codeSnippet.line}\n`);
        finding.codeSnippet.after.forEach((line, idx) => {
          output.push(`    ${finding.lineNumber + idx + 1} | ${line}\n`);
        });
      }

      output.push('\n');
    }

    output.push('─'.repeat(80));
    output.push('\n\n');
  }

  // 4. Footer
  output.push(getH5YRFooter());

  return output.join('');
}
