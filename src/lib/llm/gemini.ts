import { GoogleGenAI } from "@google/genai";
import { EMBEDDING_DIMENSIONS, type LLMProvider } from "./types";

export function createGeminiProvider(): LLMProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const ai = new GoogleGenAI({ apiKey });
  const chatModel = process.env.GEMINI_CHAT_MODEL ?? "gemini-3.1-flash-lite";
  const embedModel = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";

  return {
    async chat({ system, messages, maxOutputTokens = 600, temperature = 0.3 }) {
      const res = await ai.models.generateContent({
        model: chatModel,
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        config: { systemInstruction: system, maxOutputTokens, temperature, httpOptions: { timeout: 20000 } },
      });
      return res.text ?? "";
    },

    async embed(texts, task) {
      const res = await ai.models.embedContent({
        model: embedModel,
        contents: texts,
        config: {
          taskType: task === "document" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY",
          outputDimensionality: EMBEDDING_DIMENSIONS,
          httpOptions: { timeout: 20000 },
        },
      });
      return (res.embeddings ?? []).map((e) => e.values ?? []);
    },
  };
}
