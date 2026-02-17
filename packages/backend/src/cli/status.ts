import chalk from 'chalk';
import { getSession, getLatestSession, listSessions } from '../store/session-store.js';
import type { Session, TaskStatus } from '@aro/shared';

const STATUS_COLORS: Record<string, (s: string) => string> = {
  pending: chalk.gray,
  queued: chalk.yellow,
  running: chalk.blue,
  completed: chalk.green,
  failed: chalk.red,
  skipped: chalk.dim,
  planning: chalk.yellow,
  approved: chalk.cyan,
  executing: chalk.blue,
  executed: chalk.green,
  synthesizing: chalk.magenta,
};

function colorStatus(status: string): string {
  const colorFn = STATUS_COLORS[status] ?? chalk.white;
  return colorFn(status);
}

export async function statusCommand(sessionId?: string) {
  let session: Session | null;

  if (sessionId) {
    session = getSession(sessionId);
  } else {
    session = getLatestSession();
  }

  if (!session) {
    // Show list of sessions
    const sessions = listSessions();
    if (sessions.length === 0) {
      console.log(chalk.yellow('\nNo research sessions found. Run `aro plan` to create one.'));
      return;
    }
    console.log(chalk.bold('\nResearch Sessions:'));
    console.log(chalk.dim('  ' + 'ID'.padEnd(40) + 'Status'.padEnd(14) + 'Tasks'.padEnd(8) + 'Topic'));
    console.log(chalk.dim('  ' + '─'.repeat(80)));
    for (const s of sessions) {
      const completed = s.plan.tasks.filter((t) => t.status === 'completed').length;
      const total = s.plan.tasks.length;
      console.log(
        '  ' +
          chalk.yellow(s.id.padEnd(40)) +
          colorStatus(s.status).padEnd(14 + 10) + // extra for ANSI codes
          `${completed}/${total}`.padEnd(8) +
          s.plan.topic.slice(0, 40)
      );
    }
    return;
  }

  displaySession(session);
}

function displaySession(session: Session) {
  console.log(chalk.bold('\nSession Status'));
  console.log(chalk.dim('─'.repeat(60)));
  console.log(`  ${chalk.bold('ID:')}      ${session.id}`);
  console.log(`  ${chalk.bold('Topic:')}   ${session.plan.topic}`);
  console.log(`  ${chalk.bold('Status:')}  ${colorStatus(session.status)}`);
  console.log(`  ${chalk.bold('Created:')} ${session.created_at}`);
  console.log(`  ${chalk.bold('Updated:')} ${session.updated_at}`);

  console.log(chalk.bold('\nTasks:'));
  console.log(
    chalk.dim(
      '  ' +
        'ID'.padEnd(10) +
        'Status'.padEnd(12) +
        'Model'.padEnd(14) +
        'Title'
    )
  );
  console.log(chalk.dim('  ' + '─'.repeat(60)));

  for (const task of session.plan.tasks) {
    console.log(
      '  ' +
        chalk.yellow(task.id.padEnd(10)) +
        colorStatus(task.status).padEnd(12 + 10) +
        chalk.blue(task.target_model.padEnd(14)) +
        task.title
    );
  }

  // Summary
  const counts = new Map<TaskStatus, number>();
  for (const task of session.plan.tasks) {
    counts.set(task.status, (counts.get(task.status) ?? 0) + 1);
  }
  console.log(chalk.dim('\n  ' + '─'.repeat(60)));
  const summary = [...counts.entries()]
    .map(([s, c]) => `${colorStatus(s)}: ${c}`)
    .join('  ');
  console.log(`  ${summary}  Total: ${session.plan.tasks.length}`);
}
