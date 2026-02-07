# Tasks: Umbraco LTS Upgrade Audit CLI

**Input**: Design documents from `/specs/001-umbraco-upgrade-audit/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not explicitly requested in specification. Test tasks omitted per template guidelines.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and build configuration

- [X] T001 Initialize Node.js project with package.json in repository root
- [X] T002 Configure TypeScript with tsconfig.json (target ES2022, strict mode)
- [X] T003 [P] Install dependencies: commander, zod, chalk, cli-table3, fast-glob, fast-xml-parser
- [X] T004 [P] Install dev dependencies: vitest, typescript, @types/node, eslint, prettier
- [X] T005 [P] Configure ESLint with TypeScript rules in eslint.config.js
- [X] T006 [P] Configure Prettier in .prettierrc
- [X] T007 Create src/ directory structure per plan.md
- [X] T008 Create tests/ directory structure per plan.md
- [X] T009 Add npm scripts: build, dev, test, lint, format in package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 Create Rule interface and RuleCategory type in src/rules/types.ts
- [X] T011 Create Finding interface with CodeSnippet in src/models/finding.ts
- [X] T012 [P] Create AuditReport and AuditSummary interfaces in src/models/report.ts
- [X] T013 [P] Create ProjectInfo interface in src/models/project.ts
- [X] T014 Create Logger utility with debug mode support in src/utils/logger.ts
- [X] T015 [P] Create hours calculation helper (linear scaling) in src/utils/hours.ts
- [X] T016 Implement file-scanner with fast-glob for recursive file discovery in src/scanners/file-scanner.ts
- [X] T017 Implement csproj-parser for XML parsing with fast-xml-parser in src/scanners/csproj-parser.ts
- [X] T018 [P] Implement code-searcher for pattern matching with line tracking in src/scanners/code-searcher.ts
- [X] T019 Create Zod schemas for CLI args and config validation in src/cli/schemas.ts
- [X] T020 Implement rule registry and executor in src/rules/index.ts

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 2b: Unit Tests for Foundational Components

**Purpose**: Satisfy constitution principle II (Testing Standards) — 80%+ coverage for critical paths

- [ ] T020a [P] Create test fixtures: sample .csproj files in tests/fixtures/
- [ ] T020b [P] Write unit tests for csproj-parser in tests/unit/scanners/csproj-parser.test.ts
- [ ] T020c [P] Write unit tests for code-searcher in tests/unit/scanners/code-searcher.test.ts
- [ ] T020d [P] Write unit tests for file-scanner in tests/unit/scanners/file-scanner.test.ts
- [ ] T020e [P] Write unit tests for hours utility in tests/unit/utils/hours.test.ts
- [ ] T020f [P] Write unit tests for logger utility in tests/unit/utils/logger.test.ts

**Checkpoint**: Foundational components have unit test coverage

---

## Phase 3: User Story 1 - Basic Project Scan (Priority: P1) 🎯 MVP

**Goal**: Point CLI at Umbraco 13 project, receive report with total hours and breakdown

**Independent Test**: Run `umbaudit /path/to/project` and verify table output with totals

### Implementation for User Story 1

- [X] T021 [US1] Implement NuGet API client with caching in src/scanners/nuget-client.ts
- [X] T022 [US1] Implement Rule 1: NuGet Package Updates in src/rules/rule-01-nuget-packages.ts
- [X] T023 [P] [US1] Implement Rule 2: Obsolete Controller Classes (3 classes) in src/rules/rule-02-removed-extensions.ts
- [X] T024 [P] [US1] Implement Rule 3: Tiptap Import Change in src/rules/rule-03-tiptap-import.ts
- [X] T025 [P] [US1] Implement Rule 4: Removed Packages (3 packages) in src/rules/rule-04-removed-packages.ts
- [X] T026 [P] [US1] Implement Rule 5: Program.cs UseInstallerEndpoints in src/rules/rule-05-program-cs.ts
- [X] T027 [P] [US1] Implement Rule 6: ViewImports Smidge removal in src/rules/rule-06-view-imports.ts
- [X] T028 [P] [US1] Implement Rule 7: Angular detection in App_Plugins in src/rules/rule-07-angular-detection.ts
- [X] T029 [US1] Create Umbraco ASCII logo with chalk #3544B1 color in src/cli/output/ascii-logo.ts
- [X] T030 [US1] Implement table renderer with cli-table3 in src/cli/output/table-renderer.ts
- [X] T031 [US1] Implement console formatter with logo, table, totals, H5YR footer in src/cli/output/formatters/console.ts
- [X] T032 [US1] Implement audit command with path validation in src/cli/commands/audit.ts
- [X] T033 [US1] Setup Commander CLI with audit command and options in src/cli/index.ts
- [X] T034 [US1] Add main entry point and bin configuration in package.json
- [X] T035 [US1] Add Umbraco 13 project detection (check for Umbraco.* packages v13.x)

**Checkpoint**: User Story 1 complete — CLI runs, scans project, displays branded report with hours

---

## Phase 3b: Unit Tests for Rules

**Purpose**: Each rule MUST have unit tests per constitution principle II

- [ ] T035a [P] Write unit tests for Rule 1 (NuGet packages) in tests/unit/rules/rule-01.test.ts
- [ ] T035b [P] Write unit tests for Rule 2 (obsolete controllers) in tests/unit/rules/rule-02.test.ts
- [ ] T035c [P] Write unit tests for Rule 3 (Tiptap import) in tests/unit/rules/rule-03.test.ts
- [ ] T035d [P] Write unit tests for Rule 4 (removed packages) in tests/unit/rules/rule-04.test.ts
- [ ] T035e [P] Write unit tests for Rule 5 (Program.cs) in tests/unit/rules/rule-05.test.ts
- [ ] T035f [P] Write unit tests for Rule 6 (ViewImports) in tests/unit/rules/rule-06.test.ts
- [ ] T035g [P] Write unit tests for Rule 7 (Angular detection) in tests/unit/rules/rule-07.test.ts

**Checkpoint**: All 7 rules have unit test coverage

---

## Phase 4: User Story 2 - Rule-Based Estimation (Priority: P1)

**Goal**: Rules apply configurable hour estimates with linear scaling

**Independent Test**: Verify findings × baseHours = total for each rule

### Implementation for User Story 2

- [X] T036 [US2] Add baseHours property to each rule with default values per plan.md
- [X] T037 [US2] Implement linear scaling calculation in rule executor (count × baseHours)
- [X] T038 [US2] Split Rule 1 output into Umbraco.* vs Other packages in report
- [X] T039 [US2] Add per-rule hours breakdown to AuditSummary
- [X] T040 [US2] Update table renderer to show hours per rule row

**Checkpoint**: User Story 2 complete — hours scale linearly, breakdown visible

---

## Phase 5: User Story 3 - Report Output Formats (Priority: P2)

**Goal**: Export report as JSON or HTML in addition to console

**Independent Test**: Run with `--output json` and `--output html`, verify valid output

### Implementation for User Story 3

- [X] T041 [US3] Implement JSON formatter matching contract schema in src/cli/output/formatters/json.ts
- [X] T042 [US3] Implement HTML formatter with embedded styles in src/cli/output/formatters/html.ts
- [X] T043 [US3] Add --output flag to audit command with console/json/html options
- [X] T044 [US3] Create formatter factory to select formatter by output option

**Checkpoint**: User Story 3 complete — all three output formats work

---

## Phase 6: User Story 4 - Custom Rule Configuration (Priority: P2)

**Goal**: Users can override hour estimates and disable rules via YAML config

**Independent Test**: Create config file, verify custom hours used and disabled rules skipped

### Implementation for User Story 4

- [ ] T045 [US4] Create UserConfig interface and Zod schema in src/models/config.ts
- [ ] T046 [US4] Implement YAML config loader with validation in src/cli/config-loader.ts
- [ ] T047 [US4] Add --config flag to audit command
- [ ] T048 [US4] Apply config overrides to rule registry (hours, enabled state)
- [ ] T049 [US4] Add excludePaths support to file scanner

**Checkpoint**: User Story 4 complete — configuration customizes audit behavior

---

## Phase 7: User Story 5 - Detailed Findings with Locations (Priority: P3)

**Goal**: Show file paths and line numbers for each finding, code snippets in verbose mode

**Independent Test**: Run with `--verbose`, verify file:line and code context shown

### Implementation for User Story 5

- [ ] T050 [US5] Ensure all rules populate filePath and lineNumber in findings
- [ ] T051 [US5] Implement code snippet extraction (3 lines before/after) in code-searcher
- [ ] T052 [US5] Add --verbose flag to audit command
- [ ] T053 [US5] Update console formatter to show file locations when verbose
- [ ] T054 [US5] Update console formatter to show code snippets when verbose
- [ ] T055 [US5] Update JSON formatter to include findings array with locations
- [ ] T056 [US5] Update HTML formatter with collapsible findings sections

**Checkpoint**: User Story 5 complete — detailed findings with locations available

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, progress feedback, documentation

- [ ] T057 [P] Add progress indicator for file scanning (spinner or bar)
- [ ] T058 [P] Implement graceful offline handling for NuGet API (skip with warning)
- [ ] T059 Add exit codes: 0 success, 1 invalid args, 2 runtime error
- [ ] T060 [P] Add --no-color flag support via chalk.level
- [ ] T061 [P] Add --debug flag for detailed trace logging
- [ ] T062 [P] Add --version and --help commands
- [ ] T063 Create README.md with installation and usage examples
- [ ] T064 Create sample test fixture: minimal Umbraco 13 project in tests/fixtures/sample-umbraco-project/
- [ ] T065 Run quickstart.md validation to ensure documented commands work

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ─────────────────────────────────────────────────┐
                                                                  │
Phase 2 (Foundational) ◀──────────────────────────────────────────┘
     │
     ├──▶ Phase 3 (US1: Basic Scan) 🎯 MVP
     │         │
     │         ▼
     │    Phase 4 (US2: Rule Estimation) ◀─ builds on US1
     │         │
     │         ▼
     │    Phase 5 (US3: Output Formats) ◀─ builds on US1+US2
     │         │
     │         ▼
     │    Phase 6 (US4: Configuration) ◀─ builds on US1+US2
     │         │
     │         ▼
     │    Phase 7 (US5: Detailed Findings) ◀─ builds on all above
     │
     └──▶ Phase 8 (Polish) ◀─ can start after Phase 3 MVP
```

### User Story Independence

- **US1 (P1)**: Core MVP — scan and report
- **US2 (P1)**: Enhances US1 with proper hour calculations (tightly coupled)
- **US3 (P2)**: Adds output formats — independent output layer
- **US4 (P2)**: Adds configuration — independent config layer
- **US5 (P3)**: Adds detailed findings — enhances all formatters

### Parallel Opportunities per Phase

**Phase 1 (Setup)**: T003, T004, T005, T006 can run in parallel  
**Phase 2 (Foundational)**: T012, T013, T015, T018 can run in parallel  
**Phase 3 (US1)**: T023-T028 (Rules 2-7) can run in parallel after T020  
**Phase 5 (US3)**: T041, T042 can run in parallel  
**Phase 8 (Polish)**: T057, T058, T060, T061, T062 can run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 — Basic scan with console output
4. Complete Phase 4: User Story 2 — Proper hour calculations
5. **STOP and VALIDATE**: Run against real Umbraco 13 project
6. Deploy v0.1.0

### Incremental Delivery

| Version | Stories | Capability |
|---------|---------|------------|
| v0.1.0 | US1 + US2 | CLI scans project, shows hours in console |
| v0.2.0 | + US3 | JSON and HTML output formats |
| v0.3.0 | + US4 | Custom configuration support |
| v1.0.0 | + US5 + Polish | Detailed findings, production-ready |

---

## Summary

**Total Tasks**: 78  
**Tasks per User Story**:
- Setup: 9 tasks
- Foundational: 11 tasks
- Foundational Tests: 6 tasks
- US1 (Basic Scan): 15 tasks
- US1 Rule Tests: 7 tasks
- US2 (Rule Estimation): 5 tasks
- US3 (Output Formats): 4 tasks
- US4 (Configuration): 5 tasks
- US5 (Detailed Findings): 7 tasks
- Polish: 9 tasks

**Parallel Opportunities**: 37 tasks marked [P]

**MVP Scope**: Phases 1-4 including tests (53 tasks) delivers working CLI with console output and test coverage

**Constitution Compliance**: ✅ Testing Standards (Principle II) satisfied with unit tests for all rules and foundational components

**Format Validation**: ✅ All tasks follow `- [ ] [TaskID] [P?] [Story?] Description with file path` format
