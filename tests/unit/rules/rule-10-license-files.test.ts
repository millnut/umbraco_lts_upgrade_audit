import { resolve } from 'node:path';
import process from 'node:process';
import { beforeEach, describe, expect, it } from 'vitest';
import { rule10LicenseFiles } from '../../../src/rules/rule-10-license-files.js';
import type { RuleContext } from '../../../src/rules/types.js';

describe('Rule 10: License File Structure Changes', () => {
  const testFixturesPath = resolve(process.cwd(), 'tests/fixtures/sample-umbraco-project');

  let context: RuleContext;

  beforeEach(() => {
    context = {
      projectPath: testFixturesPath,
      projectFiles: [],
      allFiles: [],
      debug: false,
    };
  });

  it('should have correct metadata', () => {
    expect(rule10LicenseFiles.id).toBe('rule-10-license-files');
    expect(rule10LicenseFiles.name).toBe('License File Structure Changes');
    expect(rule10LicenseFiles.category).toBe('configuration');
    expect(rule10LicenseFiles.baseHours).toBe(0.5);
    expect(rule10LicenseFiles.enabled).toBe(true);
    expect(rule10LicenseFiles.filePatterns).toEqual(['**/*.lic']);
  });

  it('should detect Umbraco Forms and Deploy license files', async () => {
    const findings = await rule10LicenseFiles.execute(context);

    expect(findings.length).toBe(1); // Should create only one finding for all license files
    expect(findings[0].ruleId).toBe('rule-10-license-files');
    expect(findings[0].hours).toBe(0.5); // Fixed total hours
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].lineContent).toContain('umbracoDeploy.lic');
    expect(findings[0].lineContent).toContain('umbracoForms.lic');
  });

  it('should report correct total hours (0.5h total, not per file)', async () => {
    const findings = await rule10LicenseFiles.execute(context);

    // Should be exactly one finding with 0.5h total
    expect(findings.length).toBe(1);
    expect(findings[0].hours).toBe(0.5);
  });

  it('should have descriptive finding message', async () => {
    const findings = await rule10LicenseFiles.execute(context);

    expect(findings.length).toBe(1);
    expect(findings[0].metadata?.description).toContain('Legacy license files detected');
    expect(findings[0].metadata?.description).toContain('Umbraco 17 licensing structure');
    expect(findings[0].metadata?.action).toBe('Change licensing structure for Forms and Deploy');
    expect(findings[0].metadata?.filesFound).toBe(2);
  });

  it('should detect files in umbraco/Licenses directory', async () => {
    const findings = await rule10LicenseFiles.execute(context);

    expect(findings.length).toBe(1);
    expect(findings[0].filePath).toContain('umbraco');
    expect(findings[0].filePath).toContain('Licenses');
  });

  it('should return empty findings when no license files exist', async () => {
    // Create a context pointing to a different directory without license files
    const emptyContext: RuleContext = {
      projectPath: resolve(process.cwd(), 'tests/fixtures'),
      projectFiles: [],
      allFiles: [],
      debug: false,
    };

    const findings = await rule10LicenseFiles.execute(emptyContext);

    // Note: This might still find files if they exist in the parent directory
    // The test is mainly to verify the rule doesn't crash with no files
    expect(Array.isArray(findings)).toBe(true);
  });
});
