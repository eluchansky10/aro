#!/usr/bin/env node
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '..', '..', '..', '.env') });

import { Command } from 'commander';
import chalk from 'chalk';
import { planCommand } from './plan.js';

const program = new Command();

// Global verbose flag
let verbose = false;

function handleError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);

  // Provide helpful context for common errors
  if (message.includes('API_KEY') || message.includes('api key') || message.includes('API key')) {
    console.error(chalk.red(`\nError: ${message}`));
    console.error(chalk.dim('Set the environment variable: export KIMI_API_KEY=sk-...'));
  } else if (message.includes('extension') || message.includes('connected')) {
    console.error(chalk.red(`\nError: ${message}`));
    console.error(chalk.dim('1. Build extension: npm run build:extension'));
    console.error(chalk.dim('2. Load in Chrome: chrome://extensions → Developer mode → Load unpacked → packages/extension'));
    console.error(chalk.dim('3. Ensure backend is running: npm run dev -w packages/backend'));
  } else if (message.includes('ENOENT') || message.includes('not found')) {
    console.error(chalk.red(`\nError: ${message}`));
    console.error(chalk.dim('Check that config files exist in the config/ directory'));
  } else {
    console.error(chalk.red(`\nError: ${message}`));
  }

  if (verbose && err instanceof Error && err.stack) {
    console.error(chalk.dim(`\n${err.stack}`));
  }

  process.exit(1);
}

program
  .name('aro')
  .description('ARO — Automated Research Orchestrator')
  .version('0.1.0')
  .option('-v, --verbose', 'Enable verbose/debug logging')
  .hook('preAction', (thisCommand) => {
    verbose = thisCommand.opts().verbose ?? false;
  });

program
  .command('plan <topic>')
  .description('Generate a research plan for a topic')
  .option('--dry-run', 'Generate plan without saving or executing')
  .action(async (topic: string, options: { dryRun?: boolean }) => {
    try {
      await planCommand(topic, options);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('status [session-id]')
  .description('Show session status')
  .action(async (sessionId?: string) => {
    const { statusCommand } = await import('./status.js');
    try {
      await statusCommand(sessionId);
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('synthesize [session-id]')
  .description('Synthesize research results into knowledge base')
  .option('--manual', 'Write prompt to file instead of auto-invoking Claude')
  .action(async (sessionId?: string, options?: { manual?: boolean }) => {
    const { synthesizeCommand } = await import('./synthesize.js');
    try {
      await synthesizeCommand(sessionId, options ?? {});
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('health')
  .description('Run selector health checks against LLM providers')
  .action(async () => {
    const { healthCommand } = await import('./health.js');
    try {
      await healthCommand();
    } catch (err) {
      handleError(err);
    }
  });

program.parse();
