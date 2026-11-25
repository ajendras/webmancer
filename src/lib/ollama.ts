/**
 * Ollama client for Webmancer.
 * Handles generation and refinement of Playwright scripts using local LLMs.
 * Enforces structured JSON output, validates responses, and provides
 * helpful error messages for common local setup issues.
 */

import ollama from 'ollama';
import {
  getSystemPrompt,
  buildGenerationPrompt,
  buildRefinementPrompt,
  createPrompt,
} from './prompts';
import type {
  GenerationResponse,
  OllamaGenerationOptions,
  SimulationStep,
} from '@/types';

const DEFAULT_MODEL = 'llama3.1';
const DEFAULT_TEMPERATURE = 0.15;
const DEFAULT_NUM_CTX = 16384;

/**
 * Validates that the parsed LLM response matches our expected schema.
 * Throws descriptive errors for missing fields.
 */
function validateGenerationResponse(data: any): GenerationResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('LLM response was not a valid object');
  }

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    throw new Error('Generated script is missing a valid title');
  }

  if (!data.code || typeof data.code !== 'string' || !data.code.includes('from \'')) {
    throw new Error('Generated code does not appear to be a valid Playwright script');
  }

  if (!Array.isArray(data.steps)) {
    throw new Error('Simulation steps must be an array');
  }

  // Normalize steps to ensure they meet the SimulationStep contract
  const normalizedSteps: SimulationStep[] = data.steps.map((step: any) => ({
    action: (step.action || 'unknown').toLowerCase(),
    description: step.description || 'Performed browser action',
    selector: step.selector || undefined,
    value: step.value || undefined,
    target: step.target || undefined,
    timeout: typeof step.timeout === 'number' ? step.timeout : undefined,
  }));

  return {
    title: data.title.trim(),
    code: data.code.trim(),
    steps: normalizedSteps,
    explanation: typeof data.explanation === 'string'
      ? data.explanation.trim()
      : 'Script generated and refined using local LLM. Review selectors and add assertions as needed.',
  };
}

/**
 * Calls the local Ollama instance with proper error handling
 * and JSON extraction (in case the model adds explanatory text).
 */
async function callOllama(
  systemPrompt: string,
  userPrompt: string,
  options: OllamaGenerationOptions = {}
): Promise<any> {
  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? DEFAULT_TEMPERATURE;
  const numCtx = options.numCtx ?? DEFAULT_NUM_CTX;

  try {
    const response = await ollama.chat({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      format: 'json',
      options: {
        temperature,
        num_ctx: numCtx,
        top_p: 0.9,
      },
    });

    if (!response?.message?.content) {
      throw new Error('Ollama returned an empty response');
    }

    let content = response.message.content.trim();

    // Extract JSON if the model wrapped it in extra text (common with smaller models)
    const jsonMatch = content.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      content = jsonMatch[1];
    }

    const parsed = JSON.parse(content);
    return parsed;
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.message?.includes('connect')) {
      throw new Error(
        'Could not connect to Ollama. Make sure Ollama is running (ollama serve) and the model is pulled (ollama pull llama3.1).'
      );
    }

    if (error.message?.includes('JSON')) {
      throw new Error('LLM did not return valid JSON. Try again or use a stronger model.');
    }

    throw new Error(`Ollama request failed: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generates a new Playwright script from a natural language description.
 * Optionally incorporates current page context (URL or DOM snapshot).
 *
 * @param prompt - Natural language description of the browser task
 * @param context - Optional page context (e.g. "Current page: https://example.com/dashboard")
 * @param options - Optional generation parameters
 * @returns Structured generation response with code, steps, and metadata
 */
export async function generateScript(
  prompt: string,
  context?: string,
  options: OllamaGenerationOptions = {}
): Promise<GenerationResponse> {
  if (!prompt?.trim()) {
    throw new Error('Prompt cannot be empty. Please describe the task you want to automate.');
  }

  if (prompt.length > 8000) {
    throw new Error('Prompt is too long. Please keep requests under 8000 characters.');
  }

  const systemPrompt = getSystemPrompt();
  const userPrompt = buildGenerationPrompt(prompt, context);

  const rawResponse = await callOllama(systemPrompt, userPrompt, options);
  return validateGenerationResponse(rawResponse);
}

/**
 * Refines an existing script based on user feedback.
 * Maintains code style, comments, and selector quality while applying changes.
 *
 * @param script - The current Playwright script code to refine
 * @param feedback - User instructions for changes (e.g. "Add a wait for the table to load")
 * @param options - Optional generation parameters
 * @returns Updated generation response
 */
export async function refineScript(
  script: string,
  feedback: string,
  options: OllamaGenerationOptions = {}
): Promise<GenerationResponse> {
  if (!script?.trim()) {
    throw new Error('Cannot refine an empty script');
  }

  if (!feedback?.trim()) {
    throw new Error('Please provide feedback on what to change in the script');
  }

  const systemPrompt = getSystemPrompt();
  const userPrompt = buildRefinementPrompt(script, feedback);

  const rawResponse = await callOllama(systemPrompt, userPrompt, {
    ...options,
    temperature: options.temperature ?? 0.25, // Slightly higher creativity for refinements
  });

  return validateGenerationResponse(rawResponse);
}

/**
 * Low-level helper to send any prompt to Ollama while still using
 * our system instructions. Exposed for advanced use cases or testing.
 */
export async function chatWithOllama(
  userMessage: string,
  options: OllamaGenerationOptions = {}
): Promise<string> {
  if (!userMessage?.trim()) {
    throw new Error('Message cannot be empty');
  }

  const systemPrompt = getSystemPrompt();

  const response = await callOllama(systemPrompt, userMessage, options);
  return typeof response === 'string' ? response : JSON.stringify(response, null, 2);
}

/**
 * Returns metadata about the currently configured Ollama connection.
 * Useful for UI status indicators.
 */
export async function getOllamaStatus(): Promise<{
  available: boolean;
  model: string;
  version?: string;
}> {
  try {
    const models = await ollama.list();
    const defaultModel = DEFAULT_MODEL;

    const isAvailable = models.models.some((m: any) =>
      m.name.includes(defaultModel) || m.name.includes('llama')
    );

    return {
      available: isAvailable,
      model: defaultModel,
      version: 'local',
    };
  } catch {
    return {
      available: false,
      model: DEFAULT_MODEL,
    };
  }
}

// Re-export prompt utilities for consumers that want to inspect prompts
export { getSystemPrompt, buildGenerationPrompt, buildRefinementPrompt, createPrompt } from './prompts';
