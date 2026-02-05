# CLI Interface Contract: Umbraco LTS Upgrade Audit

**Date**: 2026-02-04  
**Phase**: 1 - Design  
**Status**: Complete

## Command Signature

```
umbraco-audit <path> [options]
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `path` | Yes | Path to Umbraco project directory, .sln file, or .csproj file |

### Options

| Option | Short | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--output` | `-o` | string | `console` | Output format: `console`, `json`, `html` |
| `--config` | `-c` | string | — | Path to custom configuration file (YAML) |
| `--verbose` | `-v` | boolean | `false` | Show detailed findings with code snippets |
| `--debug` | — | boolean | `false` | Enable debug logging for troubleshooting |
| `--no-color` | — | boolean | `false` | Disable colored terminal output |
| `--version` | `-V` | boolean | — | Show tool version and exit |
| `--help` | `-h` | boolean | — | Show help message and exit |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Audit completed successfully (findings may exist) |
| `1` | Invalid arguments or configuration |
| `2` | Runtime error (file access, network, etc.) |

## Console Output Format

### Header (Umbraco ASCII Logo)

```
    ██╗   ██╗███╗   ███╗██████╗ ██████╗  █████╗  ██████╗ ██████╗ 
    ██║   ██║████╗ ████║██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔═══██╗
    ██║   ██║██╔████╔██║██████╔╝██████╔╝███████║██║     ██║   ██║
    ██║   ██║██║╚██╔╝██║██╔══██╗██╔══██╗██╔══██║██║     ██║   ██║
    ╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║██║  ██║╚██████╗╚██████╔╝
     ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
                    LTS Upgrade Audit Tool v1.0.0
```

*Color: Umbraco Blue `#3544B1`*

### Results Table

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Upgrade Effort Estimate                        │
├──────────────────────────────────┬────────────┬────────────────────┤
│ Rule                             │   Matches  │     Hours          │
├──────────────────────────────────┼────────────┼────────────────────┤
│ NuGet Package Updates            │         12 │              6.0   │
│   └─ Umbraco.* packages          │          5 │              2.5   │
│   └─ Other packages              │          7 │              3.5   │
├──────────────────────────────────┼────────────┼────────────────────┤
│ Removed Extension Methods        │          3 │              3.0   │
├──────────────────────────────────┼────────────┼────────────────────┤
│ Tiptap Import Changes            │          2 │              1.0   │
├──────────────────────────────────┼────────────┼────────────────────┤
│ Removed Packages                 │          1 │              0.5   │
├──────────────────────────────────┼────────────┼────────────────────┤
│ Program.cs Changes               │          1 │              0.5   │
├──────────────────────────────────┼────────────┼────────────────────┤
│ ViewImports Smidge Removal       │          1 │              0.5   │
├──────────────────────────────────┼────────────┼────────────────────┤
│ Angular Files Detected           │         24 │              3.2   │
├──────────────────────────────────┴────────────┴────────────────────┤
│                                                                     │
│  TOTAL ESTIMATE:  14.7 hours  (~1.8 days @ 8h/day)                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Footer

```
H5YR! 🙌 Thanks for using the Umbraco Upgrade Audit Tool!
```

## JSON Output Schema

```typescript
interface JsonOutput {
  /** Tool metadata */
  meta: {
    tool: 'umbraco-audit';
    version: string;
    timestamp: string; // ISO 8601
  };
  
  /** Project information */
  project: {
    path: string;
    umbracoVersion: string | null;
    projectFiles: string[];
    filesScanned: number;
    scanDurationMs: number;
  };
  
  /** Summary totals */
  summary: {
    totalHours: number;
    totalDays: number;
    rulesTriggered: number;
    totalFindings: number;
  };
  
  /** Per-rule results */
  rules: Array<{
    id: string;
    name: string;
    category: string;
    matches: number;
    hours: number;
    findings: Array<{
      file: string;
      line: number;
      content: string;
      metadata?: Record<string, unknown>;
    }>;
  }>;
  
  /** Errors/warnings during scan */
  diagnostics: Array<{
    level: 'error' | 'warning' | 'info';
    message: string;
    file?: string;
  }>;
}
```

### Example JSON Output

```json
{
  "meta": {
    "tool": "umbraco-audit",
    "version": "1.0.0",
    "timestamp": "2026-02-04T15:30:00Z"
  },
  "project": {
    "path": "/path/to/umbraco-project",
    "umbracoVersion": "13.4.1",
    "projectFiles": ["MyProject.Web.csproj", "MyProject.Core.csproj"],
    "filesScanned": 234,
    "scanDurationMs": 1523
  },
  "summary": {
    "totalHours": 14.7,
    "totalDays": 1.84,
    "rulesTriggered": 7,
    "totalFindings": 44
  },
  "rules": [
    {
      "id": "rule-01-nuget-packages",
      "name": "NuGet Package Updates",
      "category": "package-updates",
      "matches": 12,
      "hours": 6.0,
      "findings": [
        {
          "file": "MyProject.Web.csproj",
          "line": 15,
          "content": "<PackageReference Include=\"Umbraco.Cms\" Version=\"13.4.1\" />",
          "metadata": {
            "packageName": "Umbraco.Cms",
            "currentVersion": "13.4.1",
            "latestVersion": "17.0.0",
            "isUmbracoPackage": true,
            "isCompatible": true
          }
        }
      ]
    }
  ],
  "diagnostics": []
}
```

## HTML Output Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Umbraco Upgrade Audit Report</title>
  <style>
    :root {
      --umbraco-blue: #3544B1;
      --umbraco-dark: #1B264F;
    }
    /* Embedded styles for standalone report */
  </style>
</head>
<body>
  <header>
    <img src="data:image/svg+xml;base64,..." alt="Umbraco Logo">
    <h1>LTS Upgrade Audit Report</h1>
    <p class="meta">Generated: {timestamp} | Tool v{version}</p>
  </header>
  
  <section class="summary">
    <h2>Summary</h2>
    <div class="stat-grid">
      <div class="stat">
        <span class="value">{totalHours}</span>
        <span class="label">Total Hours</span>
      </div>
      <div class="stat">
        <span class="value">{totalDays}</span>
        <span class="label">Total Days</span>
      </div>
      <!-- ... -->
    </div>
  </section>
  
  <section class="rules">
    <h2>Findings by Rule</h2>
    <table>
      <thead>
        <tr>
          <th>Rule</th>
          <th>Matches</th>
          <th>Hours</th>
        </tr>
      </thead>
      <tbody>
        <!-- Rule rows -->
      </tbody>
    </table>
  </section>
  
  <section class="details" id="findings">
    <h2>Detailed Findings</h2>
    <!-- Collapsible sections per rule -->
  </section>
  
  <footer>
    <p>H5YR! 🙌 Thanks for using the Umbraco Upgrade Audit Tool!</p>
  </footer>
</body>
</html>
```

## Error Messages

### User-Facing Errors

| Code | Message Template |
|------|------------------|
| `E001` | `Path not found: {path}` |
| `E002` | `Not an Umbraco project: No Umbraco package references found in {path}` |
| `E003` | `Configuration file not found: {path}` |
| `E004` | `Invalid configuration: {details}` |
| `E005` | `Unable to read file: {path} - {reason}` |
| `E006` | `NuGet API unavailable: Package version checks skipped` |

### Debug Log Format

```
[DEBUG] {timestamp} [{component}] {message}
[DEBUG] 2026-02-04T15:30:01.234Z [Scanner] Found 45 .cs files
[DEBUG] 2026-02-04T15:30:01.456Z [Rule:rule-02] Checking ToSingleItemCollection pattern
[DEBUG] 2026-02-04T15:30:01.457Z [Rule:rule-02] Match found at Services/Helper.cs:42
```
