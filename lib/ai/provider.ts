import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/**
 * Single point of truth for which model powers grading.
 * Swap providers or models with env vars only — no code changes needed.
 *
 *   AI_PROVIDER=google   (default) → GOOGLE_MODEL, e.g. "gemini-2.5-flash"
 *   AI_PROVIDER=openai              → OPENAI_MODEL, e.g. "gpt-4o"
 *
 * Note on model choice: "Gemini 1.5" has been retired by Google. This
 * defaults to gemini-2.5-flash (fast, cheap, strong at structured JSON).
 * Set GOOGLE_MODEL=gemini-2.5-pro for higher-accuracy grading if needed.
 */
export function getGradingModel(): LanguageModel {
  const provider = (process.env.AI_PROVIDER ?? "google").toLowerCase();

  if (provider === "openai") {
    const model = process.env.OPENAI_MODEL ?? "gpt-4o";
    return openai(model);
  }

  // default: google
  const model = process.env.GOOGLE_MODEL ?? "gemini-2.5-flash";
  return google(model);
}
