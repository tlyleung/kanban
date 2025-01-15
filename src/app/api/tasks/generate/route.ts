import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

export async function POST(req: Request) {
  const { taskText, apiKey } = await req.json();
  const anthropic = createAnthropic({ apiKey });
  const { object } = await generateObject({
    model: anthropic('claude-3-5-haiku-20241022'),
    output: 'array',
    schema: z.string(),
    prompt: `Break this task down into subtasks: ${taskText}`,
  });

  return NextResponse.json(object);
}
