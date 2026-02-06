# Quickstart: Umbraco LTS Upgrade Audit CLI

Get up and running with the Umbraco upgrade audit tool in minutes.

## Prerequisites

- **Node.js 22 LTS** or later ([download](https://nodejs.org/))
- An **Umbraco 13** project to scan

## Installation

### Option 1: Global Install (Recommended)

```bash
npm install -g umbraco-audit
```

### Option 2: Run via npx (No Install)

```bash
npx umbraco-audit /path/to/project
```

### Option 3: Local Development

```bash
git clone https://github.com/your-org/umbraco-audit.git
cd umbraco-audit
npm install
npm run build
npm link  # Makes 'umbraco-audit' available globally
```

## Basic Usage

### Scan a Project Directory

```bash
umbraco-audit /path/to/umbraco-project
```

### Scan a Solution File

```bash
umbraco-audit /path/to/MySolution.sln
```

### Scan a Specific Project

```bash
umbraco-audit /path/to/MyProject.csproj
```

## Output Formats

### Console (Default)

Human-readable table with Umbraco branding:

```bash
umbraco-audit /path/to/project
```

### JSON

Machine-readable output for CI/CD integration:

```bash
umbraco-audit /path/to/project --output json > report.json
```

### HTML

Shareable report for stakeholders:

```bash
umbraco-audit /path/to/project --output html > report.html
```

## Common Options

```bash
# Show detailed findings with file locations
umbraco-audit /path/to/project --verbose

# Use a custom configuration file
umbraco-audit /path/to/project --config ./audit-config.yaml

# Enable debug logging for troubleshooting
umbraco-audit /path/to/project --debug

# Disable colored output (useful for CI logs)
umbraco-audit /path/to/project --no-color
```

## Configuration File

Create an `audit-config.yaml` to customize behavior:

```yaml
# Override hour estimates
rules:
  rule-01-nuget-packages:
    baseHours: 1.0  # Increase from default 0.5
  rule-07-angular-detection:
    enabled: false  # Skip Angular detection

# Output preferences
output:
  showCodeSnippets: true
  colorEnabled: true

# Exclude paths from scanning
excludePaths:
  - "**/node_modules/**"
  - "**/bin/**"
  - "**/obj/**"
```

## Example Output

```
    ██╗   ██╗███╗   ███╗██████╗ ██████╗  █████╗  ██████╗ ██████╗ 
    ██║   ██║████╗ ████║██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔═══██╗
    ██║   ██║██╔████╔██║██████╔╝██████╔╝███████║██║     ██║   ██║
    ██║   ██║██║╚██╔╝██║██╔══██╗██╔══██╗██╔══██║██║     ██║   ██║
    ╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║██║  ██║╚██████╗╚██████╔╝
     ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
                    LTS Upgrade Audit Tool v1.0.0

┌──────────────────────────────────┬────────────┬────────────────────┐
│ Rule                             │   Matches  │     Hours          │
├──────────────────────────────────┼────────────┼────────────────────┤
│ NuGet Package Updates            │         12 │              6.0   │
│ Removed Extension Methods        │          3 │              3.0   │
│ Tiptap Import Changes            │          2 │              1.0   │
│ Removed Packages                 │          1 │              0.5   │
│ Program.cs Changes               │          1 │              0.5   │
│ ViewImports Smidge Removal       │          1 │              0.5   │
│ Angular Files Detected           │          8 │             40.0   │
├──────────────────────────────────┴────────────┴────────────────────┤
│  TOTAL ESTIMATE:  51.5 hours  (~6.4 days @ 8h/day)                 │
└─────────────────────────────────────────────────────────────────────┘

H5YR! 🙌 Thanks for using the Umbraco Upgrade Audit Tool!
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Audit completed successfully |
| `1` | Invalid arguments or configuration |
| `2` | Runtime error |

## Getting Help

```bash
# Show all options
umbraco-audit --help

# Show version
umbraco-audit --version
```

## What's Next?

After running the audit:

1. **Review the report** — Focus on high-hour items first
2. **Export JSON for tracking** — `--output json > baseline.json`
3. **Customize hours** — Adjust estimates based on your team's experience
4. **Re-run after changes** — Track progress as you work through the upgrade

## Troubleshooting

### "Not an Umbraco project" error

The tool looks for `Umbraco.*` package references in .csproj files. Ensure you're pointing to a directory containing an Umbraco 13 project.

### "NuGet API unavailable" warning

Package version checks require internet access. The audit will continue but skip version compatibility checks.

### Slow scans on large projects

Use `--debug` to see which files are being processed. Consider adding paths to `excludePaths` in your config.
