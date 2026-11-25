import { NextResponse } from 'next/server';
import { generateScript, refineScript } from '@/lib/ollama';
import type { GenerationResponse } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, context, script, isRefinement = false } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        {
          error: 'Prompt is required and cannot be empty',
          isError: true,
        },
        { status: 400 }
      );
    }

    let result: GenerationResponse;

    if (isRefinement && script) {
      if (typeof script !== 'string' || !script.trim()) {
        return NextResponse.json(
          {
            error: 'Valid script is required for refinement',
            isError: true,
          },
          { status: 400 }
        );
      }
      result = await refineScript(script, prompt);
    } else {
      result = await generateScript(prompt, context);
    }

    return NextResponse.json({
      title: result.title,
      code: result.code,
      steps: result.steps,
      explanation: result.explanation,
    });
  } catch (error: any) {
    console.error('Generation API error:', error);

    const status = error.message?.includes('Ollama') || error.message?.includes('connect')
      ? 503
      : 500;

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate automation script',
        isError: true,
        suggestion: error.message?.includes('Ollama')
          ? 'Make sure Ollama is running with a capable model (e.g. ollama serve && ollama pull llama3.1)'
          : undefined,
      },
      { status }
    );
  }
}
