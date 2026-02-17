import { z } from 'zod';

// --- LLM Target schemas ---

export const LLMSelectorsSchema = z.object({
  input: z.string(),
  submit: z.string(),
  response: z.string(),
  streaming_indicator: z.string().optional(),
  done_indicator: z.string().optional(),
});

export const LLMQuirksSchema = z.object({
  input_type: z.enum(['textarea', 'contenteditable', 'prosemirror', 'quill']),
  needs_native_setter: z.boolean().optional(),
  needs_exec_command: z.boolean().optional(),
  streaming_attr: z.string().optional(),
  stability_timeout_ms: z.number().optional(),
});

export const LLMTargetSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url(),
  capabilities: z.array(z.string()),
  selectors: LLMSelectorsSchema,
  quirks: LLMQuirksSchema,
  rate_limit_ms: z.number().min(0),
});

// --- Research task/plan schemas ---

export const TaskStatusSchema = z.enum(['pending', 'queued', 'running', 'completed', 'failed', 'skipped']);

export const ResearchTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string(),
  target_model: z.string(),
  dependencies: z.array(z.string()),
  priority: z.number().int().min(1),
  status: TaskStatusSchema,
  response_file: z.string().optional(),
  error: z.string().optional(),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
});

export const ResearchPlanSchema = z.object({
  topic: z.string().min(1),
  strategy: z.string().min(1),
  tasks: z.array(ResearchTaskSchema).min(1).max(30),
  synthesis_strategy: z.string().min(1),
  created_at: z.string(),
});

export const SessionStatusSchema = z.enum([
  'planning', 'approved', 'executing', 'executed', 'synthesizing', 'completed', 'failed',
]);

export const SessionSchema = z.object({
  id: z.string(),
  plan: ResearchPlanSchema,
  status: SessionStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().optional(),
});

// --- Config schemas ---

export const LLMTargetsConfigSchema = z.object({
  targets: z.array(LLMTargetSchema).min(1),
});

export const SettingsSchema = z.object({
  ws_port: z.number().int().min(1024).max(65535),
  api_key_env_var: z.string(),
  max_concurrent_providers: z.number().int().min(1).max(10),
  task_timeout_ms: z.number().int().min(10000),
  default_stability_timeout_ms: z.number().int().min(1000),
});

// --- Health check schemas ---

export const HealthResultSchema = z.object({
  target_id: z.string(),
  status: z.enum(['healthy', 'degraded', 'broken']),
  selectors_found: z.record(z.string(), z.boolean()),
  checked_at: z.string(),
  error: z.string().optional(),
});

export const HealthLogSchema = z.object({
  results: z.array(HealthResultSchema),
  last_run: z.string(),
});

// --- WebSocket message schemas ---

export const InjectPromptRequestSchema = z.object({
  id: z.string(),
  type: z.literal('inject_prompt'),
  payload: z.object({
    task_id: z.string(),
    target_id: z.string(),
    url: z.string(),
    prompt: z.string(),
    selectors: LLMSelectorsSchema,
    quirks: LLMQuirksSchema,
  }),
});

export const InjectPromptResponseSchema = z.object({
  id: z.string(),
  type: z.literal('inject_prompt_response'),
  payload: z.object({
    task_id: z.string(),
    success: z.boolean(),
    response_text: z.string().optional(),
    error: z.string().optional(),
    duration_ms: z.number(),
  }),
});

export const HealthCheckRequestSchema = z.object({
  id: z.string(),
  type: z.literal('health_check'),
  payload: z.object({
    target_id: z.string(),
    url: z.string(),
    selectors: z.record(z.string(), z.string()),
  }),
});

export const HealthCheckResponseSchema = z.object({
  id: z.string(),
  type: z.literal('health_check_response'),
  payload: z.object({
    target_id: z.string(),
    selectors_found: z.record(z.string(), z.boolean()),
    error: z.string().optional(),
  }),
});
