import type { ResearchTask, LLMTarget, InjectPromptResponse } from '@aro/shared';
import type { ConnectionManager } from '../ws/connection-mgr.js';
import { writeResponse } from '../store/response-writer.js';
import { updateTask } from '../store/session-store.js';

export interface TaskResult {
  task_id: string;
  success: boolean;
  response_text?: string;
  response_file?: string;
  error?: string;
  duration_ms: number;
}

export async function runTask(
  sessionId: string,
  task: ResearchTask,
  target: LLMTarget,
  mgr: ConnectionManager,
  timeoutMs: number
): Promise<TaskResult> {
  // Mark task as running
  updateTask(sessionId, task.id, {
    status: 'running',
    started_at: new Date().toISOString(),
  });

  try {
    const response = await mgr.sendInjectPrompt(
      {
        payload: {
          task_id: task.id,
          target_id: target.id,
          url: target.url,
          prompt: task.prompt,
          selectors: target.selectors,
          quirks: target.quirks,
        },
      },
      timeoutMs
    );

    if (response.payload.success && response.payload.response_text) {
      // Write response to disk
      const filename = writeResponse(
        sessionId,
        task,
        response.payload.response_text,
        response.payload.duration_ms
      );

      updateTask(sessionId, task.id, {
        status: 'completed',
        response_file: filename,
        completed_at: new Date().toISOString(),
      });

      return {
        task_id: task.id,
        success: true,
        response_text: response.payload.response_text,
        response_file: filename,
        duration_ms: response.payload.duration_ms,
      };
    }

    // First attempt failed — retry once
    const retryResponse = await retryTask(task, target, mgr, timeoutMs);
    if (retryResponse) return retryResponse;

    // Both attempts failed
    const error = response.payload.error ?? 'No response captured';
    updateTask(sessionId, task.id, {
      status: 'failed',
      error,
      completed_at: new Date().toISOString(),
    });

    return {
      task_id: task.id,
      success: false,
      error,
      duration_ms: response.payload.duration_ms,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    updateTask(sessionId, task.id, {
      status: 'failed',
      error,
      completed_at: new Date().toISOString(),
    });

    return {
      task_id: task.id,
      success: false,
      error,
      duration_ms: 0,
    };
  }
}

async function retryTask(
  task: ResearchTask,
  target: LLMTarget,
  mgr: ConnectionManager,
  timeoutMs: number
): Promise<TaskResult | null> {
  try {
    // Wait before retry
    await new Promise((r) => setTimeout(r, 3000));

    const response = await mgr.sendInjectPrompt(
      {
        payload: {
          task_id: task.id,
          target_id: target.id,
          url: target.url,
          prompt: task.prompt,
          selectors: target.selectors,
          quirks: target.quirks,
        },
      },
      timeoutMs
    );

    if (response.payload.success && response.payload.response_text) {
      return {
        task_id: task.id,
        success: true,
        response_text: response.payload.response_text,
        duration_ms: response.payload.duration_ms,
      };
    }
  } catch {
    // Retry failed too
  }
  return null;
}
