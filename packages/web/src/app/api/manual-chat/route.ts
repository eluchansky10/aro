import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { MANUAL_CONTENT } from '../../manual/manual-content';

const MANUAL_CHAT_MODEL = 'claude-sonnet-4-5-20250929';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: MANUAL_CHAT_MODEL,
      max_tokens: 2048,
      system: `You are the ARO (Automated Research Orchestrator) help assistant. Answer questions about how to use ARO based on the user manual below. Be concise, helpful, and friendly. If a question is not covered by the manual, say so honestly.\n\n${MANUAL_CONTENT}`,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : 'No response generated.';

    return NextResponse.json({ content: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
