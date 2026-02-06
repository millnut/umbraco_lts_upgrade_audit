# Implementation Plan: Umbraco LTS Upgrade Audit CLI

**Branch**: `001-umbraco-upgrade-audit` | **Date**: 2026-02-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-umbraco-upgrade-audit/spec.md`

## Summary

Build a CLI tool that scans Umbraco 13 projects and estimates upgrade effort to Umbraco 17 LTS. The tool applies 7 predefined rules to detect breaking changes, deprecated APIs, package updates, and configuration changes. Output displays an Umbraco-branded ASCII header with a tabular summary of findings and total hours/days estimate.

## Technical Context

**Language/Version**: Node.js 22 LTS, TypeScript 5.x  
**Primary Dependencies**: Commander (CLI framework), Zod (validation), chalk (terminal colors), cli-table3 (table output)  
**Storage**: N/A (stateless CLI, reads filesystem only)  
**Testing**: Vitest (fast, TypeScript-native)  
**Target Platform**: Windows, macOS, Linux (cross-platform Node.js)  
**Project Type**: Single CLI application  
**Performance Goals**: Scan 500 files in <5 minutes (per SC-001)  
**Constraints**: No network required except Rule 1 NuGet API calls; graceful offline handling  
**Scale/Scope**: Typical Umbraco solution (10-50 .csproj files, 100-1000 source files)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Code Quality | ✅ PASS | Single responsibility per rule; DRY via shared scanner utilities |
| II. Testing Standards | ✅ PASS | Unit tests for each rule; integration tests for CLI; 80%+ coverage target |
| III. User Experience Consistency | ✅ PASS | Consistent table output; clear error messages; Umbraco branding |
| IV. Performance Requirements | ✅ PASS | Async file scanning; NuGet API caching; progress indicators |
| V. Code Comments & Documentation | ✅ PASS | JSDoc for public APIs; README with examples; inline rationale for rules |

**Gate Result**: ✅ PASS — Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-umbraco-upgrade-audit/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── cli-interface.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── cli/
│   ├── index.ts         # Entry point, Commander setup
│   ├── commands/
│   │   └── audit.ts     # Main audit command
│   └── output/
│       ├── ascii-logo.ts
│       ├── table-renderer.ts
│       └── formatters/
│           ├── console.ts
│           ├── json.ts
│           └── html.ts
├── rules/
│   ├── index.ts         # Rule registry and executor
│   ├── types.ts         # Rule interface definitions
│   ├── rule-01-nuget-packages.ts
│   ├── rule-02-obsolete-controller-classes.ts
│   ├── rule-03-tiptap-import.ts
│   ├── rule-04-removed-packages.ts
│   ├── rule-05-program-cs.ts
│   ├── rule-06-view-imports.ts
│   └── rule-07-angular-detection.ts
├── scanners/
│   ├── file-scanner.ts  # Recursive file discovery
│   ├── csproj-parser.ts # .csproj XML parsing
│   ├── code-searcher.ts # Pattern matching in source files
│   └── nuget-client.ts  # NuGet API integration
├── models/
│   ├── project.ts
│   ├── finding.ts
│   ├── rule.ts
│   └── report.ts
└── utils/
    ├── logger.ts        # Debug mode logging
    └── hours.ts         # Hour calculation helpers

tests/
├── unit/
│   ├── rules/
│   │   ├── rule-01.test.ts
│   │   ├── rule-02.test.ts
│   │   └── ...
│   ├── scanners/
│   └── utils/
├── integration/
│   └── cli.test.ts
└── fixtures/
    └── sample-umbraco-project/
```

**Structure Decision**: Single project structure selected. CLI tool with clear separation between command handling (`cli/`), business logic (`rules/`, `scanners/`), and data models (`models/`).

## Rules Definition

| Rule | Name | Detection Method | Default Hours |
|------|------|------------------|---------------|
| 1 | NuGet Package Updates | Parse .csproj, query NuGet API for latest versions compatible with Umbraco 17/.NET 10 | 0.5h for minor/patch updates, 1.0h for major version bumps |
| 2 | Obsolete Controller Classes | Grep for 3 controller classes that no longer exist in .cs files | 1h per file |
| 3 | Tiptap Import Change | Search for `@umbraco-cms/backoffice/external/tiptap` in .ts/.js files | 0.5h per file |
| 4 | Removed Packages | Detect 3 specific packages in .csproj that must be removed | 0.5h per package found |
| 5 | Program.cs Changes | Detect `UseInstallerEndpoints()` in Program.cs | 0.5h fixed |
| 6 | ViewImports Smidge | Detect Smidge TagHelper/injection in _ViewImports.cshtml | 0.5h fixed |
| 7 | Angular Detection | Count .js/.html files in App_Plugins with Angular patterns | 40h base (5 days) + 4h per 10 files |

## Complexity Tracking

> No violations — design follows constitution principles without exceptions.
