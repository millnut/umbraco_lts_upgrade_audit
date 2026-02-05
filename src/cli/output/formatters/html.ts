import type { AuditReport } from '../../../models/report.js';

/**
 * HTML formatter
 * 
 * Generates a standalone HTML report with embedded styles.
 * Suitable for sharing with stakeholders or archiving.
 */

const UMBRACO_BLUE = '#3544B1';

export function formatHtmlOutput(report: AuditReport): string {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Umbraco Upgrade Audit Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    .header {
      background: ${UMBRACO_BLUE};
      color: white;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      text-align: center;
    }
    h1 {
      margin: 0;
      font-size: 2rem;
    }
    .subtitle {
      margin-top: 0.5rem;
      opacity: 0.9;
    }
    .summary-card {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    .stat {
      text-align: center;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: ${UMBRACO_BLUE};
    }
    .stat-label {
      margin-top: 0.5rem;
      color: #666;
      text-transform: uppercase;
      font-size: 0.875rem;
      letter-spacing: 0.05em;
    }
    table {
      width: 100%;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-collapse: collapse;
    }
    th {
      background: ${UMBRACO_BLUE};
      color: white;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 1rem;
      border-bottom: 1px solid #e5e5e5;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover {
      background: #f9f9f9;
    }
    .sub-row {
      background: #f9f9f9;
      font-size: 0.9rem;
      color: #666;
    }
    .footer {
      text-align: center;
      margin-top: 3rem;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .h5yr {
      font-size: 1.5rem;
      color: ${UMBRACO_BLUE};
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    .metadata {
      margin-top: 2rem;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Umbraco LTS Upgrade Audit</h1>
    <div class="subtitle">Upgrade Effort Estimate: Umbraco ${report.project.umbracoVersion || '13'} → 17</div>
  </div>

  <div class="summary-card">
    <h2>Summary</h2>
    <div class="summary-grid">
      <div class="stat">
        <div class="stat-value">${report.summary.totalHours.toFixed(1)}</div>
        <div class="stat-label">Total Hours</div>
      </div>
      <div class="stat">
        <div class="stat-value">${report.summary.totalDays.toFixed(1)}</div>
        <div class="stat-label">Total Days</div>
      </div>
      <div class="stat">
        <div class="stat-value">${report.summary.rulesTriggered}</div>
        <div class="stat-label">Rules Triggered</div>
      </div>
      <div class="stat">
        <div class="stat-value">${report.summary.totalFindings}</div>
        <div class="stat-label">Total Findings</div>
      </div>
    </div>
  </div>

  <h2>Findings by Rule</h2>
  <table>
    <thead>
      <tr>
        <th>Rule</th>
        <th style="text-align: center;">Matches</th>
        <th style="text-align: right;">Hours</th>
      </tr>
    </thead>
    <tbody>
      ${report.ruleResults
        .filter((r) => r.findingsCount > 0)
        .map((ruleResult) => {
          let rows = `
            <tr>
              <td><strong>${ruleResult.ruleName}</strong></td>
              <td style="text-align: center;">${ruleResult.findingsCount}</td>
              <td style="text-align: right;">${ruleResult.totalHours.toFixed(1)}</td>
            </tr>
          `;

          // Add sub-rows for Rule 1 (NuGet packages)
          if (ruleResult.ruleId === 'rule-01-nuget-packages') {
            const umbracoPackages = report.findings.filter(
              (f) => f.ruleId === 'rule-01-nuget-packages' && f.metadata?.isUmbracoPackage === true
            );
            const otherPackages = report.findings.filter(
              (f) => f.ruleId === 'rule-01-nuget-packages' && f.metadata?.isUmbracoPackage === false
            );

            if (umbracoPackages.length > 0) {
              const umbracoHours = umbracoPackages.reduce((sum, f) => sum + f.hours, 0);
              rows += `
                <tr class="sub-row">
                  <td>&nbsp;&nbsp;└─ Umbraco.* packages</td>
                  <td style="text-align: center;">${umbracoPackages.length}</td>
                  <td style="text-align: right;">${umbracoHours.toFixed(1)}</td>
                </tr>
              `;
            }

            if (otherPackages.length > 0) {
              const otherHours = otherPackages.reduce((sum, f) => sum + f.hours, 0);
              rows += `
                <tr class="sub-row">
                  <td>&nbsp;&nbsp;└─ Other packages</td>
                  <td style="text-align: center;">${otherPackages.length}</td>
                  <td style="text-align: right;">${otherHours.toFixed(1)}</td>
                </tr>
              `;
            }
          }

          return rows;
        })
        .join('')}
    </tbody>
  </table>

  <div class="footer">
    <div class="h5yr">#H5YR! 🙌</div>
    <div>Thanks for using the Umbraco Upgrade Audit Tool!</div>
    
    <div class="metadata">
      <strong>Report Generated:</strong> ${report.timestamp.toLocaleString()}<br>
      <strong>Tool Version:</strong> ${report.toolVersion}<br>
      <strong>Project Path:</strong> ${report.project.rootPath}<br>
      <strong>Scan Duration:</strong> ${(report.project.scanDurationMs / 1000).toFixed(2)}s
    </div>
  </div>
</body>
</html>`;

  return html;
}
