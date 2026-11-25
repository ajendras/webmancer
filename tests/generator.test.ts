import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSystemPrompt,
  buildGenerationPrompt,
  buildRefinementPrompt,
} from '@/lib/prompts';
import {
  generateScript,
  refineScript,
  validateGenerationResponse,
} from '@/lib/ollama';
import type { GenerationResponse, SimulationStep } from '@/types';

// Mock ollama dependency
vi.mock('ollama', () => ({
  default: {
    chat: vi.fn(),
    list: vi.fn(),
  },
}));

const mockOllama = vi.mocked(await import('ollama')).default;

describe('Webmancer Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Prompt Templates', () => {
    it('getSystemPrompt includes critical instructions and JSON schema', () => {
      const prompt = getSystemPrompt();

      expect(prompt).toContain('You are Webmancer');
      expect(prompt).toContain('ALWAYS output valid JSON');
      expect(prompt).toContain('page.getByRole');
      expect(prompt).toContain('getByTestId');
      expect(prompt).toContain('PLAYWRIGHT_JSON_SCHEMA');
      expect(prompt).toContain('FEW-SHOT EXAMPLE');
      expect(prompt).toContain('Respond with JSON only');
    });

    it('buildGenerationPrompt incorporates context when provided', () => {
      const userPrompt = 'Login and export the report';
      const context = 'Current page: https://demo.app/dashboard\nVisible elements: button#export, input#username';

      const result = buildGenerationPrompt(userPrompt, context);

      expect(result).toContain('Generate a complete Playwright automation script');
      expect(result).toContain('CURRENT PAGE CONTEXT:');
      expect(result).toContain('https://demo.app/dashboard');
      expect(result).toContain(userPrompt);
      expect(result).toContain('Respond with JSON only');
    });

    it('buildGenerationPrompt works without context', () => {
      const result = buildGenerationPrompt('Take a screenshot');

      expect(result).not.toContain('CURRENT PAGE CONTEXT:');
      expect(result).toContain('REQUEST: Take a screenshot');
    });

    it('buildRefinementPrompt includes original script and feedback', () => {
      const originalScript = `import { test } from '@playwright/test';\ntest('demo', async ({ page }) => { await page.goto('https://example.com'); });`;
      const feedback = 'Add a waitForLoadState after navigation';

      const result = buildRefinementPrompt(originalScript, feedback);

      expect(result).toContain('You previously generated this Playwright script');
      expect(result).toContain(originalScript);
      expect(result).toContain(feedback);
      expect(result).toContain('Keep the same high quality');
      expect(result).toContain('Respond with JSON only');
    });
  });

  describe('Response Validation', () => {
    it('accepts and normalizes a valid GenerationResponse', () => {
      const validPayload = {
        title: 'Login Flow',
        code: `import { test, expect } from '@playwright/test';\ntest('login', async ({ page }) => {\n  await page.goto('https://example.com');\n  console.log('✅ Done');\n});`,
        steps: [
          {
            action: 'navigate',
            description: 'Go to login page',
            selector: 'https://example.com/login',
          },
          {
            action: 'fill',
            description: 'Enter username',
            selector: '[data-testid="username"]',
            value: 'testuser',
          },
        ],
        explanation: 'Performs a login and verifies success',
      };

      const result = validateGenerationResponse(validPayload);

      expect(result.title).toBe('Login Flow');
      expect(result.code).toContain('from \'@playwright/test\'');
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].action).toBe('navigate');
      expect(result.steps[1].action).toBe('fill');
      expect(result.explanation).toContain('Performs a login');
    });

    it('throws on missing title', () => {
      const invalid = {
        code: '// script here',
        steps: [],
      };

      expect(() => validateGenerationResponse(invalid)).toThrow('Generated script is missing a valid title');
    });

    it('throws on missing or invalid code', () => {
      const invalid = {
        title: 'Test',
        code: 'just some text',
        steps: [],
      };

      expect(() => validateGenerationResponse(invalid)).toThrow('Generated code does not appear to be a valid Playwright script');
    });

    it('normalizes steps and fills defaults', () => {
      const payload = {
        title: 'Demo',
        code: '// valid code',
        steps: [
          { description: 'Click button' },
          { action: 'NAVIGATE', description: 'Go home', target: 'https://example.com' },
        ],
      };

      const result = validateGenerationResponse(payload);

      expect(result.steps[0].action).toBe('unknown');
      expect(result.steps[0].description).toBe('Click button');
      expect(result.steps[1].action).toBe('navigate');
      expect(result.steps[1].target).toBe('https://example.com');
    });

    it('throws on non-object response', () => {
      expect(() => validateGenerationResponse(null)).toThrow('LLM response was not a valid object');
      expect(() => validateGenerationResponse('string')).toThrow('LLM response was not a valid object');
    });
  });

  describe('Ollama Integration', () => {
    const mockValidResponse = {
      message: {
        content: JSON.stringify({
          title: 'Search Google',
          code: `import { test, expect } from '@playwright/test';\ntest('search', async ({ page }) => { await page.goto('https://google.com'); console.log('✅ Done'); });`,
          steps: [{ action: 'navigate', description: 'Open Google', selector: 'https://google.com' }],
          explanation: 'Searches Google for a term.',
        }),
      },
    };

    it('generateScript calls Ollama with correct prompts and validates output', async () => {
      mockOllama.chat.mockResolvedValueOnce(mockValidResponse);

      const result = await generateScript(
        'Search Google for TypeScript',
        'Current page: https://example.com'
      );

      expect(mockOllama.chat).toHaveBeenCalledTimes(1);
      const callArgs = mockOllama.chat.mock.calls[0][0];

      expect(callArgs.model).toBe('llama3.1');
      expect(callArgs.format).toBe('json');
      expect(callArgs.messages[0].role).toBe('system');
      expect(callArgs.messages[1].role).toBe('user');
      expect(callArgs.messages[1].content).toContain('CURRENT PAGE CONTEXT');
      expect(callArgs.options.temperature).toBe(0.15);

      expect(result.title).toBe('Search Google');
      expect(result.steps).toHaveLength(1);
    });

    it('refineScript uses slightly higher temperature and refinement prompt', async () => {
      mockOllama.chat.mockResolvedValueOnce(mockValidResponse);

      const existingScript = '// previous script';
      await refineScript(existingScript, 'Make selectors more robust');

      const callArgs = mockOllama.chat.mock.calls[0][0];
      expect(callArgs.options.temperature).toBe(0.25);
      expect(callArgs.messages[1].content).toContain('You previously generated this Playwright script');
      expect(callArgs.messages[1].content).toContain('Make selectors more robust');
    });

    it('handles connection errors with helpful message', async () => {
      const connectionError = new Error('connect ECONNREFUSED');
      (connectionError as any).code = 'ECONNREFUSED';

      mockOllama.chat.mockRejectedValueOnce(connectionError);

      await expect(generateScript('Do something')).rejects.toThrow(
        'Could not connect to Ollama. Make sure Ollama is running'
      );
    });

    it('handles JSON parse failures gracefully', async () => {
      mockOllama.chat.mockResolvedValueOnce({
        message: { content: 'This is not JSON at all' },
      });

      await expect(generateScript('Bad prompt')).rejects.toThrow(
        'LLM did not return valid JSON'
      );
    });

    it('getOllamaStatus returns availability information', async () => {
      mockOllama.list.mockResolvedValueOnce({
        models: [{ name: 'llama3.1:latest' }],
      });

      const status = await (await import('@/lib/ollama')).getOllamaStatus();

      expect(status.available).toBe(true);
      expect(status.model).toBe('llama3.1');
    });
  });

  describe('Edge Cases', () => {
    it('rejects empty prompt', async () => {
      await expect(generateScript('')).rejects.toThrow('Prompt cannot be empty');
      await expect(generateScript('   ')).rejects.toThrow('Prompt cannot be empty');
    });

    it('rejects overly long prompts', async () => {
      const longPrompt = 'a'.repeat(9000);
      await expect(generateScript(longPrompt)).rejects.toThrow('Prompt is too long');
    });

    it('rejects refinement without script or feedback', async () => {
      await expect(refineScript('', 'improve it')).rejects.toThrow('Cannot refine an empty script');
      await expect(refineScript('// code', '')).rejects.toThrow('Please provide feedback');
    });
  });
});
