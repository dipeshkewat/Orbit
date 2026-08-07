import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * Pre-configured Anthropic provider for Orbit.
 * Uses claude-sonnet-4-6 as the default model for caption generation.
 * API key must be set via ANTHROPIC_API_KEY environment variable.
 */
export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "mock-key",
});

/** Default model for caption generation and brand voice */
export const CAPTION_MODEL = "claude-sonnet-4-6";

/** Re-export Vercel AI SDK core functions */
import { generateText as vercelGenerateText } from "ai";

/**
 * Overridden generateText that transparently routes calls to Google Gemini API
 * if GEMINI_API_KEY is configured in the environment.
 */
export async function generateText(options: any): Promise<{ text: string }> {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey && geminiKey !== "xxx") {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: options.prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      return { text };
    } catch (err) {
      console.error("Failed calling Google Gemini API directly, falling back to Vercel AI SDK:", err);
    }
  }

  // Fallback to Vercel AI SDK
  return vercelGenerateText(options);
}

export { streamText } from "ai";
