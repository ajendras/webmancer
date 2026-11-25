/**
 * Prompt engineering for high-quality Playwright script generation.
 * Contains system instructions, JSON schema, and few-shot examples
 * tuned for Playwright v1.45+ best practices.
 *
 * All prompts are crafted to:
 * - Prefer semantic selectors (role, test-id, aria, text)
 * - Produce clean, commented, production-ready TypeScript
 * - Return valid JSON that can be parsed without post-processing
 * - Work reliably with local models (llama3.1, mistral, etc.)
 */

export const PLAYWRIGHT_JSON_SCHEMA = `{
  "title": "string - concise title for the automation",
  "code": "string - complete Playwright test file as valid TypeScript",
  "steps": [
    {
      "action": "navigate|click|fill|type|wait|download|assert",
      "description": "string - clear one-sentence explanation",
      "selector": "string - best available selector (getByRole, getByTestId, etc)",
      "value": "string - optional value for fill/type steps",
      "target": "string - optional URL for navigation"
    }
  ],
  "explanation": "string - 1-2 sentence summary of what the script accomplishes"
}`;

const BASE_SYSTEM_PROMPT = `You are Webmancer, a senior Playwright engineer that converts natural language into production-grade browser automation scripts.

CORE RULES:
- ALWAYS output valid JSON matching the schema below. No extra text, no markdown, no explanations outside the JSON.
- Use Playwright Test v1.45+ syntax with import { test, expect } from '@playwright/test';
- Prefer the most robust selectors in this order:
  1. page.getByRole('button', { name: /text/i })
  2. page.getByTestId('identifier')
  3. page.getByLabel('label text')
  4. page.getByPlaceholder('placeholder')
  5. page.getByText('visible text')
  6. Only as last resort: page.locator('css-or-xpath')
- Include detailed inline comments explaining every major action.
- Use async/await and proper waiting strategies (waitForLoadState, waitForURL, auto-waiting).
- Wrap navigation + click in Promise.all when appropriate for network stability.
- Add a final console.log('✅ Task completed') and meaningful test name.
- Make the script self-contained and runnable with: npx playwright test.
- For refinements, preserve as much of the original structure as possible while incorporating feedback.

SIMULATION STEPS:
- Break the script into logical SimulationStep objects that match the visual stepper.
- Use exact action names: navigate, click, fill, wait, download, assert.
- Keep descriptions concise and user-friendly.

OUTPUT SCHEMA:
${PLAYWRIGHT_JSON_SCHEMA}

You must respond with a single JSON object that can be parsed with JSON.parse().`;

const FEW_SHOT_EXAMPLES = `
FEW-SHOT EXAMPLE 1:

User request: "Go to the demo login page at https://demo.app/login, sign in as demo-user with password 'demo123', navigate to the reports page, and export the latest CSV report."

Expected JSON output:
{
  "title": "Login and export quarterly report",
  "code": "// webmancer-generated - login-and-export.spec.ts\nimport { test, expect } from '@playwright/test';\n\ntest('login and export quarterly report', async ({ page }) => {\n  // Navigate to login page\n  await page.goto('https://demo.app/login');\n  \n  // Fill credentials using robust test ids\n  await page.getByTestId('username').fill('demo-user');\n  await page.getByTestId('password').fill('demo123');\n  \n  // Submit login and wait for navigation\n  await Promise.all([\n    page.waitForURL('**/reports**'),\n    page.getByRole('button', { name: /sign in/i }).click()\n  ]);\n  \n  // Export the latest report\n  await page.getByRole('button', { name: /export csv/i }).click();\n  \n  const downloadPromise = page.waitForEvent('download');\n  await page.getByText('Q3 Financials').click();\n  const download = await downloadPromise;\n  await download.saveAs('quarterly-report.csv');\n  \n  console.log('✅ Report exported successfully');\n});",
  "steps": [
    {
      "action": "navigate",
      "description": "Go to the company login page",
      "selector": "https://demo.app/login"
    },
    {
      "action": "fill",
      "description": "Enter username",
      "selector": "[data-testid='username']",
      "value": "demo-user"
    },
    {
      "action": "fill",
      "description": "Enter password",
      "selector": "[data-testid='password']",
      "value": "demo123"
    },
    {
      "action": "click",
      "description": "Submit login form",
      "selector": "button:has-text('Sign in')"
    },
    {
      "action": "navigate",
      "description": "Navigate to reports dashboard",
      "selector": "/reports"
    },
    {
      "action": "click",
      "description": "Export latest CSV report",
      "selector": "[aria-label='Export CSV']"
    },
    {
      "action": "download",
      "description": "Save the downloaded quarterly report",
      "selector": "quarterly-report.csv"
    }
  ],
  "explanation": "Logs into the demo application and exports the latest quarterly financial report as CSV."
}

FEW-SHOT EXAMPLE 2:

User request: "Search for 'TypeScript' on Google and click the first result that mentions the official handbook."

Expected JSON output:
{
  "title": "Google search for TypeScript handbook",
  "code": "// webmancer-generated - google-typescript-search.spec.ts\nimport { test, expect } from '@playwright/test';\n\ntest('google search for typescript handbook', async ({ page }) => {\n  // Open Google in a clean state\n  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });\n  \n  // Accept consent if present (defensive)\n  const consentButton = page.getByRole('button', { name: /accept/i });\n  if (await consentButton.isVisible({ timeout: 3000 })) {\n    await consentButton.click();\n  }\n  \n  // Perform search using robust selector\n  await page.getByRole('textbox', { name: 'Search' }).fill('TypeScript');\n  await page.getByRole('textbox', { name: 'Search' }).press('Enter');\n  \n  // Click the first handbook result\n  await page.getByRole('link', { name: /TypeScript Handbook/i }).first().click();\n  \n  // Verify we landed on the handbook\n  await expect(page).toHaveURL(/.*typescriptlang.org.*/);\n  \n  console.log('✅ Navigated to TypeScript Handbook');\n});",
  "steps": [
    {
      "action": "navigate",
      "description": "Open Google homepage",
      "selector": "https://www.google.com"
    },
    {
      "action": "fill",
      "description": "Type search query into Google search box",
      "selector": "input[aria-label='Search']",
      "value": "TypeScript"
    },
    {
      "action": "click",
      "description": "Submit the search",
      "selector": "input[value='Google Search']"
    },
    {
      "action": "click",
      "description": "Open the official TypeScript Handbook from results",
      "selector": "a:has-text('TypeScript Handbook')"
    }
  ],
  "explanation": "Performs a Google search for TypeScript and opens the official handbook page."
}
`;

/**
 * Returns the complete system prompt used for all generations.
 * Includes detailed instructions, selector hierarchy, and few-shot examples.
 */
export function getSystemPrompt(): string {
  return `${BASE_SYSTEM_PROMPT}

${FEW_SHOT_EXAMPLES}

Remember: Your response must be valid JSON only. The frontend will parse it directly.`;
}

/**
 * Builds a user prompt for initial script generation.
 * Incorporates page context when available for precise element targeting.
 */
export function buildGenerationPrompt(
  userPrompt: string,
  context?: string
): string {
  const contextBlock = context
    ? `\n\nCURRENT PAGE CONTEXT:\n${context}\nUse the exact visible text, test ids, and ARIA labels from this context when possible.`
    : '';

  return `Generate a complete Playwright automation script for the following request:${contextBlock}

REQUEST: ${userPrompt}

Respond with JSON only using the exact schema provided in the system prompt.`;
}

/**
 * Builds a refinement prompt that includes the existing script.
 * The LLM is instructed to modify the script according to feedback
 * while preserving style, comments, and robustness.
 */
export function buildRefinementPrompt(
  currentScript: string,
  feedback: string
): string {
  return `You previously generated this Playwright script:

\`\`\`ts
${currentScript}
\`\`\`

The user has provided the following feedback for refinement:

"${feedback}"

Please generate an updated version of the script that incorporates this feedback.
- Keep the same high quality, comments, and selector strategy.
- Only change what is necessary.
- Return the complete updated script in the same JSON format as before.

Respond with JSON only.`;
}

/**
 * Returns a prompt object for internal use by the Ollama client.
 * Useful for debugging or advanced callers.
 */
export function createPrompt(
  userPrompt: string,
  context?: string,
  isRefinement = false,
  existingScript?: string
): InternalPrompt {
  if (isRefinement && existingScript) {
    return {
      system: getSystemPrompt(),
      user: buildRefinementPrompt(existingScript, userPrompt),
    };
  }

  return {
    system: getSystemPrompt(),
    user: buildGenerationPrompt(userPrompt, context),
  };
}
