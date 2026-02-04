# Feature Specification: Umbraco LTS Upgrade Audit CLI

**Feature Branch**: `001-umbraco-upgrade-audit`  
**Created**: 2026-02-04  
**Status**: Draft  
**Input**: User description: "Build a CLI tool to audit and provide a report on upgrade effort in hours for upgrading Umbraco 13 LTS to Umbraco 17 LTS with configurable rules to calculate hours required"

## User Scenarios & Testing *(mandatory)*

## Clarifications

### Session 2026-02-04

- Q: How should rule hours scale when multiple instances of a pattern are found? → A: Linear scaling (instances × base hours)
- Q: What level of logging/observability should the tool provide? → A: Debug mode with optional flag for detailed trace logs showing rule evaluation decisions
- Q: Should the tool support solution-level scanning or only single project directories? → A: Solution-aware (accepts .sln file or directory, automatically scans all relevant projects)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Project Scan (Priority: P1)

As a developer or technical lead, I want to point the CLI tool at an Umbraco 13 project directory and receive a report showing the estimated upgrade effort in hours, so I can plan resources and timelines for the migration.

**Why this priority**: This is the core value proposition—without scanning and producing an estimate, the tool provides no value. Everything else builds upon this foundation.

**Independent Test**: Can be fully tested by running the CLI against a sample Umbraco 13 project and verifying it outputs a total hour estimate with itemized breakdown.

**Acceptance Scenarios**:

1. **Given** a valid Umbraco 13 project directory, **When** I run the audit command with the project path, **Then** I receive a report showing total estimated hours and breakdown by category
2. **Given** an empty or non-Umbraco directory, **When** I run the audit command, **Then** I receive a clear error message indicating the project is not a valid Umbraco 13 project
3. **Given** a valid project, **When** the scan completes, **Then** the report displays which rules were triggered and the hours contributed by each

---

### User Story 2 - Rule-Based Estimation (Priority: P1)

As a developer, I want the tool to apply a configurable set of rules to calculate hours, so that estimates reflect the actual complexity factors in my specific project.

**Why this priority**: Rules are the mechanism for calculating estimates—without rules, no meaningful estimation can occur. This is tightly coupled with User Story 1.

**Independent Test**: Can be tested by creating rules and verifying they are applied correctly to sample code patterns.

**Acceptance Scenarios**:

1. **Given** the tool has default rules configured, **When** I run an audit, **Then** each applicable rule contributes its defined hours to the total
2. **Given** a rule that detects deprecated API usage, **When** the project contains that deprecated API, **Then** the rule triggers and adds its hour estimate to the total
3. **Given** multiple instances of the same pattern (e.g., 10 custom controllers), **When** the rule is applied, **Then** the hours scale linearly (10 instances × base hours = total hours for that rule)

---

### User Story 3 - Report Output Formats (Priority: P2)

As a project manager or technical lead, I want to export the audit report in different formats (console, JSON, HTML), so I can share findings with stakeholders or integrate with other tools.

**Why this priority**: Multiple output formats increase tool utility but the core functionality works with console output alone.

**Independent Test**: Can be tested by running the same audit with different format flags and verifying each produces valid, parseable output.

**Acceptance Scenarios**:

1. **Given** a completed audit, **When** I specify console output (default), **Then** I see a human-readable summary in the terminal
2. **Given** a completed audit, **When** I specify JSON output, **Then** I receive structured JSON suitable for programmatic consumption
3. **Given** a completed audit, **When** I specify HTML output, **Then** I receive a formatted HTML report suitable for sharing with stakeholders

---

### User Story 4 - Custom Rule Configuration (Priority: P2)

As a senior developer, I want to customize rule definitions and hour estimates, so that I can adjust estimates based on my team's experience level or project-specific factors.

**Why this priority**: Customization allows teams to refine estimates based on their context, improving accuracy over time.

**Independent Test**: Can be tested by modifying rule configuration and verifying the changes affect audit results.

**Acceptance Scenarios**:

1. **Given** a configuration file with custom hour values, **When** I run an audit, **Then** the tool uses my custom values instead of defaults
2. **Given** a rule I want to disable, **When** I set its status to disabled in config, **Then** that rule is skipped during the audit
3. **Given** I want to add a custom rule, **When** I define it in the configuration format, **Then** the tool applies my custom rule during scans

---

### User Story 5 - Detailed Findings with Locations (Priority: P3)

As a developer, I want to see exactly where in my codebase each issue was detected, so I can review and address the specific files and line numbers during the upgrade.

**Why this priority**: Detailed locations help developers act on findings but the estimate is still valuable without exact locations.

**Independent Test**: Can be tested by running an audit and verifying file paths and line numbers appear for triggered rules.

**Acceptance Scenarios**:

1. **Given** a rule that triggers, **When** the report is generated, **Then** it includes the file path where the issue was found
2. **Given** multiple occurrences in the same file, **When** viewing details, **Then** each occurrence shows its line number
3. **Given** verbose mode is enabled, **When** I run the audit, **Then** I see code snippets around each finding for context

---

### Edge Cases

- What happens when the project uses unconventional folder structures?
  - The tool scans recursively and reports any areas it could not analyze
- What happens when rule patterns overlap and multiple rules match the same code?
  - Each rule is applied independently; the report shows all triggered rules
- How does the system handle very large projects (1000+ files)?
  - The tool provides progress feedback and completes within reasonable time
- What happens when configuration file is malformed?
  - Clear error message indicating the configuration issue with line number if possible
- How does the tool handle projects with mixed Umbraco versions or partial upgrades?
  - Report notes version inconsistencies as informational findings

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept a solution file (.sln), project file (.csproj), or directory path as input via command-line argument
- **FR-002**: System MUST validate that the target contains an Umbraco 13 project (or solution with Umbraco 13 projects) before proceeding
- **FR-003**: System MUST scan all relevant project files (C#, Razor views, configuration files, JavaScript/TypeScript) across all projects in a solution
- **FR-004**: System MUST apply all enabled rules to the scanned codebase
- **FR-005**: System MUST calculate total estimated upgrade hours as the sum of all triggered rule estimates
- **FR-006**: System MUST output a report containing: total hours, breakdown by category, list of triggered rules with counts
- **FR-007**: System MUST support output formats: console (default), JSON, and HTML
- **FR-008**: System MUST load rules from a configuration file (with sensible defaults if none provided)
- **FR-009**: System MUST allow users to override default hour estimates via configuration
- **FR-010**: System MUST allow users to enable/disable individual rules via configuration
- **FR-011**: System MUST report file locations for each triggered rule finding
- **FR-012**: System MUST provide a verbose mode that includes code context around findings
- **FR-013**: System MUST display progress indication for long-running scans
- **FR-014**: System MUST exit with appropriate exit codes (0 for success, non-zero for errors)
- **FR-015**: System MUST provide a help command showing all available options and usage examples
- **FR-016**: System MUST support a debug mode flag that outputs detailed trace logs showing each rule evaluation and match/skip decisions

### Key Entities

- **Project**: The Umbraco 13 solution or project being audited; has a root path, detected version, list of constituent projects (if solution), and collection of source files
- **Rule**: A pattern-matching definition that identifies upgrade-relevant code; has an identifier, description, pattern definition, category, default hours, and enabled status
- **Finding**: An instance where a rule matched in the codebase; has a rule reference, file path, line number, optional code snippet, and calculated hours
- **AuditReport**: The aggregate result of scanning a project; contains project metadata, list of findings, categorized summaries, and total hour estimate
- **Configuration**: User customizations for the tool; includes rule overrides, output preferences, and custom rules
- **Category**: Logical grouping for rules (e.g., "Breaking API Changes", "Deprecated Features", "Package Updates", "Configuration Changes")

## Assumptions

The following reasonable defaults have been assumed:

- **Target Platforms**: The CLI will run on Windows, macOS, and Linux
- **Umbraco Detection**: Project is identified as Umbraco 13 by presence of Umbraco NuGet package references in .csproj files with version 13.x
- **Default Rules Source**: A comprehensive set of default rules will be bundled with the tool, based on official Umbraco 13 to 17 migration documentation
- **Configuration Format**: YAML format for configuration files (human-readable, widely supported)
- **Hour Granularity**: Hours are estimated in 0.5-hour increments (30 minutes minimum resolution)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can generate an upgrade estimate report within 5 minutes for projects up to 500 files
- **SC-002**: Users can understand the report and identify top effort areas within 2 minutes of receiving output
- **SC-003**: Generated estimates are within 30% accuracy of actual upgrade effort (validated against completed upgrades)
- **SC-004**: Users can customize rules and re-run audit in under 5 minutes
- **SC-005**: 95% of scanned files are successfully analyzed without errors
- **SC-006**: Report clearly attributes hours to specific categories and rules, enabling prioritization decisions
