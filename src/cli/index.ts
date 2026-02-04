#!/usr/bin/env node

import { Command } from 'commander';
import { executeAuditCommand } from './commands/audit.js';
import type { AuditCommandOptions } from './commands/audit.js';

/**
 * CLI entry point
 * 
 * Implements Commander-based CLI with audit command and options
 */

const program = new Command();

program
  .name('umbraco-audit')
  .description('CLI tool to audit and estimate upgrade effort for Umbraco 13 LTS to Umbraco 17 LTS')
  .version('0.1.0');

program
  .command('audit')
  .description('Audit an Umbraco project and generate upgrade estimate')
  .argument('<path>', 'Path to Umbraco project directory, .sln, or .csproj')
  .option('-o, --output <format>', 'Output format: console, json, html', 'console')
  .option('-v, --verbose', 'Show detailed findings with code context', false)
  .option('--debug', 'Enable debug logging', false)
  .option('--no-color', 'Disable colored output', false)
  .action(async (path: string, options: AuditCommandOptions) => {
    await executeAuditCommand(path, options);
  });

// Make audit the default command
program
  .argument('[path]', 'Path to Umbraco project directory, .sln, or .csproj')
  .option('-o, --output <format>', 'Output format: console, json, html', 'console')
  .option('-v, --verbose', 'Show detailed findings with code context', false)
  .option('--debug', 'Enable debug logging', false)
  .option('--no-color', 'Disable colored output', false)
  .action(async (path: string | undefined, options: AuditCommandOptions) => {
    if (path) {
      await executeAuditCommand(path, options);
    } else {
      program.help();
    }
  });

program.parse();
