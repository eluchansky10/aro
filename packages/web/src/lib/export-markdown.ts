import type { Plan } from './types';

export function planToMarkdown(plan: Plan, objective?: string, taskModelCounts?: Record<string, number>): string {
  const lines: string[] = [];

  lines.push(`# Research Plan: ${plan.topic}`);
  lines.push('');
  lines.push(`**Generated:** ${new Date(plan.created_at).toLocaleString()}`);
  if (objective) {
    lines.push(`**Objective:** ${objective}`);
  }
  lines.push('');

  lines.push('## Strategy');
  lines.push('');
  lines.push(plan.strategy);
  lines.push('');

  // Model distribution
  const modelCounts = plan.tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.target_model] = (acc[t.target_model] || 0) + 1;
    return acc;
  }, {});
  lines.push('## Model Distribution');
  lines.push('');
  for (const [model, count] of Object.entries(modelCounts)) {
    lines.push(`- **${model}**: ${count} task${count > 1 ? 's' : ''}`);
  }
  lines.push(`- **Total**: ${plan.tasks.length} tasks`);
  lines.push('');

  lines.push('## Tasks');
  lines.push('');

  for (const task of plan.tasks) {
    const count = taskModelCounts?.[task.id] ?? 2;
    lines.push(`### ${task.id}: ${task.title}`);
    lines.push('');
    lines.push(`- **Assigned Model:** ${task.target_model}`);
    lines.push(`- **Models Running:** ${count}`);
    lines.push(`- **Priority:** ${task.priority}`);
    lines.push(`- **Dependencies:** ${task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None'}`);
    lines.push('');
    lines.push('**Prompt:**');
    lines.push('');
    lines.push(task.prompt);
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  lines.push('## Synthesis Strategy');
  lines.push('');
  lines.push(plan.synthesis_strategy);
  lines.push('');

  return lines.join('\n');
}
