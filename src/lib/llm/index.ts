import { createGeminiProvider } from "./gemini";
import type { LLMProvider } from "./types";

let provider: LLMProvider | null = null;

export function getLLM(): LLMProvider {
  provider ??= createGeminiProvider();
  return provider;
}

export * from "./types";
