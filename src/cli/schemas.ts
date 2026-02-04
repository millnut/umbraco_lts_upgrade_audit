import { z } from 'zod';

/**
 * Zod schemas for CLI args and config validation
 * 
 * Why: Constitution principle I (Code Quality) requires explicit error handling.
 * Zod provides runtime validation with clear error messages.
 */

/**
 * Output format options
 */
export const OutputFormatSchema = z.enum(['console', 'json', 'html']);
export type OutputFormat = z.infer<typeof OutputFormatSchema>;

/**
 * CLI command options schema
 */
export const CliOptionsSchema = z.object({
  output: OutputFormatSchema.default('console'),
  config: z.string().optional(),
  verbose: z.boolean().default(false),
  debug: z.boolean().default(false),
  noColor: z.boolean().default(false),
});
export type CliOptions = z.infer<typeof CliOptionsSchema>;

/**
 * Rule override configuration
 */
export const RuleOverrideSchema = z.object({
  enabled: z.boolean().optional(),
  baseHours: z.number().min(0).optional(),
});
export type RuleOverride = z.infer<typeof RuleOverrideSchema>;

/**
 * User configuration file schema
 */
export const UserConfigSchema = z.object({
  rules: z.record(z.string(), RuleOverrideSchema).optional(),
  excludePaths: z.array(z.string()).optional(),
});
export type UserConfig = z.infer<typeof UserConfigSchema>;

/**
 * Package reference schema
 */
export const PackageReferenceSchema = z.object({
  name: z.string(),
  version: z.string(),
});
export type PackageReference = z.infer<typeof PackageReferenceSchema>;
