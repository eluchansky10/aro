import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import {
  SessionSchema,
  type Session,
  type ResearchPlan,
  type SessionStatus,
  type ResearchTask,
  RESEARCH_DIR,
  RAW_RESPONSES_DIR,
  OUTPUT_DIR,
  SESSION_FILE,
} from '@aro/shared';
import { getProjectRoot } from './config-store.js';

function getResearchDir(): string {
  return resolve(getProjectRoot(), RESEARCH_DIR);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function generateSessionId(topic: string): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const slug = slugify(topic);
  return `${date}-${time}-${slug}`;
}

function sessionDir(sessionId: string): string {
  return resolve(getResearchDir(), sessionId);
}

function sessionFilePath(sessionId: string): string {
  return resolve(sessionDir(sessionId), SESSION_FILE);
}

export function createSession(plan: ResearchPlan): Session {
  const id = generateSessionId(plan.topic);
  const now = new Date().toISOString();

  const session: Session = {
    id,
    plan,
    status: 'approved',
    created_at: now,
    updated_at: now,
  };

  // Create directory structure
  const dir = sessionDir(id);
  mkdirSync(resolve(dir, RAW_RESPONSES_DIR), { recursive: true });
  mkdirSync(resolve(dir, OUTPUT_DIR), { recursive: true });

  // Write session file
  writeFileSync(sessionFilePath(id), JSON.stringify(session, null, 2));

  return session;
}

export function getSession(sessionId: string): Session {
  const filePath = sessionFilePath(sessionId);
  if (!existsSync(filePath)) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  const raw = JSON.parse(readFileSync(filePath, 'utf-8'));
  return SessionSchema.parse(raw);
}

export function updateSession(
  sessionId: string,
  updates: Partial<Pick<Session, 'status' | 'completed_at'>>
): Session {
  const session = getSession(sessionId);
  Object.assign(session, updates, { updated_at: new Date().toISOString() });
  writeFileSync(sessionFilePath(sessionId), JSON.stringify(session, null, 2));
  return session;
}

export function updateTask(
  sessionId: string,
  taskId: string,
  updates: Partial<ResearchTask>
): Session {
  const session = getSession(sessionId);
  const task = session.plan.tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`Task "${taskId}" not found in session "${sessionId}"`);
  }
  Object.assign(task, updates);
  session.updated_at = new Date().toISOString();
  writeFileSync(sessionFilePath(sessionId), JSON.stringify(session, null, 2));
  return session;
}

export function getLatestSession(): Session | null {
  const researchDir = getResearchDir();
  if (!existsSync(researchDir)) return null;

  const dirs = readdirSync(researchDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse();

  for (const dir of dirs) {
    const fp = resolve(researchDir, dir, SESSION_FILE);
    if (existsSync(fp)) {
      try {
        return getSession(dir);
      } catch {
        continue;
      }
    }
  }
  return null;
}

export function listSessions(): Session[] {
  const researchDir = getResearchDir();
  if (!existsSync(researchDir)) return [];

  const dirs = readdirSync(researchDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
    .reverse();

  const sessions: Session[] = [];
  for (const dir of dirs) {
    try {
      sessions.push(getSession(dir));
    } catch {
      // skip invalid sessions
    }
  }
  return sessions;
}

export function getSessionDir(sessionId: string): string {
  return sessionDir(sessionId);
}

export function getRawDir(sessionId: string): string {
  return resolve(sessionDir(sessionId), RAW_RESPONSES_DIR);
}

export function getOutputDir(sessionId: string): string {
  return resolve(sessionDir(sessionId), OUTPUT_DIR);
}
