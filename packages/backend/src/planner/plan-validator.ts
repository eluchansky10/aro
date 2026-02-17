import { ResearchPlanSchema, type ResearchPlan, type LLMTarget } from '@aro/shared';

export class PlanValidationError extends Error {
  constructor(
    message: string,
    public issues: string[]
  ) {
    super(message);
    this.name = 'PlanValidationError';
  }
}

export function validatePlan(data: unknown, targets: LLMTarget[]): ResearchPlan {
  // Zod structural validation
  const plan = ResearchPlanSchema.parse(data);

  // Semantic validation
  const issues: string[] = [];
  const validModelIds = new Set(targets.map((t) => t.id));
  const taskIds = new Set(plan.tasks.map((t) => t.id));

  for (const task of plan.tasks) {
    // Check target_model is valid
    if (!validModelIds.has(task.target_model)) {
      issues.push(
        `Task "${task.id}" assigned to unknown model "${task.target_model}". Valid: ${[...validModelIds].join(', ')}`
      );
    }

    // Check dependencies reference valid task IDs
    for (const dep of task.dependencies) {
      if (!taskIds.has(dep)) {
        issues.push(
          `Task "${task.id}" depends on unknown task "${dep}"`
        );
      }
      if (dep === task.id) {
        issues.push(`Task "${task.id}" depends on itself`);
      }
    }
  }

  // Check for cycles (topological sort)
  if (issues.length === 0) {
    const cycleCheck = detectCycles(plan.tasks);
    if (cycleCheck) {
      issues.push(`Dependency cycle detected: ${cycleCheck}`);
    }
  }

  if (issues.length > 0) {
    throw new PlanValidationError(
      `Plan validation failed with ${issues.length} issue(s)`,
      issues
    );
  }

  return plan;
}

function detectCycles(
  tasks: Array<{ id: string; dependencies: string[] }>
): string | null {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  function dfs(taskId: string, path: string[]): string | null {
    if (inStack.has(taskId)) {
      const cycleStart = path.indexOf(taskId);
      return path.slice(cycleStart).concat(taskId).join(' → ');
    }
    if (visited.has(taskId)) return null;

    visited.add(taskId);
    inStack.add(taskId);
    path.push(taskId);

    const task = taskMap.get(taskId);
    if (task) {
      for (const dep of task.dependencies) {
        const cycle = dfs(dep, path);
        if (cycle) return cycle;
      }
    }

    path.pop();
    inStack.delete(taskId);
    return null;
  }

  for (const task of tasks) {
    const cycle = dfs(task.id, []);
    if (cycle) return cycle;
  }
  return null;
}
