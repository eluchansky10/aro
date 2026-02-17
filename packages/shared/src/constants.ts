/** Default WebSocket port */
export const DEFAULT_WS_PORT = 7749;

/** WebSocket path */
export const WS_PATH = '/ws';

/** Research output directory (relative to project root) */
export const RESEARCH_DIR = 'research';

/** Config directory (relative to project root) */
export const CONFIG_DIR = 'config';

/** Config file names */
export const LLM_TARGETS_FILE = 'llm-targets.json';
export const SETTINGS_FILE = 'settings.json';
export const HEALTH_LOG_FILE = 'health-log.json';

/** Session subdirectories */
export const RAW_RESPONSES_DIR = 'raw';
export const OUTPUT_DIR = 'output';
export const SESSION_FILE = 'session.json';

/** Keepalive interval for service worker (ms) */
export const KEEPALIVE_INTERVAL_MS = 25_000;

/** Reconnect backoff settings */
export const RECONNECT_BASE_MS = 1000;
export const RECONNECT_MAX_MS = 30_000;

/** Default task timeout (ms) */
export const DEFAULT_TASK_TIMEOUT_MS = 300_000; // 5 minutes

/** Default stability timeout (ms) — no DOM changes = response complete */
export const DEFAULT_STABILITY_TIMEOUT_MS = 5000;

/** Planner model */
export const PLANNER_MODEL = 'claude-opus-4-6';

/** Max tasks in a plan */
export const MAX_PLAN_TASKS = 30;
export const MIN_PLAN_TASKS = 1;
