import type { Session } from '@aro/shared';
import type { AggregationResult } from './aggregator.js';

const APPROX_CHARS_PER_TOKEN = 4;
const MAX_SINGLE_PASS_TOKENS = 100_000;

export interface SynthesisPrompt {
  prompt: string;
  estimated_tokens: number;
  needs_multi_pass: boolean;
}

export function generateSynthesisPrompt(
  session: Session,
  aggregation: AggregationResult
): SynthesisPrompt {
  const estimatedTokens = Math.ceil(aggregation.total_chars / APPROX_CHARS_PER_TOKEN);
  const needsMultiPass = estimatedTokens > MAX_SINGLE_PASS_TOKENS;

  const sourceList = aggregation.manifest
    .map(
      (m) =>
        `- **${m.title}** (${m.target_model}, ${m.char_count} chars)${m.truncated ? ' ⚠️ truncated' : ''}`
    )
    .join('\n');

  const truncationWarning =
    aggregation.truncated_count > 0
      ? `\n⚠️ ${aggregation.truncated_count} response(s) appear truncated. Note potential gaps.\n`
      : '';

  const prompt = `# Research Synthesis Task

## Topic
${session.plan.topic}

## Research Strategy
${session.plan.strategy}

## Synthesis Strategy
${session.plan.synthesis_strategy}

## Sources
${sourceList}
${truncationWarning}
## Instructions

You are synthesizing research from ${aggregation.manifest.length} AI model responses into a comprehensive knowledge base. Follow these steps:

### 1. Claim Extraction
For each source response below, extract all factual claims, key findings, and insights. Tag each with its source model.

### 2. Cross-Source Triangulation
Identify claims that appear across multiple sources. Claims supported by 3+ sources get HIGH confidence. Claims from 1 source get LOW confidence.

### 3. Contradiction Detection
Flag any contradictions between sources. For each contradiction:
- State the conflicting claims
- Note which sources support each side
- Provide your assessment of which is more likely correct and why

### 4. Gap Analysis
Identify topics or questions that were asked but not adequately answered by any source.

## Output Structure

Generate the following files as clearly delimited sections:

### EXECUTIVE-SUMMARY.md
A 500-1000 word executive summary of the research findings. Lead with the highest-confidence, most actionable insights.

### KNOWLEDGE-BASE.md
Comprehensive structured knowledge base organized by theme/topic:
- Each section should synthesize across sources, not just list responses
- Include confidence levels (HIGH/MEDIUM/LOW) for key claims
- Cite source models for attribution
- Use clear headers and bullet points

### CONTRADICTIONS.md
All detected contradictions with analysis.

### GAPS-REPORT.md
Knowledge gaps and recommended follow-up research.

### CONTEXT-PACKAGE.md
A "context package" — a concise summary designed to be copy-pasted as context for future AI conversations on this topic. Should contain the essential facts, key insights, and important caveats in a dense, information-rich format.

---

## Aggregated Research Responses

${aggregation.aggregated_content}`;

  return {
    prompt,
    estimated_tokens: estimatedTokens,
    needs_multi_pass: needsMultiPass,
  };
}
