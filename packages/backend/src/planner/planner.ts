import Anthropic from '@anthropic-ai/sdk';
import { PLANNER_MODEL, type ResearchPlan } from '@aro/shared';
import { loadTargets, getApiKey, loadSettings } from '../store/config-store.js';
import { buildSystemPrompt, buildUserPrompt } from './prompts.js';
import { validatePlan } from './plan-validator.js';

export async function generatePlan(topic: string): Promise<ResearchPlan> {
  const settings = loadSettings();
  const apiKey = getApiKey(settings);
  const targets = loadTargets();

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: PLANNER_MODEL,
    max_tokens: 8192,
    system: buildSystemPrompt(targets),
    messages: [
      { role: 'user', content: buildUserPrompt(topic) },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from planner model');
  }

  // Extract JSON from the response (handle possible markdown fences)
  let jsonStr = textBlock.text.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  let raw: unknown;
  try {
    raw = JSON.parse(jsonStr);
  } catch {
    throw new Error(`Failed to parse planner response as JSON:\n${jsonStr.slice(0, 500)}`);
  }

  // Add status field to each task and created_at
  const planData = raw as Record<string, unknown>;
  const tasks = planData.tasks as Array<Record<string, unknown>>;
  for (const task of tasks) {
    task.status = 'pending';
  }
  planData.created_at = new Date().toISOString();

  // Validate
  const plan = validatePlan(planData, targets);
  return plan;
}
