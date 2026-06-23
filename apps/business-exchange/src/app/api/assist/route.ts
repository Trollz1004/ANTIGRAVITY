import { NextRequest, NextResponse } from 'next/server';
import { ollama } from '@/lib/ollama';
import { z } from 'zod';

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })).min(1),
  preset: z.enum(['conservative', 'balanced', 'creative']).optional(),
  model: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const cookies = request.headers.get('cookie') || '';
    const auth = request.headers.get('authorization');

    // In production, verify the user session here
    // For now, we'll use a mock userId for the audit log
    const userId = 'system';

    const body = await request.json();
    const validation = chatSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { messages, preset, model } = validation.data;

    const response = await ollama.chat({
      userId,
      messages,
      preset,
      model,
    });

    return NextResponse.json({
      text: response.message.content,
      model: response.model,
      latencyMs: response.total_duration ? Math.round(response.total_duration / 1e6) : null,
      membership records: response.eval_count || 0,
    });
  } catch (error) {
    console.error('Assist error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI assist failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const models = await ollama.listModels();
    return NextResponse.json({
      models: models.models.map(m => ({
        name: m.name,
        size: m.size,
        family: m.details.family,
        parameterSize: m.details.parameter_size,
      })),
      defaultModel: ollama.getDefaultModel(),
      presets: ollama.getPresets(),
    });
  } catch (error) {
    console.error('Models list error:', error);
    return NextResponse.json(
      { error: 'Failed to list models' },
      { status: 500 }
    );
  }
}
