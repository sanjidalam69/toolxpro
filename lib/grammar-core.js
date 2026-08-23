// lib/grammar-core.js
//
// Uses Google's Gemini API (free tier) — an LLM-based grammar/spelling
// fixer with proper margin-note explanations, at no cost.
//
// Get a free key: https://aistudio.google.com/apikey (Google account,
// no credit card required). Set it as GEMINI_API_KEY wherever you
// deploy this (see README for each platform).

const MAX_CHARS = 4000;
const MODELS = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-flash-lite-latest"];

const TONE_INSTRUCTIONS = {
  paraphrase: "Paraphrase and rephrase the entire text completely using fresh, articulate phrasing and enhanced vocabulary while strictly preserving the core meaning and fixing all grammar/spelling errors.",
  formal: "Adopt a formal, executive, and professional tone suitable for business correspondence.",
  academic: "Adopt an academic, scholarly, and authoritative tone suitable for scientific and university papers.",
  concise: "Make the writing concise, punchy, and direct while eliminating redundant filler words.",
  casual: "Adopt a friendly, conversational, and natural tone.",
  standard: "Preserve the original meaning, tone, and style as closely as possible."
};

/**
 * Builds the system instruction prompt based on requested tone.
 */
function getSystemPrompt(tone = "standard") {
  const toneGuidance = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.standard;
  return `You are a professional AI grammar, spelling, and tone correction engine.
Given input text, correct all grammar, spelling, and punctuation errors.
Tone Guidance: ${toneGuidance}

Respond ONLY with a valid JSON object, no markdown fences, no preamble, in exactly this shape:
{
  "corrected": "<the corrected or paraphrased text>",
  "changes": [
    { "original": "<short original snippet>", "fixed": "<short corrected snippet>", "reason": "<brief reason>" }
  ]
}
If there are no errors, return the input in "corrected" and an empty "changes" array. Limit "changes" to at most 20 notable corrections.`;
}

/**
 * Runs the grammar fix against the Gemini API.
 * @param {string} text - user's input text
 * @param {string} apiKey - Gemini API key
 * @param {string} tone - requested tone style
 * @returns {Promise<{status: number, data: object}>}
 */
async function runGrammarFix(text, apiKey, tone = "standard") {
  if (!text || !text.trim()) {
    return { status: 400, data: { error: "No text provided" } };
  }

  if (text.length > MAX_CHARS) {
    return {
      status: 400,
      data: { error: `Text too long. Max ${MAX_CHARS} characters, got ${text.length}.` },
    };
  }

  if (!apiKey) {
    return { status: 500, data: { error: "Server misconfigured: GEMINI_API_KEY not set." } };
  }

  const isParaphrase = tone === "paraphrase";
  const targetTemp = isParaphrase ? 0.75 : 0.2;

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: getSystemPrompt(tone) }] },
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: {
            temperature: targetTemp,
            responseMimeType: "application/json",
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const raw = (data.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
        const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

        let parsed;
        try {
          parsed = JSON.parse(cleaned);
        } catch (e) {
          parsed = { corrected: raw, changes: [] };
        }

        return { status: 200, data: parsed };
      }
    } catch (err) {
      // try next model
    }
  }

  return { status: 502, data: { error: "Service temporarily busy, please try again." } };
}

module.exports = { runGrammarFix, MAX_CHARS };
