import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  LLMTargetsConfigSchema,
  SettingsSchema,
  type LLMTarget,
} from '@aro/shared';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..', '..', '..');
const CONFIG_DIR = resolve(PROJECT_ROOT, 'config');

export interface Settings {
  ws_port: number;
  api_key_env_var: string;
  max_concurrent_providers: number;
  task_timeout_ms: number;
  default_stability_timeout_ms: number;
}

function readJson(filePath: string): unknown {
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export function getProjectRoot(): string {
  return PROJECT_ROOT;
}

export function loadTargets(): LLMTarget[] {
  const data = readJson(resolve(CONFIG_DIR, 'llm-targets.json'));
  const parsed = LLMTargetsConfigSchema.parse(data);
  return parsed.targets;
}

export function loadSettings(): Settings {
  const data = readJson(resolve(CONFIG_DIR, 'settings.json'));
  return SettingsSchema.parse(data);
}

export function getApiKey(settings?: Settings): string {
  const s = settings ?? loadSettings();
  const key = process.env[s.api_key_env_var];
  if (!key) {
    throw new Error(
      `Missing API key: set the ${s.api_key_env_var} environment variable`
    );
  }
  return key;
}

export function getTarget(targetId: string): LLMTarget {
  const targets = loadTargets();
  const target = targets.find((t) => t.id === targetId);
  if (!target) {
    throw new Error(
      `Unknown target "${targetId}". Available: ${targets.map((t) => t.id).join(', ')}`
    );
  }
  return target;
}
