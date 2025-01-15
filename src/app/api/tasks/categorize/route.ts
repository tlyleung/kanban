import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { listNames, taskText, apiKey } = await req.json();
  const anthropic = createAnthropic({ apiKey });
  const { object } = await generateObject({
    model: anthropic('claude-3-5-haiku-20241022'),
    output: 'enum',
    enum: listNames,
    prompt: `Categorize the task, ${taskText}, into one of the following lists: ${listNames.join(', ')}.`,
  });

  return NextResponse.json(object);
}
