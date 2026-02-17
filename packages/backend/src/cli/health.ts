import chalk from 'chalk';
import { runHealthChecks, getLastHealthLog } from '../health/health-manager.js';
import { getServer, startServer } from '../index.js';
import type { HealthResult } from '@aro/shared';

export async function healthCommand() {
  console.log(chalk.bold('\nARO Health Check'));
  console.log(chalk.dim('─'.repeat(50)));

  // Ensure server is running
  let server = getServer();
  if (!server) {
    console.log(chalk.dim('Starting backend server...'));
    server = startServer();
  }

  if (!server.mgr.isConnected()) {
    console.log(chalk.yellow('\nWaiting for extension connection...'));
    console.log(chalk.dim('Ensure the Chrome extension is loaded and connected.'));
    try {
      await server.mgr.waitForConnection(30_000);
    } catch {
      // Fall back to showing last results if available
      const lastLog = getLastHealthLog();
      if (lastLog) {
        console.log(chalk.yellow('\nExtension not connected. Showing last health check results:'));
        console.log(chalk.dim(`Last run: ${lastLog.last_run}\n`));
        displayResults(lastLog.results);
      } else {
        console.log(chalk.red('\nNo extension connected and no previous health check results.'));
      }
      return;
    }
  }

  console.log(chalk.dim('Running health checks...\n'));

  const results = await runHealthChecks(server.mgr);
  displayResults(results);
}

function displayResults(results: HealthResult[]) {
  const statusIcon = (status: HealthResult['status']) => {
    switch (status) {
      case 'healthy': return chalk.green('●');
      case 'degraded': return chalk.yellow('◐');
      case 'broken': return chalk.red('○');
    }
  };

  console.log(
    chalk.dim(
      '  ' +
      'Provider'.padEnd(14) +
      'Status'.padEnd(12) +
      'Selectors'
    )
  );
  console.log(chalk.dim('  ' + '─'.repeat(60)));

  for (const result of results) {
    const selectorDetail = Object.entries(result.selectors_found)
      .map(([name, found]) =>
        found ? chalk.green(`${name}:✓`) : chalk.red(`${name}:✗`)
      )
      .join(' ');

    console.log(
      '  ' +
      statusIcon(result.status) + ' ' +
      result.target_id.padEnd(12) +
      colorStatus(result.status).padEnd(12 + 10) +
      selectorDetail
    );

    if (result.error) {
      console.log(chalk.dim(`    Error: ${result.error}`));
    }
  }

  const healthy = results.filter((r) => r.status === 'healthy').length;
  const total = results.length;
  console.log(chalk.dim('\n  ' + '─'.repeat(60)));
  console.log(`  ${healthy}/${total} providers healthy`);
}

function colorStatus(status: HealthResult['status']): string {
  switch (status) {
    case 'healthy': return chalk.green('healthy');
    case 'degraded': return chalk.yellow('degraded');
    case 'broken': return chalk.red('broken');
  }
}
