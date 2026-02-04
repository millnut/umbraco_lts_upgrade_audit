import type { Rule, RuleContext, Finding } from './types.js';
import { debug } from '../utils/logger.js';

/**
 * Rule registry and executor
 * 
 * Why: Central registry for all rules enables dynamic rule management
 * and supports configuration-based enable/disable.
 */

/**
 * Global rule registry
 */
const rules: Map<string, Rule> = new Map();

/**
 * Register a rule
 * 
 * @param rule - Rule to register
 */
export function registerRule(rule: Rule): void {
  debug(`Registering rule: ${rule.id} - ${rule.name}`);
  rules.set(rule.id, rule);
}

/**
 * Get all registered rules
 * 
 * @returns Array of all rules
 */
export function getAllRules(): Rule[] {
  return Array.from(rules.values());
}

/**
 * Get a specific rule by ID
 * 
 * @param ruleId - Rule identifier
 * @returns Rule or undefined
 */
export function getRule(ruleId: string): Rule | undefined {
  return rules.get(ruleId);
}

/**
 * Get enabled rules only
 * 
 * @returns Array of enabled rules
 */
export function getEnabledRules(): Rule[] {
  return getAllRules().filter((rule) => rule.enabled);
}

/**
 * Execute all enabled rules against a project
 * 
 * @param context - Rule execution context
 * @returns All findings from all rules
 */
export async function executeAllRules(context: RuleContext): Promise<Finding[]> {
  const enabledRules = getEnabledRules();
  debug(`Executing ${enabledRules.length} enabled rules`);

  const allFindings: Finding[] = [];

  for (const rule of enabledRules) {
    debug(`Executing rule: ${rule.id}`);
    try {
      const findings = await rule.execute(context);
      debug(`Rule ${rule.id} found ${findings.length} findings`);
      allFindings.push(...findings);
    } catch (error) {
      debug(`Error executing rule ${rule.id}: ${error}`);
      // Continue with other rules even if one fails
    }
  }

  debug(`Total findings from all rules: ${allFindings.length}`);
  return allFindings;
}

/**
 * Enable a rule by ID
 * 
 * @param ruleId - Rule identifier
 */
export function enableRule(ruleId: string): void {
  const rule = rules.get(ruleId);
  if (rule) {
    rule.enabled = true;
    debug(`Enabled rule: ${ruleId}`);
  }
}

/**
 * Disable a rule by ID
 * 
 * @param ruleId - Rule identifier
 */
export function disableRule(ruleId: string): void {
  const rule = rules.get(ruleId);
  if (rule) {
    rule.enabled = false;
    debug(`Disabled rule: ${ruleId}`);
  }
}

/**
 * Update rule base hours
 * 
 * @param ruleId - Rule identifier
 * @param baseHours - New base hours value
 */
export function updateRuleHours(ruleId: string, baseHours: number): void {
  const rule = rules.get(ruleId);
  if (rule) {
    rule.baseHours = baseHours;
    debug(`Updated rule ${ruleId} base hours to ${baseHours}`);
  }
}

/**
 * Clear all registered rules (useful for testing)
 */
export function clearRules(): void {
  rules.clear();
  debug('Cleared all registered rules');
}
