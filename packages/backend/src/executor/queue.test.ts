import { describe, it, expect } from 'vitest';
import { ProviderQueue } from './queue.js';

describe('ProviderQueue', () => {
  it('executes tasks sequentially', async () => {
    const order: string[] = [];
    const queue = new ProviderQueue<string>(0);

    queue.add({
      id: 'a',
      execute: async () => {
        order.push('a');
        return 'result-a';
      },
    });
    queue.add({
      id: 'b',
      execute: async () => {
        order.push('b');
        return 'result-b';
      },
    });

    const results = await queue.run();
    expect(order).toEqual(['a', 'b']);
    expect(results.get('a')?.success).toBe(true);
    expect(results.get('a')?.result).toBe('result-a');
    expect(results.get('b')?.success).toBe(true);
  });

  it('handles task failures without stopping', async () => {
    const queue = new ProviderQueue<string>(0);

    queue.add({
      id: 'a',
      execute: async () => {
        throw new Error('fail');
      },
    });
    queue.add({
      id: 'b',
      execute: async () => 'ok',
    });

    const results = await queue.run();
    expect(results.get('a')?.success).toBe(false);
    expect(results.get('a')?.error?.message).toBe('fail');
    expect(results.get('b')?.success).toBe(true);
  });

  it('respects rate limiting', async () => {
    const timestamps: number[] = [];
    const queue = new ProviderQueue<void>(100);

    queue.add({
      id: 'a',
      execute: async () => { timestamps.push(Date.now()); },
    });
    queue.add({
      id: 'b',
      execute: async () => { timestamps.push(Date.now()); },
    });

    await queue.run();
    expect(timestamps.length).toBe(2);
    expect(timestamps[1] - timestamps[0]).toBeGreaterThanOrEqual(90); // allow small timing variance
  });

  it('calls onComplete and onError handlers', async () => {
    const completed: string[] = [];
    const errors: string[] = [];
    const queue = new ProviderQueue<string>(0);

    queue.setOnComplete((id) => completed.push(id));
    queue.setOnError((id) => errors.push(id));

    queue.add({ id: 'ok', execute: async () => 'success' });
    queue.add({ id: 'fail', execute: async () => { throw new Error('boom'); } });

    await queue.run();
    expect(completed).toEqual(['ok']);
    expect(errors).toEqual(['fail']);
  });
});
