import chalk from 'chalk';
import { createInterface } from 'readline';
import { generatePlan } from '../planner/planner.js';
import { createSession } from '../store/session-store.js';
import type { ResearchPlan, Session } from '@aro/shared';

export async function planCommand(topic: string, options: { dryRun?: boolean }): Promise<Session | null> {
  console.log(chalk.bold('\nARO Research Planner'));
  console.log(chalk.dim('─'.repeat(50)));
  console.log(chalk.cyan(`Topic: ${topic}\n`));
  console.log(chalk.dim('Generating research plan via Claude Opus 4.6...\n'));

  const plan = await generatePlan(topic);

  displayPlan(plan);

  if (options.dryRun) {
    console.log(chalk.yellow('\n[Dry run] Plan not saved.'));
    return null;
  }

  const approved = await promptApproval();
  if (!approved) {
    console.log(chalk.yellow('\nPlan rejected. Exiting.'));
    return null;
  }

  const session = createSession(plan);
  console.log(chalk.green(`\nPlan approved! Session: ${session.id}`));

  // Start execution
  const execute = await promptExecute();
  if (execute) {
    console.log(chalk.dim('\nStarting execution...\n'));
    const { startServer, getServer } = await import('../index.js');
    const { executeSession } = await import('../executor/orchestrator.js');

    let server = getServer();
    if (!server) {
      server = startServer();
    }

    console.log(chalk.dim('Waiting for extension connection...'));
    await server.mgr.waitForConnection(60_000);
    console.log(chalk.green('Extension connected!\n'));

    const results = await executeSession({
      mgr: server.mgr,
      sessionId: session.id,
      onProgress: (event) => {
        switch (event.type) {
          case 'task_completed':
            console.log(chalk.green(`  ✓ ${event.message}`));
            break;
          case 'task_failed':
            console.log(chalk.red(`  ✗ ${event.message}`));
            break;
          case 'all_complete':
            console.log(chalk.bold(`\n${event.message}`));
            break;
        }
      },
    });

    const succeeded = results.filter((r) => r.success).length;
    console.log(
      chalk.bold(`\nExecution complete: ${succeeded}/${results.length} tasks succeeded`)
    );
    console.log(chalk.dim(`Results in: research/${session.id}/raw/`));
  }

  return session;
}

function displayPlan(plan: ResearchPlan) {
  console.log(chalk.bold('Research Strategy:'));
  console.log(`  ${plan.strategy}\n`);

  console.log(chalk.bold('Tasks:'));
  console.log(
    chalk.dim(
      '  ' +
        'ID'.padEnd(10) +
        'Model'.padEnd(14) +
        'Pri'.padEnd(5) +
        'Deps'.padEnd(12) +
        'Title'
    )
  );
  console.log(chalk.dim('  ' + '─'.repeat(70)));

  for (const task of plan.tasks) {
    const deps = task.dependencies.length > 0 ? task.dependencies.join(',') : '—';
    console.log(
      '  ' +
        chalk.yellow(task.id.padEnd(10)) +
        chalk.blue(task.target_model.padEnd(14)) +
        String(task.priority).padEnd(5) +
        chalk.dim(deps.padEnd(12)) +
        task.title
    );
  }

  console.log(chalk.dim('\n  ' + '─'.repeat(70)));
  console.log(`  ${chalk.bold('Total tasks:')} ${plan.tasks.length}`);

  const modelCounts = new Map<string, number>();
  for (const task of plan.tasks) {
    modelCounts.set(task.target_model, (modelCounts.get(task.target_model) ?? 0) + 1);
  }
  const distribution = [...modelCounts.entries()]
    .map(([m, c]) => `${m}: ${c}`)
    .join(', ');
  console.log(`  ${chalk.bold('Distribution:')} ${distribution}`);

  console.log(chalk.bold('\nSynthesis Strategy:'));
  console.log(`  ${plan.synthesis_strategy}\n`);
}

function promptApproval(): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(chalk.bold('Approve this plan? (y/n) '), (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

function promptExecute(): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(chalk.bold('Execute now? (y/n) '), (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}
