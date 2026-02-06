import { describe, it, expect, beforeEach } from 'vitest';
import { rule09UdaPropertyEditors } from '../../../src/rules/rule-09-uda-property-editors.js';
import type { RuleContext } from '../../../src/rules/types.js';
import { resolve } from 'path';
import process from 'process';

describe('Rule 09: UDA Property Editors', () => {
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
    expect(rule09UdaPropertyEditors.id).toBe('rule-09-uda-property-editors');
    expect(rule09UdaPropertyEditors.name).toBe('Outdated Property Editors');
    expect(rule09UdaPropertyEditors.category).toBe('breaking-changes');
    expect(rule09UdaPropertyEditors.baseHours).toBe(1.0);
    expect(rule09UdaPropertyEditors.enabled).toBe(true);
    expect(rule09UdaPropertyEditors.filePatterns).toEqual(['**/*.uda']);
  });

  it('should detect Umbraco.MediaPicker in .uda files', async () => {
    const findings = await rule09UdaPropertyEditors.execute(context);

    const mediaPickerFindings = findings.filter((f) =>
      f.lineContent.includes('"Umbraco.MediaPicker"')
    );

    expect(mediaPickerFindings.length).toBeGreaterThan(0);
    expect(mediaPickerFindings[0].ruleId).toBe('rule-09-uda-property-editors');
    expect(mediaPickerFindings[0].hours).toBe(1.0);
    expect(mediaPickerFindings[0].severity).toBe('warning');
    expect(mediaPickerFindings[0].metadata?.outdatedEditor).toBe('Umbraco.MediaPicker');
    expect(mediaPickerFindings[0].metadata?.recommendedReplacement).toBe('MediaPicker3');
  });

  it('should NOT detect Umbraco.MediaPicker3', async () => {
    const findings = await rule09UdaPropertyEditors.execute(context);

    // Should not match MediaPicker3
    const mediaPickerFindings = findings.filter((f) =>
      f.lineContent.includes('"Umbraco.MediaPicker"')
    );

    // Verify none of the findings are for MediaPicker3
    mediaPickerFindings.forEach((finding) => {
      expect(finding.lineContent).not.toContain('"Umbraco.MediaPicker3"');
    });
  });

  it('should detect Nested Content in .uda files', async () => {
    const findings = await rule09UdaPropertyEditors.execute(context);

    const nestedContentFindings = findings.filter((f) =>
      f.lineContent.includes('"Nested Content"')
    );

    expect(nestedContentFindings.length).toBeGreaterThan(0);
    expect(nestedContentFindings[0].ruleId).toBe('rule-09-uda-property-editors');
    expect(nestedContentFindings[0].hours).toBe(1.0);
    expect(nestedContentFindings[0].severity).toBe('warning');
    expect(nestedContentFindings[0].metadata?.outdatedEditor).toBe('Nested Content');
    expect(nestedContentFindings[0].metadata?.recommendedReplacement).toBe('Block List Editor');
  });

  it('should detect Stacked Content in .uda files', async () => {
    const findings = await rule09UdaPropertyEditors.execute(context);

    const stackedContentFindings = findings.filter((f) =>
      f.lineContent.includes('"Stacked Content"')
    );

    expect(stackedContentFindings.length).toBeGreaterThan(0);
    expect(stackedContentFindings[0].ruleId).toBe('rule-09-uda-property-editors');
    expect(stackedContentFindings[0].hours).toBe(1.0);
    expect(stackedContentFindings[0].severity).toBe('warning');
    expect(stackedContentFindings[0].metadata?.outdatedEditor).toBe('Stacked Content');
    expect(stackedContentFindings[0].metadata?.recommendedReplacement).toBe('Block List Editor');
  });

  it('should report correct total hours for multiple occurrences', async () => {
    const findings = await rule09UdaPropertyEditors.execute(context);

    // BlogPost.uda should have 3 outdated editors:
    // - Umbraco.MediaPicker
    // - Nested Content
    // - Stacked Content
    const blogPostFindings = findings.filter((f) => f.filePath.includes('BlogPost.uda'));

    expect(blogPostFindings.length).toBe(3);

    // Each occurrence should be 1 hour
    blogPostFindings.forEach((finding) => {
      expect(finding.hours).toBe(1.0);
    });

    // Total hours should be 3
    const totalHours = blogPostFindings.reduce((sum, f) => sum + f.hours, 0);
    expect(totalHours).toBe(3.0);
  });

  it('should not flag modern property editors', async () => {
    const findings = await rule09UdaPropertyEditors.execute(context);

    // ModernPage.uda uses MediaPicker3 and BlockList, should have no findings
    const modernPageFindings = findings.filter((f) => f.filePath.includes('ModernPage.uda'));

    expect(modernPageFindings.length).toBe(0);
  });

  it('should include line numbers for findings', async () => {
    const findings = await rule09UdaPropertyEditors.execute(context);

    // All findings should have valid line numbers (1-based)
    findings.forEach((finding) => {
      expect(finding.lineNumber).toBeGreaterThan(0);
    });
  });

  it('should return empty array when no .uda files exist', async () => {
    const emptyContext: RuleContext = {
      projectPath: '/nonexistent/path',
      projectFiles: [],
      allFiles: [],
      debug: false,
    };

    const findings = await rule09UdaPropertyEditors.execute(emptyContext);
    expect(findings).toEqual([]);
  });
});
