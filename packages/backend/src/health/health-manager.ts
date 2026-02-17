import { writeFileSync, existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { LLMTarget, HealthResult } from '@aro/shared';
import { HEALTH_LOG_FILE } from '@aro/shared';
import { loadTargets, getProjectRoot } from '../store/config-store.js';
import type { ConnectionManager } from '../ws/connection-mgr.js';

export interface HealthLog {
  results: HealthResult[];
  last_run: string;
}

function getHealthLogPath(): string {
  return resolve(getProjectRoot(), 'config', HEALTH_LOG_FILE);
}

export async function runHealthChecks(mgr: ConnectionManager): Promise<HealthResult[]> {
  if (!mgr.isConnected()) {
    throw new Error('Extension not connected. Start the backend server and ensure the Chrome extension is loaded.');
  }

  const targets = loadTargets();
  const results: HealthResult[] = [];

  for (const target of targets) {
    const result = await checkTarget(mgr, target);
    results.push(result);
  }

  // Save results
  const log: HealthLog = {
    results,
    last_run: new Date().toISOString(),
  };
  writeFileSync(getHealthLogPath(), JSON.stringify(log, null, 2));

  return results;
}

async function checkTarget(mgr: ConnectionManager, target: LLMTarget): Promise<HealthResult> {
  try {
    const selectors: Record<string, string> = {
      input: target.selectors.input,
      submit: target.selectors.submit,
      response: target.selectors.response,
    };
    if (target.selectors.streaming_indicator) {
      selectors.streaming_indicator = target.selectors.streaming_indicator;
    }

    const response = await mgr.sendHealthCheck({
      payload: {
        target_id: target.id,
        url: target.url,
        selectors,
      },
    });

    const found = response.payload.selectors_found;
    const allRequired = found.input && found.submit;
    const hasResponse = found.response;

    let status: HealthResult['status'];
    if (allRequired && hasResponse) {
      status = 'healthy';
    } else if (allRequired) {
      status = 'degraded';
    } else {
      status = 'broken';
    }

    return {
      target_id: target.id,
      status,
      selectors_found: found,
      checked_at: new Date().toISOString(),
      error: response.payload.error,
    };
  } catch (err) {
    return {
      target_id: target.id,
      status: 'broken',
      selectors_found: {},
      checked_at: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function getLastHealthLog(): HealthLog | null {
  const path = getHealthLogPath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}
