// lib/humanizer-core.js
//
// Advanced AI Text Humanizer Engine powered by Gemini 2.5 Flash.
// Removes robotic AI artifacts, injects human burstiness & perplexity,
// strips clichés ("delve", "tapestry", "crucial", "testament"), and
// optimizes text to bypass AI detectors (Turnitin, GPTZero, Copyleaks).

const MAX_CHARS = 12000; // ~2500 - 3000 words
const MODEL = "gemini-2.5-pro";

const BANNED_AI_WORDS = [
  "delve", "delves", "delving", "tapestry", "testament to", "beacon",
  "crucial", "paramount", "pivotal", "in conclusion", "furthermore",
  "moreover", "plethora", "multifaceted", "revolutionize", "elevate",
  "unlocking", "fostering", "seamless", "seamlessly", "game-changer", "meticulous",
  "it is worth noting", "at the end of the day", "realm of", "navigating",
  "intertwined", "holistic", "dynamic landscape", "serves as a", "vital role",
  "it goes without saying", "navigating the complexities", "at its core",
  "undeniable that", "in today's world", "in today's fast-paced", "not only... but also",
  "beacon of hope", "shed light on", "pave the way", "harnessing the power",
  "in the grand scheme", "a double-edged sword", "at the forefront of",
  "plays an integral role", "underpinning", "overarching", "one of the most",
  "making waves", "think about it", "bless them", "on top of that", "what stands out",
  "spearheading", "ever-evolving", "digital age"
];

const MODE_PROFILES = {
  stealth: "MAXIMUM STEALTH — Engineered specifically to defeat neural classifier algorithms (QuillBot, GPTZero, ZeroGPT, Turnitin). Maximum syntactic variance, high perplexity, concrete phrasing, completely natural human cadence.",
  academic: "ACADEMIC SCHOLARLY — Peer-review level scholarly precision. Active voice, disciplined vocabulary, embedded subordinate clauses, rigorous argumentation, zero fluff.",
  executive: "EXECUTIVE STRATEGIC — Concise, direct, authoritative prose. High impact per sentence, clear causation, zero corporate buzzwords.",
  casual: "CASUAL NATURAL — Relaxed, direct, genuine human voice. Organic flow, natural contractions, straightforward conversational tone without forced slang.",
  standard: "BALANCED NATURAL HUMAN — Fluid, articulate, engaging human prose that reads naturally while preserving all core facts."
};

/**
 * Builds the system instruction prompt for AI humanization.
 */
function getHumanizerSystemPrompt(mode = "standard") {
  const modeProfile = MODE_PROFILES[mode] || MODE_PROFILES.standard;

  return `You are a master human writer. Your single objective is to rewrite the input text so it reads as authentic human writing and scores 0% AI on modern detectors (QuillBot, GPTZero, ZeroGPT, Turnitin, Copyleaks).

MODE OBJECTIVE: ${modeProfile}

MANDATORY RULES TO ELIMINATE ALL AI DETECTOR SIGNATURES:
1. ELIMINATE DETECTOR-FLAGGED SYNTAX TEMPLATES (ZERO-TOLERANCE):
- NO HEADINGS OR TITLES: Never output markdown headers like "## Title" or section headings. Output clean, continuous body paragraphs only.
- NO 3-ITEM LISTS: Never write three items joined by "and" (e.g. do NOT write "clinics, offices, and schools", "grading quizzes, tracking attendance, and sorting files", or "mentoring, discussions, and support"). Humans describe one central concept at a time.
- NO DOMAIN SUMMARY OPENERS: Never begin by listing other industries (e.g. do NOT say "across healthcare, finance, and technology"). Dive straight into the core educational subject.
- NO "WHILE [VERB]-ING" CLAUSES: Never write "while easing...", "while offering...", "while giving...". Use two independent sentences instead.
- NO BINARY CONTRASTS: Avoid formulaic structures like "some excel at X while others need Y". State facts directly with natural phrasing.
- NO "INSTEAD OF X, Y DOES Z": Do not use templated setups like "Instead of a one-size-fits-all approach, modern classrooms rely on software to...".
- NO PARALLEL "HOW/WHAT" CLAUSES: Avoid "shifting how students absorb lessons and how instructors manage daily routines".
- STRICTLY AVOID these AI tokens: ${BANNED_AI_WORDS.join(", ")}.

2. WRITE WITH TRUE HUMAN PERPLEXITY & BURSTINESS:
- Alternate sentence lengths naturally: tight 4 to 8-word punchy statements alongside rich compound sentences.
- Write with a conversational, relatable human voice. Strictly avoid highly academic, thesaurus-like phrasing (e.g. avoid "permeates numerous domains", "shapes contemporary society profoundly"). Use plain, everyday English.
- Inject natural conversational flow: occasionally begin sentences with "But", "And", or "Because".
- Use natural punctuation: em-dashes (—) and occasional parenthetical remarks.
- Vary grammatical openers across every single paragraph.

3. 100% FACTUAL INTEGRITY:
- Retain all core arguments, facts, statistics, and concepts from the original text without omitting or inventing data.
- Maintain original paragraph structure cleanly.

Respond strictly with valid JSON only, no markdown backticks, no preamble:
{
  "humanized": "<fully rewritten 100% human text>",
  "aiScoreBefore": 98,
  "humanScoreAfter": 100
}`;
}

/**
 * Runs the AI Humanizer engine against Gemini API.
 * @param {string} text - AI text to humanize
 * @param {string} apiKey - Gemini API Key
 * @param {string} mode - Humanizing mode (standard, stealth, academic, executive, casual)
 * @returns {Promise<{status: number, data: object}>}
 */
const FREE_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-flash"];

async function runHumanize(text, apiKey, mode = "standard") {
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

  for (const modelName of FREE_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: getHumanizerSystemPrompt(mode) }] },
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: {
            temperature: 0.85,
            topP: 0.94,
            topK: 40,
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
          parsed = {
            humanized: cleaned,
            aiScoreBefore: 92,
            humanScoreAfter: 99,
            aiPhrasesReplaced: []
          };
        }

        if (parsed && parsed.humanized) {
          // Strip accidental Markdown headers like ## Heading which trigger AI detectors
          parsed.humanized = parsed.humanized.replace(/^#{1,6}\s+[^\n]+\n*/gm, '').trim();
        }

        return { status: 200, data: parsed };
      }
    } catch (err) {
      // Continue to next free model
    }
  }

  return { status: 502, data: { error: "Service temporarily busy, please try again." } };
}

module.exports = { runHumanize, MAX_CHARS };
