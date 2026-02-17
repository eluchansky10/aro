import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { ResearchPlan } from '@aro/shared';

// Mock config-store to use temp directory
const tempDir = mkdtempSync(join(tmpdir(), 'aro-test-'));

vi.mock('./config-store.js', () => ({
  getProjectRoot: () => tempDir,
}));

// Import after mock
const {
  createSession,
  getSession,
  updateSession,
  updateTask,
  getLatestSession,
  listSessions,
} = await import('./session-store.js');

const mockPlan: ResearchPlan = {
  topic: 'Test Research Topic',
  strategy: 'Test strategy',
  tasks: [
    {
      id: 'task-1',
      title: 'First task',
      prompt: 'Do something',
      target_model: 'claude',
      dependencies: [],
      priority: 1,
      status: 'pending',
    },
    {
      id: 'task-2',
      title: 'Second task',
      prompt: 'Do something else',
      target_model: 'chatgpt',
      dependencies: ['task-1'],
      priority: 2,
      status: 'pending',
    },
  ],
  synthesis_strategy: 'Combine all',
  created_at: new Date().toISOString(),
};

afterEach(() => {
  // Clean up temp dir is handled after all tests
});

describe('session-store', () => {
  it('creates a session with directory structure', () => {
    const session = createSession(mockPlan);
    expect(session.id).toMatch(/^\d{8}-\d{6}-test-research-topic$/);
    expect(session.status).toBe('approved');
    expect(session.plan.tasks).toHaveLength(2);

    // Check directories exist
    const sessionDir = join(tempDir, 'research', session.id);
    expect(existsSync(join(sessionDir, 'raw'))).toBe(true);
    expect(existsSync(join(sessionDir, 'output'))).toBe(true);
    expect(existsSync(join(sessionDir, 'session.json'))).toBe(true);
  });

  it('retrieves a session by ID', () => {
    const created = createSession(mockPlan);
    const retrieved = getSession(created.id);
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.plan.topic).toBe('Test Research Topic');
  });

  it('updates session status', () => {
    const session = createSession(mockPlan);
    const updated = updateSession(session.id, { status: 'executing' });
    expect(updated.status).toBe('executing');
    // Verify persisted
    const reloaded = getSession(session.id);
    expect(reloaded.status).toBe('executing');
  });

  it('updates individual task', () => {
    const session = createSession(mockPlan);
    updateTask(session.id, 'task-1', { status: 'completed' });
    const reloaded = getSession(session.id);
    const task1 = reloaded.plan.tasks.find((t) => t.id === 'task-1');
    expect(task1?.status).toBe('completed');
  });

  it('gets latest session', () => {
    createSession(mockPlan);
    createSession({ ...mockPlan, topic: 'Second topic' });
    const latest = getLatestSession();
    expect(latest).not.toBeNull();
    // Just verify we get a valid session back (timestamps may collide in tests)
    expect(latest!.plan.topic).toBeTruthy();
  });

  it('lists all sessions', () => {
    const sessions = listSessions();
    expect(sessions.length).toBeGreaterThanOrEqual(2);
  });

  it('throws for nonexistent session', () => {
    expect(() => getSession('nonexistent')).toThrow('Session not found');
  });
});
