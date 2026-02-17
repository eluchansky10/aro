import { writeFileSync } from 'fs';
import { resolve } from 'path';
import type { ResearchTask } from '@aro/shared';
import { getRawDir } from './session-store.js';

export interface ResponseMetadata {
  task_id: string;
  title: string;
  target_model: string;
  prompt: string;
  duration_ms: number;
  timestamp: string;
}

function toYamlFrontmatter(meta: ResponseMetadata): string {
  const lines = [
    '---',
    `task_id: "${meta.task_id}"`,
    `title: "${meta.title.replace(/"/g, '\\"')}"`,
    `target_model: "${meta.target_model}"`,
    `duration_ms: ${meta.duration_ms}`,
    `timestamp: "${meta.timestamp}"`,
    '---',
  ];
  return lines.join('\n');
}

export function writeResponse(
  sessionId: string,
  task: ResearchTask,
  responseText: string,
  durationMs: number
): string {
  const filename = `${task.id}-${task.target_model}.md`;
  const filePath = resolve(getRawDir(sessionId), filename);

  const meta: ResponseMetadata = {
    task_id: task.id,
    title: task.title,
    target_model: task.target_model,
    prompt: task.prompt,
    duration_ms: durationMs,
    timestamp: new Date().toISOString(),
  };

  const content = `${toYamlFrontmatter(meta)}\n\n# ${task.title}\n\n${responseText}\n`;
  writeFileSync(filePath, content, 'utf-8');

  return filename;
}
