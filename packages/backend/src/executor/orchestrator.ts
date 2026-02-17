import chalk from 'chalk';
import type { Session, ResearchTask, LLMTarget } from '@aro/shared';
import { loadTargets, loadSettings } from '../store/config-store.js';
import { updateSession, getSession } from '../store/session-store.js';
import { ProviderQueue } from './queue.js';
import { runTask, type TaskResult } from './task-runner.js';
import type { ConnectionManager } from '../ws/connection-mgr.js';

export interface OrchestratorOptions {
  mgr: ConnectionManager;
  sessionId: string;
  onProgress?: (event: ProgressEvent) => void;
}

export interface ProgressEvent {
  type: 'task_started' | 'task_completed' | 'task_failed' | 'all_complete';
  task_id?: string;
  message: string;
}

/**
 * Orchestrate execution of all tasks in a research plan.
 * - Runs providers in parallel (up to max_concurrent_providers)
 * - Runs tasks sequentially within each provider queue
 * - Respects task dependencies via topological ordering
 */
export async function executeSession(opts: OrchestratorOptions): Promise<TaskResult[]> {
  const { mgr, sessionId, onProgress } = opts;
  const settings = loadSettings();
  const targets = loadTargets();
  const targetMap = new Map(targets.map((t) => [t.id, t]));

  // Mark session as executing
  updateSession(sessionId, { status: 'executing' });
  const session = getSession(sessionId);

  // Build dependency-aware execution order
  const ordered = topologicalSort(session.plan.tasks);

  // Group tasks by target provider
  const providerGroups = new Map<string, ResearchTask[]>();
  for (const task of ordered) {
    const group = providerGroups.get(task.target_model) ?? [];
    group.push(task);
    providerGroups.set(task.target_model, group);
  }

  // Track completed tasks for dependency resolution
  const completedTasks = new Set<string>();
  const results: TaskResult[] = [];

  // Create per-provider queues
  const queuePromises: Promise<void>[] = [];

  for (const [providerId, tasks] of providerGroups) {
    const target = targetMap.get(providerId);
    if (!target) {
      console.error(chalk.red(`Unknown provider: ${providerId}`));
      continue;
    }

    const queuePromise = runProviderQueue(
      tasks,
      target,
      mgr,
      sessionId,
      settings.task_timeout_ms,
      completedTasks,
      (result) => {
        results.push(result);
        if (result.success) {
          completedTasks.add(result.task_id);
          onProgress?.({
            type: 'task_completed',
            task_id: result.task_id,
            message: `${result.task_id} completed (${target.name})`,
          });
        } else {
          onProgress?.({
            type: 'task_failed',
            task_id: result.task_id,
            message: `${result.task_id} failed: ${result.error}`,
          });
        }
      }
    );

    queuePromises.push(queuePromise);

    // Limit concurrent providers
    if (queuePromises.length >= settings.max_concurrent_providers) {
      await Promise.race(queuePromises);
    }
  }

  // Wait for all queues to complete
  await Promise.all(queuePromises);

  // Update session status
  const hasFailures = results.some((r) => !r.success);
  updateSession(sessionId, {
    status: hasFailures ? 'executed' : 'executed',
    completed_at: new Date().toISOString(),
  });

  onProgress?.({
    type: 'all_complete',
    message: `Execution complete: ${results.filter((r) => r.success).length}/${results.length} tasks succeeded`,
  });

  return results;
}

async function runProviderQueue(
  tasks: ResearchTask[],
  target: LLMTarget,
  mgr: ConnectionManager,
  sessionId: string,
  timeoutMs: number,
  completedTasks: Set<string>,
  onResult: (result: TaskResult) => void
): Promise<void> {
  for (const task of tasks) {
    // Wait for dependencies
    await waitForDependencies(task.dependencies, completedTasks);

    // Rate limit
    if (target.rate_limit_ms > 0) {
      await sleep(target.rate_limit_ms);
    }

    const result = await runTask(sessionId, task, target, mgr, timeoutMs);
    onResult(result);
  }
}

async function waitForDependencies(
  deps: string[],
  completedTasks: Set<string>,
  maxWaitMs: number = 600_000
): Promise<void> {
  if (deps.length === 0) return;

  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (deps.every((d) => completedTasks.has(d))) return;
    await sleep(500);
  }
  throw new Error(`Dependency timeout: waiting for ${deps.join(', ')}`);
}

/** Topological sort of tasks by dependencies */
function topologicalSort(tasks: ResearchTask[]): ResearchTask[] {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const visited = new Set<string>();
  const result: ResearchTask[] = [];

  function visit(taskId: string) {
    if (visited.has(taskId)) return;
    visited.add(taskId);
    const task = taskMap.get(taskId);
    if (!task) return;
    for (const dep of task.dependencies) {
      visit(dep);
    }
    result.push(task);
  }

  // Visit in priority order
  const sorted = [...tasks].sort((a, b) => a.priority - b.priority);
  for (const task of sorted) {
    visit(task.id);
  }

  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
