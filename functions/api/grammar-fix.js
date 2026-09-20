// functions/api/grammar-fix.js
// Cloudflare Pages Function for AI Grammar Fixer (Gemini AI)

const MODELS = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-8b", "gemini-2.0-flash-lite", "gemini-1.5-pro"];

const TONE_INSTRUCTIONS = {
  paraphrase: "Paraphrase and rephrase the entire text completely using fresh, articulate phrasing and enhanced vocabulary while strictly preserving the core meaning and fixing all grammar/spelling errors.",
  formal: "Adopt a formal, executive, and professional tone suitable for business correspondence.",
  academic: "Adopt an academic, scholarly, and authoritative tone suitable for scientific and university papers.",
  concise: "Make the writing concise, punchy, and direct while eliminating redundant filler words.",
  casual: "Adopt a friendly, conversational, and natural tone.",
  standard: "Preserve the original meaning, tone, and style as closely as possible."
};

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

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.GEMINI_API_KEY || "";

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  try {
    const body = await request.json();
    const text = (body.text || "").toString();
    const tone = (body.tone || "standard").toString();

    if (!text || !text.trim()) {
      return new Response(JSON.stringify({ error: "No text provided" }), { status: 400, headers: corsHeaders });
    }

    if (text.length > 4000) {
      return new Response(JSON.stringify({ error: "Text exceeds 4,000 characters limit." }), { status: 400, headers: corsHeaders });
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server GEMINI_API_KEY not configured." }), { status: 500, headers: corsHeaders });
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

          return new Response(JSON.stringify(parsed), { status: 200, headers: corsHeaders });
        }
      } catch (err) {
        // try next model
      }
    }

    return new Response(JSON.stringify({ error: "Service temporarily busy, please try again." }), { status: 502, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { status: 400, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}
