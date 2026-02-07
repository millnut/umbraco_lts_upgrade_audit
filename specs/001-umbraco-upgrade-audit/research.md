# Research: Umbraco LTS Upgrade Audit CLI

**Date**: 2026-02-04  
**Phase**: 0 - Research  
**Status**: Complete

## Research Tasks

### 1. NuGet API for Package Version Lookup

**Decision**: Use NuGet V3 API (ServiceIndex at `https://api.nuget.org/v3/index.json`)

**Rationale**:
- Official, well-documented API with high availability
- Supports querying package metadata including versions and dependencies
- Rate limiting is generous (no auth required for read operations)
- Package search endpoint returns dependency framework compatibility

**Alternatives Considered**:
- NuGet V2 OData API: Deprecated, less efficient for bulk queries
- Scraping nuget.org: Fragile, against ToS
- Local NuGet cache: Requires packages to already be restored

**Implementation Notes**:
- Use `SearchQueryService` for package existence check
- Use `PackageBaseAddress` for version enumeration
- Cache responses during single audit run to minimize API calls
- Handle offline gracefully: skip version check, report "unable to verify"

**Key Endpoints**:
```
GET https://api.nuget.org/v3/registration5-semver1/{package-id}/index.json
→ Returns all versions with dependency metadata
```

### 2. Umbraco 17 / .NET 10 Compatibility Detection

**Decision**: Check package dependencies for `net10.0` TFM or Umbraco.Cms.Core >= 17.0.0

**Rationale**:
- Packages targeting .NET 10 will have `net10.0` in their dependency groups
- Official Umbraco packages will reference Umbraco.Cms.Core with version constraints
- Third-party packages need framework compatibility check

**Compatibility Rules**:
1. Official Umbraco packages (`Umbraco.*`): Latest version >= 17.0.0 is compatible
2. Other packages: Must have dependency group for `net10.0` or `net9.0`+ (forward compatible)
3. Packages with no .NET 10 support: Flag as "needs replacement or update"

### 3. File Scanning Patterns in Node.js

**Decision**: Use `fast-glob` for file discovery, native `fs.readFile` for content

**Rationale**:
- `fast-glob` is highly optimized, supports gitignore-style patterns
- Native fs with async/await provides good performance without external dependencies
- Stream reading not needed for typical source files (<1MB each)

**Alternatives Considered**:
- `glob`: Slower, less feature-rich
- `node-dir`: Less maintained
- Custom recursive implementation: Unnecessary complexity

**Pattern Examples**:
```typescript
// Find all .csproj files
await glob('**/*.csproj', { cwd: projectPath, ignore: ['**/bin/**', '**/obj/**'] })

// Find C# files for method scanning
await glob('**/*.cs', { cwd: projectPath, ignore: ['**/bin/**', '**/obj/**'] })
```

### 4. .csproj XML Parsing

**Decision**: Use `fast-xml-parser` for parsing, Zod for validation

**Rationale**:
- `fast-xml-parser` is fast, well-maintained, handles .NET XML quirks
- Zod validates extracted package references match expected schema
- No need for full DOM manipulation; read-only extraction sufficient

**Package Reference Extraction**:
```xml
<PackageReference Include="Umbraco.Cms" Version="13.4.1" />
```
→ Extract: `{ name: "Umbraco.Cms", version: "13.4.1" }`

### 5. Pattern Matching for Code Analysis

**Decision**: Simple string/regex matching with line tracking

**Rationale**:
- Full AST parsing (e.g., TypeScript compiler API) is overkill for string matching
- Regex with line-by-line processing gives accurate line numbers
- False positives acceptable since this is estimation, not refactoring

**Approach**:
```typescript
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (pattern.test(line)) {
    findings.push({ line: index + 1, content: line.trim() });
  }
});
```

### 6. CLI Framework Best Practices (Commander)

**Decision**: Single command with options; subcommands reserved for future expansion

**Rationale**:
- Simple mental model: `umbaudit <path> [options]`
- Options for output format, verbosity, config file
- Exit codes: 0 = success, 1 = audit found issues (not an error), 2 = runtime error

**Command Structure**:
```
umbaudit <path>
  -o, --output <format>    Output format: console (default), json, html
  -c, --config <file>      Custom configuration file
  -v, --verbose            Show detailed findings with code context
  --debug                  Enable debug logging
  --no-color               Disable colored output
  --version                Show version
  --help                   Show help
```

### 7. Terminal Output Styling

**Decision**: Use `chalk` for colors, `cli-table3` for tables

**Rationale**:
- `chalk` is the standard for terminal colors, supports auto-detection
- `cli-table3` handles Unicode box drawing, column alignment
- Both are mature, well-maintained packages

**Umbraco Brand Color**:
- Hex: `#3544B1` (Umbraco Blue)
- chalk: `chalk.hex('#3544B1')` or `chalk.blue` as fallback

### 8. Hour Calculation Strategy

**Decision**: Linear scaling with per-rule base hours and multipliers

**Rationale**:
- Simple, predictable formula: `total = baseHours × instanceCount`
- Clarification confirmed linear scaling preference
- 0.5h minimum granularity aligns with spec assumptions

**Default Hour Estimates** (configurable):

| Rule | Base Hours | Scaling |
|------|------------|---------|
| Rule 1 - Package Update | 0.5h minor, 1.0h major | Per package needing update (major version bumps take longer) |
| Rule 2 - Obsolete Controllers | 1.0h | Per file (requires class refactoring) |
| Rule 3 - Tiptap Import | 0.5h | Per file with import |
| Rule 4 - Removed Packages | 0.5h | Per package to remove |
| Rule 5 - Program.cs | 0.5h | Fixed (single file) |
| Rule 6 - ViewImports | 0.5h | Fixed (single file) |
| Rule 7 - Angular Files | 40.0h (5 days) | Base + 4h per 10 files |

The following extension methods have been removed in Umbraco 17 and must be detected in `.cs` files:

1. `GetAssemblyFile` - Assembly file retrieval extension
2. `ToSingleItemCollection` - Collection conversion helper
3. `GenerateDataTable` - DataTable generation (related to DataTable extensions)
4. `CreateTableData` - DataTable creation (related to DataTable extensions)
5. `AddRowData` - DataTable row manipulation (related to DataTable extensions)
6. `ChildrenAsTable` - Children to DataTable conversion (related to DataTable extensions)
7. `RetryUntilSuccessOrTimeout` - Retry logic extension
8. `RetryUntilSuccessOrMaxAttempts` - Retry logic extension
9. `HasFlagAny` - Enum flag checking extension
10. `Deconstruct` - Deconstruction extension
11. `AsEnumerable` - NameValueCollection enumeration extension
12. `ContainsKey` - NameValueCollection key checking extension
13. `GetValue` - NameValueCollection value retrieval extension
14. `DisposeIfDisposable` - Conditional disposal extension
15. `SafeCast` - Safe type casting extension
16. `ToDictionary` - Object to dictionary conversion
17. `SanitizeThreadCulture` - Thread culture sanitization

**Detection Pattern**: Regex search for method name followed by `(` in `.cs` files:
```regex
\.(GetAssemblyFile|ToSingleItemCollection|GenerateDataTable|CreateTableData|AddRowData|ChildrenAsTable|RetryUntilSuccessOrTimeout|RetryUntilSuccessOrMaxAttempts|HasFlagAny|Deconstruct|AsEnumerable|ContainsKey|GetValue|DisposeIfDisposable|SafeCast|ToDictionary|SanitizeThreadCulture)\s*\(
```

### Rule 4: Removed Packages (3 packages)

The following packages have been removed and must be detected in `.csproj` files:

1. `Umbraco.Cloud.Cms.PublicAccess` - Functionality merged into core
2. `Umbraco.Cloud.Identity.Cms` - Replaced by new identity system
3. `Umbraco.Cms.Web.BackOffice` - Split into separate packages

**Detection Pattern**: Check `<PackageReference Include="...">` for exact package names.

### Rule 5: Program.cs UseInstallerEndpoints

**Detection Pattern**: Exact string match for `UseInstallerEndpoints()` in `Program.cs` files.

### Rule 7: Angular Detection Patterns

Detect legacy AngularJS patterns in `App_Plugins/**/*.js` files:

- `angular.module(`
- `ng-controller`
- `ng-app`
- `$scope`
- `$http`
- `.controller(`
- `.directive(`
- `.service(`
- `.factory(`

---

## Dependencies Summary

| Package | Purpose | Version |
|---------|---------|---------|
| commander | CLI framework | ^12.0.0 |
| zod | Schema validation | ^3.23.0 |
| chalk | Terminal colors | ^5.3.0 |
| cli-table3 | Table rendering | ^0.6.5 |
| fast-glob | File discovery | ^3.3.0 |
| fast-xml-parser | .csproj parsing | ^4.4.0 |
| vitest | Testing | ^2.0.0 |

## Open Questions Resolved

All NEEDS CLARIFICATION items from Technical Context have been resolved through research:

- ✅ NuGet API approach selected
- ✅ Compatibility detection strategy defined
- ✅ File scanning library chosen
- ✅ XML parsing approach confirmed
- ✅ CLI structure designed
- ✅ Hour calculation formula established
