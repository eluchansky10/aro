import chalk from 'chalk';
import { getSession, getLatestSession, updateSession } from '../store/session-store.js';
import { aggregateResponses } from '../synthesis/aggregator.js';
import { generateSynthesisPrompt } from '../synthesis/prompt-gen.js';
import { invokeSynthesis } from '../synthesis/invoker.js';

export async function synthesizeCommand(sessionId?: string, options?: { manual?: boolean }) {
  console.log(chalk.bold('\nARO Synthesis'));
  console.log(chalk.dim('─'.repeat(50)));

  // Load session
  const session = sessionId ? getSession(sessionId) : getLatestSession();
  if (!session) {
    console.log(chalk.red('No session found. Run `aro plan` first.'));
    return;
  }

  console.log(chalk.cyan(`Session: ${session.id}`));
  console.log(chalk.cyan(`Topic: ${session.plan.topic}\n`));

  // Check session has executed tasks
  const completedTasks = session.plan.tasks.filter((t) => t.status === 'completed');
  if (completedTasks.length === 0) {
    console.log(chalk.red('No completed tasks found. Execute the plan first.'));
    return;
  }

  console.log(chalk.dim(`${completedTasks.length}/${session.plan.tasks.length} tasks completed\n`));

  // Step 1: Aggregate
  console.log(chalk.dim('Aggregating responses...'));
  const aggregation = aggregateResponses(session.id);
  console.log(
    `  ${aggregation.manifest.length} responses, ${(aggregation.total_chars / 1000).toFixed(1)}K chars`
  );
  if (aggregation.truncated_count > 0) {
    console.log(chalk.yellow(`  ⚠ ${aggregation.truncated_count} truncated response(s)`));
  }

  // Step 2: Generate synthesis prompt
  console.log(chalk.dim('\nGenerating synthesis prompt...'));
  const synthPrompt = generateSynthesisPrompt(session, aggregation);
  console.log(`  ~${synthPrompt.estimated_tokens.toLocaleString()} tokens`);
  if (synthPrompt.needs_multi_pass) {
    console.log(chalk.yellow('  ⚠ Large input — multi-pass synthesis may be needed'));
  }

  // Step 3: Invoke
  updateSession(session.id, { status: 'synthesizing' });
  const manual = options?.manual ?? false;

  console.log(chalk.dim(`\nRunning synthesis (${manual ? 'manual' : 'auto'} mode)...`));
  const result = await invokeSynthesis(session.id, synthPrompt.prompt, manual);

  if (result.mode === 'manual') {
    console.log(chalk.yellow('\nSynthesis prompt written to:'));
    console.log(chalk.bold(`  research/${session.id}/synthesis-prompt.md`));
    console.log(chalk.dim('\nPaste this prompt into Claude to generate the knowledge base.'));
    console.log(chalk.dim(`Save output files to: research/${session.id}/output/`));
  } else if (result.success) {
    updateSession(session.id, { status: 'completed', completed_at: new Date().toISOString() });
    console.log(chalk.green('\nSynthesis complete!'));
    console.log(chalk.bold(`  Output: research/${session.id}/output/`));
  } else {
    console.log(chalk.red(`\nSynthesis failed: ${result.error}`));
  }
}
