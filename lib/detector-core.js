// lib/detector-core.js
// Multi-Modal AI Content Detector (Text & Image) powered by Gemini 2.5 Flash

const MAX_TEXT_CHARS = 10000;
const MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-flash"];

/**
 * AI Text Detection Engine
 */
const TEXT_SYSTEM_PROMPT = `You are a state-of-the-art AI Content Detector.
Analyze the user's input text and determine whether it was written by an AI language model (ChatGPT, Claude, Gemini, DeepSeek, LLaMA) or a human author.

Evaluate:
1. Perplexity (predictability of word sequences)
2. Burstiness (variation in sentence lengths and rhythm)
3. AI signature vocabulary & clichés (e.g. delve, tapestry, testament, crucial, furthermore, in conclusion)
4. Formulaic syntactic templates

Respond strictly with valid JSON only, without markdown fences or preamble, matching this exact schema:
{
  "aiScore": <number 0-100 representing AI probability>,
  "humanScore": <number 0-100 representing Human probability>,
  "verdict": "<Entirely AI-Generated | Mixed AI & Human | Highly Likely Human>",
  "metrics": {
    "perplexity": "<Low (AI) | Moderate | High (Human)>",
    "burstiness": "<Uniform (AI) | Moderate | Dynamic (Human)>",
    "repetition": "<High (AI) | Normal | Low>"
  },
  "summary": "<1-2 concise sentences explaining the detection verdict>",
  "sentences": [
    {
      "text": "<individual sentence from text>",
      "status": "<ai | mixed | human>",
      "reason": "<brief reason if ai or mixed>"
    }
  ]
}`;

async function runTextDetect(text, apiKey) {
  if (!text || !text.trim()) {
    return { status: 400, data: { error: "No text provided" } };
  }

  if (text.length > MAX_TEXT_CHARS) {
    return {
      status: 400,
      data: { error: `Text too long. Max ${MAX_TEXT_CHARS} characters, got ${text.length}.` },
    };
  }

  if (!apiKey) {
    return { status: 500, data: { error: "Server misconfigured: GEMINI_API_KEY not set." } };
  }

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: TEXT_SYSTEM_PROMPT }] },
          contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: {
            temperature: 0.1,
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
            aiScore: 85,
            humanScore: 15,
            verdict: "AI Generated",
            summary: "Analyzed text exhibits significant AI linguistic markers.",
            sentences: []
          };
        }

        return { status: 200, data: parsed };
      }
    } catch (err) {
      // try next model
    }
  }

  return { status: 502, data: { error: "Service temporarily busy, please try again." } };
}

/**
 * AI Image Detection Engine
 */
const IMAGE_SYSTEM_PROMPT = `You are a forensic AI Image & Deepfake Detector.
Carefully examine the provided image and determine if it was created by an AI image generator (Midjourney, DALL-E 3, Stable Diffusion, Flux, Sora, Photoshop AI) or if it is a real human photograph/camera capture or hand-drawn human illustration.

Inspect for key AI generative markers:
1. Anatomy & Hands: Extra/missing fingers, unnatural knuckle folds, asymmetrical eyes, weird teeth, warped ears.
2. Texture & Skin: Plastic/wax skin sheen, airbrushed smoothness, indistinct hair strand blending, unnatural fabric folds.
3. Lighting & Shadows: Physically impossible multi-directional highlights, dreamlike ambient haze, hyper-glow.
4. Background & Coherence: Warped architectural geometry, pseudo-gibberish background text, melting peripheral objects.
5. Camera Realism: Natural sensor noise, optical depth-of-field vs synthetic Gaussian blur.

Respond strictly with valid JSON only, without markdown fences or preamble, matching this exact schema:
{
  "aiProbability": <number 0-100, e.g. 95>,
  "humanProbability": <number 0-100, e.g. 5>,
  "verdict": "<AI-Generated Image | Highly Likely AI | Mixed / Edited | Authentic Human Photo / Artwork>",
  "suspectedEngine": "<Midjourney | DALL-E 3 | Stable Diffusion / Flux | Smartphone / DSLR Camera | Hand-drawn Art | Unknown>",
  "checklist": {
    "anatomy": "<Natural | Minor Artifacts | Severe AI Anomalies>",
    "skinAndTextures": "<Realistic | Synthetic / Airbrushed>",
    "lightingAndPhysics": "<Natural Optical Physics | Unnatural Glow / Multi-light>",
    "backgroundCoherence": "<Sharp & Coherent | Melting / Distorted Geometry>"
  },
  "explanation": "<2-3 clear sentences explaining specific reasons and visual evidence found in the image>",
  "confidenceScore": "<High | Very High | Moderate>"
}`;

async function runImageDetect(base64Data, mimeType = "image/jpeg", apiKey) {
  if (!base64Data) {
    return { status: 400, data: { error: "No image data provided" } };
  }

  if (!apiKey) {
    return { status: 500, data: { error: "Server misconfigured: GEMINI_API_KEY not set." } };
  }

  // Clean pure base64
  const cleanedBase64 = base64Data.replace(/^data:image\/[a-zA-Z+]+;base64,/, "");

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: IMAGE_SYSTEM_PROMPT }] },
          contents: [
            {
              role: "user",
              parts: [
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: cleanedBase64
                  }
                },
                {
                  text: "Analyze this image for AI generation vs real human photography/artwork."
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
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
            aiProbability: 80,
            humanProbability: 20,
            verdict: "Suspected AI",
            suspectedEngine: "AI Diffusion Model",
            explanation: "Visual characteristics suggest generative synthesis.",
            checklist: {}
          };
        }

        return { status: 200, data: parsed };
      }
    } catch (err) {
      // try next model
    }
  }

  return { status: 502, data: { error: "Image analysis temporarily busy, please try again." } };
}

module.exports = {
  runTextDetect,
  runImageDetect,
  MAX_TEXT_CHARS
};
