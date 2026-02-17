/**
 * Per-provider async queue with rate limiting.
 * Tasks are executed sequentially within a queue with configurable delay between tasks.
 */

export interface QueueTask<T> {
  id: string;
  execute: () => Promise<T>;
}

export class ProviderQueue<T> {
  private queue: QueueTask<T>[] = [];
  private running = false;
  private rateLimitMs: number;
  private results = new Map<string, { success: boolean; result?: T; error?: Error }>();
  private onComplete?: (taskId: string, result: T) => void;
  private onError?: (taskId: string, error: Error) => void;

  constructor(rateLimitMs: number) {
    this.rateLimitMs = rateLimitMs;
  }

  add(task: QueueTask<T>) {
    this.queue.push(task);
  }

  setOnComplete(handler: (taskId: string, result: T) => void) {
    this.onComplete = handler;
  }

  setOnError(handler: (taskId: string, error: Error) => void) {
    this.onError = handler;
  }

  async run(): Promise<Map<string, { success: boolean; result?: T; error?: Error }>> {
    this.running = true;

    for (let i = 0; i < this.queue.length; i++) {
      if (!this.running) break;

      const task = this.queue[i];

      // Rate limit delay (except for first task)
      if (i > 0) {
        await sleep(this.rateLimitMs);
      }

      try {
        const result = await task.execute();
        this.results.set(task.id, { success: true, result });
        this.onComplete?.(task.id, result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        this.results.set(task.id, { success: false, error });
        this.onError?.(task.id, error);
      }
    }

    this.running = false;
    return this.results;
  }

  stop() {
    this.running = false;
  }

  get size(): number {
    return this.queue.length;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
