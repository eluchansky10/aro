import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { getRawDir, getSessionDir } from '../store/session-store.js';

export interface ResponseManifestEntry {
  filename: string;
  task_id: string;
  title: string;
  target_model: string;
  truncated: boolean;
  char_count: number;
}

export interface AggregationResult {
  manifest: ResponseManifestEntry[];
  aggregated_content: string;
  total_chars: number;
  truncated_count: number;
}

const TRUNCATION_PATTERNS = [
  /I'll continue/i,
  /I can continue/i,
  /Let me continue/i,
  /to be continued/i,
  /\.\.\.\s*$/,
  /I'll expand on/i,
];

export function aggregateResponses(sessionId: string): AggregationResult {
  const rawDir = getRawDir(sessionId);
  const files = readdirSync(rawDir)
    .filter((f) => f.endsWith('.md'))
    .sort();

  const manifest: ResponseManifestEntry[] = [];
  const sections: string[] = [];

  for (const filename of files) {
    const filePath = resolve(rawDir, filename);
    const content = readFileSync(filePath, 'utf-8');

    // Parse YAML frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    const frontmatter = fmMatch ? parseFrontmatter(fmMatch[1]) : {};
    const body = fmMatch ? content.slice(fmMatch[0].length).trim() : content.trim();

    const truncated = detectTruncation(body);

    const entry: ResponseManifestEntry = {
      filename,
      task_id: (frontmatter.task_id as string) ?? filename.replace('.md', ''),
      title: (frontmatter.title as string) ?? filename,
      target_model: (frontmatter.target_model as string) ?? 'unknown',
      truncated,
      char_count: body.length,
    };
    manifest.push(entry);

    sections.push(`\n---\n## Source: ${entry.title}\n**Model:** ${entry.target_model} | **File:** ${filename}${truncated ? ' | ⚠️ TRUNCATED' : ''}\n\n${body}`);
  }

  const aggregated_content = sections.join('\n');

  // Write manifest
  const sessionDir = getSessionDir(sessionId);
  writeFileSync(
    resolve(sessionDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  return {
    manifest,
    aggregated_content,
    total_chars: aggregated_content.length,
    truncated_count: manifest.filter((m) => m.truncated).length,
  };
}

function detectTruncation(text: string): boolean {
  // Check last 200 chars for truncation patterns
  const tail = text.slice(-200);
  return TRUNCATION_PATTERNS.some((pattern) => pattern.test(tail));
}

function parseFrontmatter(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const match = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
    if (match) {
      result[match[1]] = match[2];
    }
  }
  return result;
}
