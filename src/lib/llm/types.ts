// Provider-agnostic LLM interface. Swap Gemini for Claude/OpenAI by adding
// another implementation and changing src/lib/llm/index.ts.

export type ChatMessage = { role: "user" | "assistant"; content: string };

export interface LLMProvider {
  chat(opts: {
    system: string;
    messages: ChatMessage[];
    maxOutputTokens?: number;
    temperature?: number;
  }): Promise<string>;

  /** Asks for a JSON answer and returns the raw JSON text (parse and validate it yourself). */
  json(opts: { system: string; prompt: string; maxOutputTokens?: number; timeoutMs?: number }): Promise<string>;

  /** Embedding vectors with fixed dimension (768) to match the DB schema. */
  embed(texts: string[], task: "document" | "query"): Promise<number[][]>;
}

export const EMBEDDING_DIMENSIONS = 768;
