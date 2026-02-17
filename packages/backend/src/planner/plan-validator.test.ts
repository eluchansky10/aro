import { describe, it, expect } from 'vitest';
import { validatePlan, PlanValidationError } from './plan-validator.js';
import type { LLMTarget } from '@aro/shared';

const mockTargets: LLMTarget[] = [
  {
    id: 'claude',
    name: 'Claude',
    url: 'https://claude.ai/new',
    capabilities: ['reasoning'],
    selectors: { input: '.input', submit: '.submit', response: '.response' },
    quirks: { input_type: 'prosemirror' },
    rate_limit_ms: 3000,
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chatgpt.com',
    capabilities: ['reasoning'],
    selectors: { input: '.input', submit: '.submit', response: '.response' },
    quirks: { input_type: 'contenteditable' },
    rate_limit_ms: 3000,
  },
];

function makePlan(overrides?: Record<string, unknown>) {
  return {
    topic: 'Test topic',
    strategy: 'Test strategy',
    synthesis_strategy: 'Test synthesis',
    created_at: new Date().toISOString(),
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
    ...overrides,
  };
}

describe('plan-validator', () => {
  it('validates a correct plan', () => {
    const plan = validatePlan(makePlan(), mockTargets);
    expect(plan.topic).toBe('Test topic');
    expect(plan.tasks).toHaveLength(2);
  });

  it('rejects unknown target model', () => {
    const data = makePlan({
      tasks: [
        {
          id: 'task-1',
          title: 'Test',
          prompt: 'Test',
          target_model: 'unknown-model',
          dependencies: [],
          priority: 1,
          status: 'pending',
        },
      ],
    });
    expect(() => validatePlan(data, mockTargets)).toThrow(PlanValidationError);
  });

  it('rejects unknown dependency', () => {
    const data = makePlan({
      tasks: [
        {
          id: 'task-1',
          title: 'Test',
          prompt: 'Test',
          target_model: 'claude',
          dependencies: ['nonexistent'],
          priority: 1,
          status: 'pending',
        },
      ],
    });
    expect(() => validatePlan(data, mockTargets)).toThrow(PlanValidationError);
  });

  it('rejects self-dependency', () => {
    const data = makePlan({
      tasks: [
        {
          id: 'task-1',
          title: 'Test',
          prompt: 'Test',
          target_model: 'claude',
          dependencies: ['task-1'],
          priority: 1,
          status: 'pending',
        },
      ],
    });
    expect(() => validatePlan(data, mockTargets)).toThrow(PlanValidationError);
  });

  it('rejects circular dependencies', () => {
    const data = makePlan({
      tasks: [
        {
          id: 'task-1',
          title: 'Test A',
          prompt: 'Test',
          target_model: 'claude',
          dependencies: ['task-2'],
          priority: 1,
          status: 'pending',
        },
        {
          id: 'task-2',
          title: 'Test B',
          prompt: 'Test',
          target_model: 'chatgpt',
          dependencies: ['task-1'],
          priority: 2,
          status: 'pending',
        },
      ],
    });
    expect(() => validatePlan(data, mockTargets)).toThrow(PlanValidationError);
  });

  it('rejects empty topic', () => {
    expect(() => validatePlan(makePlan({ topic: '' }), mockTargets)).toThrow();
  });
});
