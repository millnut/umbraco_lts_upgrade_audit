# Umbraco LTS Upgrade Audit CLI

A CLI tool to audit Umbraco 13 LTS projects and estimate upgrade effort to Umbraco 17 LTS.

## Features

- 🔍 Scans Umbraco 13 projects for upgrade-breaking changes
- 📊 Generates detailed hour estimates based on 10 detection rules
- 🎨 Beautiful console output
- ⚡ Fast scanning with NuGet API integration
- 📝 Configurable rules and output formats

## Installation

```bash
npm install
npm run build
```

## Usage

### Basic Audit

```bash
node dist/cli/index.js /path/to/umbraco-project
```

### With Options

```bash
# Verbose mode (show detailed findings)
node dist/cli/index.js /path/to/project --verbose

# Debug mode (show trace logs)
node dist/cli/index.js /path/to/project --debug

# JSON output
node dist/cli/index.js /path/to/project --output json

# HTML output (coming soon)
node dist/cli/index.js /path/to/project --output html
```

## Detection Rules

The tool applies 10 rules to detect upgrade-relevant changes:

| Rule | Detection | Base Hours |
|------|-----------|------------|
| **NuGet Package Updates** | Checks package versions against NuGet API | 0.5h for minor/patch, 1.0h for major version bumps |
| **Obsolete Controller Classes** | Detects 3 controller classes that no longer exist (`UmbracoApiController`, `UmbracoAuthorizedApiController`, `UmbracoAuthorizedJsonController`) | 1.0h per file |
| **Tiptap Import Changes** | Finds Tiptap imports (`@umbraco-cms/backoffice/external/tiptap`) needing updates | 0.5h per file |
| **Removed Packages** | Detects 3 packages removed in v17 (`Umbraco.Cloud.Cms.PublicAccess`, `Umbraco.Cloud.Identity.Cms`, `Umbraco.Cms.Web.BackOffice`) | 0.5h per package |
| **Program.cs Changes** | Finds `UseInstallerEndpoints()` calls that have been removed | 0.5h fixed |
| **ViewImports Smidge Removal** | Detects Smidge TagHelper references in `_ViewImports.cshtml` | 0.5h fixed |
| **Angular Detection** | Counts AngularJS files in `App_Plugins` requiring migration to Lit/Web Components | 40h base (5 days) + 4h per 10 files |
| **Published Snapshot Interfaces** | Detects `IPublishedSnapshotAccessor` and `IPublishedSnapshot` usage | 0.5h fixed for generated files, 0.5h per regular file |
| **Outdated Property Editors** | Detects obsolete property editors in `*.uda` files (`Umbraco.MediaPicker`, `Nested Content`, `Stacked Content`) | 1.0h per occurrence |
| **License File Structure Changes** | Detects legacy license files (`umbracoDeploy.lic`, `umbracoForms.lic`) needing update for new licensing structure | 0.5h total |

## Sample Output

```
    ██╗   ██╗███╗   ███╗██████╗ ██████╗  █████╗  ██████╗ ██████╗ 
    ██║   ██║████╗ ████║██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔═══██╗
    ██║   ██║██╔████╔██║██████╔╝██████╔╝███████║██║     ██║   ██║
    ██║   ██║██║╚██╔╝██║██╔══██╗██╔══██╗██╔══██║██║     ██║   ██║
    ╚██████╔╝██║ ╚═╝ ██║██████╔╝██║  ██║██║  ██║╚██████╗╚██████╔╝
     ╚═════╝ ╚═╝     ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ 
                    LTS Upgrade Audit Tool v0.1.0

┌──────────────────────────────────────────────────┬────────────┬────────────┐
│ Rule                                             │ Matches    │ Hours      │
├──────────────────────────────────────────────────┼────────────┼────────────┤
│ NuGet Package Updates                            │ 12         │ 6.0        │
│   └─ Umbraco.* packages                          │ 5          │ 2.5        │
│   └─ Other packages                              │ 7          │ 3.5        │
├──────────────────────────────────────────────────┼────────────┼────────────┤
│ Obsolete Controller Classes                      │ 2          │ 2.0        │
├──────────────────────────────────────────────────┼────────────┼────────────┤
│ Tiptap Import Changes                            │ 2          │ 1.0        │
├──────────────────────────────────────────────────┼────────────┼────────────┤
│ Program.cs Changes                               │ 1          │ 0.5        │
├──────────────────────────────────────────────────┼────────────┼────────────┤
│ Angular Files Detected                           │ 8          │ 40.0       │
├──────────────────────────────────────────────────┴────────────┴────────────┤
│              TOTAL ESTIMATE:  51.0 hours  (~6.4 days @ 8h/day)             │
└────────────────────────────────────────────────────────────────────────────┘

#H5YR! 🙌 Thanks for using the Umbraco Upgrade Audit Tool!
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Lint & Format

```bash
npm run lint
npm run format
```

## Architecture

- **TypeScript 5.x** with strict mode
- **Node.js 22 LTS** runtime
- **Commander** for CLI framework
- **Zod** for schema validation
- **fast-glob** for file scanning
- **fast-xml-parser** for .csproj parsing
- **chalk** for terminal colors
- **cli-table3** for table rendering

## Project Structure

```
src/
├── cli/              # CLI commands and output formatters
├── rules/            # 10 audit rules
├── scanners/         # File scanning and parsing utilities
├── models/           # TypeScript interfaces
└── utils/            # Shared utilities (logger, hours calc)
```

## Roadmap

- [x] **v0.1.0** - Basic console output with 10 rules (MVP)
- [ ] **v0.2.0** - JSON and HTML output formats
- [ ] **v0.3.0** - YAML configuration support
- [ ] **v1.0.0** - Detailed findings with code snippets

## License

MIT

## Contributing

Built with ❤️ for the Umbraco community. H5YR! 🙌
