import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { MANUAL_CONTENT } from '../../manual/manual-content';

const MANUAL_CHAT_MODEL = 'claude-sonnet-4-5-20250929';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Messages array is required', { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response('ANTHROPIC_API_KEY not configured', { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    const stream = client.messages.stream({
      model: MANUAL_CHAT_MODEL,
      max_tokens: 2048,
      system: `You are the ARO (Automated Research Orchestrator) help assistant. Answer questions about how to use ARO based on the user manual below. Be concise, helpful, and friendly. If a question is not covered by the manual, say so honestly.\n\n${MANUAL_CONTENT}`,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const eventStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(eventStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(message, { status: 500 });
  }
}
