/**
 * Core type definitions for Webmancer
 * All components, API routes, and libraries share these contracts.
 */

export interface SimulationStep {
  /** The type of browser action being performed */
  action: 'navigate' | 'click' | 'fill' | 'type' | 'wait' | 'download' | 'assert' | 'scroll' | string;
  /** Human-readable description of what this step accomplishes */
  description: string;
  /** CSS selector, test id, role selector, or URL */
  selector?: string;
  /** Value to type into an input or value for assertions */
  value?: string;
  /** Optional timeout in milliseconds */
  timeout?: number;
  /** Optional target URL for navigation steps */
  target?: string;
}

export interface ScriptRecipe {
  /** Unique identifier for the recipe */
  id: string;
  /** Short, descriptive title for the automation */
  title: string;
  /** Complete, ready-to-run Playwright TypeScript test code */
  code: string;
  /** Ordered list of simulation steps for visual preview */
  steps: SimulationStep[];
  /** User-assignable or AI-suggested tags for search/filtering */
  tags: string[];
  /** When the recipe was first created */
  createdAt: Date;
  /** When the recipe was last modified (for refinements) */
  updatedAt?: Date;
}

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Who sent the message */
  role: MessageRole;
  /** Message content (user prompt or AI explanation) */
  content: string;
  /** Timestamp for ordering and display */
  timestamp: Date;
  /** Link to the recipe this message produced (for assistant messages) */
  recipeId?: string;
  /** Flag for error messages to style differently */
  isError?: boolean;
}

export interface GenerationResponse {
  /** Suggested title for the generated automation */
  title: string;
  /** Full Playwright test file content (with imports, test(), comments) */
  code: string;
  /** Parsed simulation steps for the visual stepper */
  steps: SimulationStep[];
  /** Brief natural language explanation of what the script does */
  explanation: string;
}

export interface OllamaGenerationOptions {
  /** Model to use (defaults to llama3.1) */
  model?: string;
  /** Temperature for generation (lower = more deterministic) */
  temperature?: number;
  /** Context window size */
  numCtx?: number;
}

/**
 * Structured prompt used internally by the Ollama client.
 * Not exposed to the UI.
 */
export interface InternalPrompt {
  system: string;
  user: string;
}
