import { generateText } from "ai";
import { MockLanguageModelV3 } from "ai/test";

// Swap this out for a real provider when ready, e.g.:
//   import { openai } from "@ai-sdk/openai";
//   const model = openai("gpt-4o-mini");
const model = new MockLanguageModelV3({
  doGenerate: async () => ({
    content: [{ type: "text" as const, text: "{}" }],
    finishReason: { unified: "stop" as const, raw: undefined },
    usage: {
      inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: 0, text: 0, reasoning: 0 },
    },
    warnings: [],
  }),
});

/**
 * Calls the LLM and returns parsed JSON.
 * Prompt should instruct the model to respond with JSON only.
 */
export async function callLLM(
  prompt: string,
  system?: string
): Promise<unknown> {
  const { text } = await generateText({ model, system, prompt });

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`LLM did not return valid JSON: ${text.slice(0, 120)}`);
  }
}
