import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const PLANNER_MODEL = 'claude-opus-4-6';

const ALL_LLM_TARGETS = [
  { id: 'claude', name: 'Claude', capabilities: ['reasoning', 'analysis', 'coding', 'writing', 'research'] },
  { id: 'chatgpt', name: 'ChatGPT', capabilities: ['reasoning', 'analysis', 'coding', 'writing', 'browsing'] },
  { id: 'gemini', name: 'Gemini', capabilities: ['reasoning', 'analysis', 'coding', 'multimodal', 'search'] },
  { id: 'perplexity', name: 'Perplexity', capabilities: ['research', 'search', 'citations', 'fact-checking'] },
  { id: 'kimi', name: 'Kimi K2.5', capabilities: ['reasoning', 'analysis', 'coding', 'writing', 'research'] },
  { id: 'manus', name: 'Manus 1.6 Max', capabilities: ['reasoning', 'analysis', 'agentic', 'browsing', 'coding'] },
];

const VALID_MODEL_IDS = ALL_LLM_TARGETS.map(t => t.id);

const MODEL_GUIDELINES: Record<string, string> = {
  perplexity: 'Use Perplexity for fact-finding, citation-heavy, and current-events tasks.',
  claude: 'Use Claude for deep analysis, reasoning, and synthesis tasks.',
  chatgpt: 'Use ChatGPT for broad knowledge, creative framing, and alternative perspectives.',
  gemini: 'Use Gemini for technical analysis, multimodal reasoning, and search-augmented tasks.',
  kimi: 'Use Kimi K2.5 for deep reasoning, complex analysis, and research tasks.',
  manus: 'Use Manus 1.6 Max for agentic tasks, complex browsing, and multi-step workflows.',
};

const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  prompt: z.string(),
  target_model: z.string(),
  dependencies: z.array(z.string()),
  priority: z.number(),
});

const PlanResponseSchema = z.object({
  topic: z.string(),
  strategy: z.string(),
  tasks: z.array(TaskSchema).min(1).max(30),
  synthesis_strategy: z.string(),
});

const ContextFileSchema = z.object({
  name: z.string(),
  content: z.string().max(51200),
});

function buildSystemPrompt(activeModels: typeof ALL_LLM_TARGETS): string {
  const targetDescriptions = activeModels
    .map((t) => `- **${t.name}** (id: "${t.id}"): Capabilities: ${t.capabilities.join(', ')}`)
    .join('\n');

  const guidelines = activeModels
    .map((m, i) => `${i + 3}. ${MODEL_GUIDELINES[m.id]}`)
    .filter(Boolean)
    .join('\n');

  const distributeNote = activeModels.length > 1
    ? `${activeModels.length + 3}. Distribute tasks across all available models — don't over-concentrate on one.`
    : '';

  return `You are a research planning AI. Your job is to decompose a research topic into a set of focused sub-tasks, each assigned to the most appropriate AI model.

## Available AI Models
${targetDescriptions}

## Guidelines
1. Create 5-20 sub-tasks that collectively provide comprehensive coverage of the topic.
2. Assign each task to the model best suited for it based on capabilities.
${guidelines}
${distributeNote}
${activeModels.length + 4}. Set dependencies where one task's output informs another (use task IDs).
${activeModels.length + 5}. Assign priority 1 (highest) to foundational/prerequisite tasks, higher numbers for dependent tasks.

## Output Format
Each task prompt MUST instruct the model to respond using this template:

\`\`\`
## Key Findings
- [Numbered list of main findings]

## Evidence & Sources
- [Supporting evidence, data points, citations where available]

## Confidence Assessment
- High/Medium/Low confidence per finding with reasoning

## Knowledge Gaps
- [What couldn't be determined, areas needing further research]
\`\`\`

## Response Format
Respond with ONLY a JSON object matching this exact schema (no markdown fences):
{
  "topic": "the research topic",
  "strategy": "brief description of the research strategy",
  "tasks": [
    {
      "id": "task-1",
      "title": "short descriptive title",
      "prompt": "the full prompt to send to the model (MUST include output format template above)",
      "target_model": "model id from the list above",
      "dependencies": [],
      "priority": 1
    }
  ],
  "synthesis_strategy": "description of how to synthesize the results"
}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const topic = body.topic;
    const objective = body.objective;
    const selectedModels: string[] | undefined = body.selectedModels;
    const contextFiles = body.context_files;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Validate selectedModels
    let activeModels = ALL_LLM_TARGETS;
    if (selectedModels && Array.isArray(selectedModels)) {
      const valid = selectedModels.filter(id => VALID_MODEL_IDS.includes(id));
      if (valid.length === 0) {
        return NextResponse.json({ error: 'At least one valid model must be selected' }, { status: 400 });
      }
      activeModels = ALL_LLM_TARGETS.filter(t => valid.includes(t.id));
    }

    // Validate context files
    let parsedFiles: { name: string; content: string }[] = [];
    if (contextFiles) {
      const filesResult = z.array(ContextFileSchema).max(5).safeParse(contextFiles);
      if (!filesResult.success) {
        return NextResponse.json({ error: 'Invalid context files', issues: filesResult.error.issues }, { status: 400 });
      }
      parsedFiles = filesResult.data;
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured on server' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    // Build user message
    let userMessage = `Research topic: ${topic.trim()}`;
    if (objective && typeof objective === 'string' && objective.trim()) {
      userMessage += `\n\nResearch objective: ${objective.trim()}`;
    }
    if (parsedFiles.length > 0) {
      userMessage += '\n\n## Additional Context Files\n';
      for (const file of parsedFiles) {
        userMessage += `\n### File: ${file.name}\n\`\`\`\n${file.content}\n\`\`\`\n`;
      }
      userMessage += '\nUse the above files as additional context when decomposing the research plan.\n';
    }
    userMessage += '\n\nDecompose this into a comprehensive research plan with sub-tasks assigned to the most appropriate AI models. Ensure each task prompt includes the standardized output format template.';

    const response = await client.messages.create({
      model: PLANNER_MODEL,
      max_tokens: 8192,
      system: buildSystemPrompt(activeModels),
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No text response from planner model' }, { status: 502 });
    }

    // Extract JSON
    let jsonStr = textBlock.text.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    let raw: unknown;
    try {
      raw = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse plan as JSON', raw_text: jsonStr.slice(0, 1500) },
        { status: 502 }
      );
    }

    // Validate
    const parsed = PlanResponseSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Plan validation failed', issues: parsed.error.issues },
        { status: 502 }
      );
    }

    // Add status to tasks
    const plan = {
      ...parsed.data,
      created_at: new Date().toISOString(),
      tasks: parsed.data.tasks.map((t) => ({ ...t, status: 'pending' as const })),
    };

    return NextResponse.json({ plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
