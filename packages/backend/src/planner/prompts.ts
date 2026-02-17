import type { LLMTarget } from '@aro/shared';

export function buildSystemPrompt(targets: LLMTarget[]): string {
  const targetDescriptions = targets
    .map(
      (t) =>
        `- **${t.name}** (id: "${t.id}"): Capabilities: ${t.capabilities.join(', ')}`
    )
    .join('\n');

  return `You are a research planning AI. Your job is to decompose a research topic into a set of focused sub-tasks, each assigned to the most appropriate AI model.

## Available AI Models
${targetDescriptions}

## Guidelines
1. Create 5-20 sub-tasks that collectively provide comprehensive coverage of the topic.
2. Assign each task to the model best suited for it based on capabilities.
3. Use Perplexity for fact-finding, citation-heavy, and current-events tasks.
4. Use Claude for deep analysis, reasoning, and synthesis tasks.
5. Use ChatGPT for broad knowledge, creative framing, and alternative perspectives.
6. Use Gemini for technical analysis, multimodal reasoning, and search-augmented tasks.
7. Distribute tasks across all available models — don't over-concentrate on one.
8. Set dependencies where one task's output informs another (use task IDs).
9. Assign priority 1 (highest) to foundational/prerequisite tasks, higher numbers for dependent tasks.

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

export function buildUserPrompt(topic: string): string {
  return `Research topic: ${topic}

Decompose this into a comprehensive research plan with sub-tasks assigned to the most appropriate AI models. Ensure each task prompt includes the standardized output format template.`;
}
