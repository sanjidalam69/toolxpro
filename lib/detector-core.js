// lib/detector-core.js
// Multi-Modal AI Content Detector (Text & Image) powered by Gemini AI

const MAX_TEXT_CHARS = 10000;
const MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash-lite",
  "gemini-1.5-pro"
];

/**
 * AI Text Detection Engine
 */
const TEXT_SYSTEM_PROMPT = `You are an expert, unbiased AI Content Detector.
Analyze the provided text and determine whether it was authored by an AI language model (ChatGPT, Claude, Gemini, DeepSeek, LLaMA) or a human.

Evaluate:
1. Perplexity (predictability of vocabulary sequences and repetitive phrasing)
2. Burstiness (variation in sentence lengths, structural rhythm, and cadence)
3. AI signature vocabulary & clichés (e.g. delve, tapestry, testament, crucial, furthermore, moreover, in conclusion, holistic)
4. Formulaic syntactic templates and binary contrasts

Calibration:
- Real human text: aiScore 0-25, humanScore 75-100, verdict "Highly Likely Human".
- Mixed / edited text: aiScore 35-65, humanScore 35-65, verdict "Mixed AI & Human".
- AI generated text: aiScore 70-100, humanScore 0-30, verdict "Entirely AI-Generated Content".

Respond strictly with valid JSON only, without markdown fences or preamble:
{
  "aiScore": <number 0-100>,
  "humanScore": <number 0-100>,
  "verdict": "<Entirely AI-Generated Content | Mixed AI & Human | Highly Likely Human>",
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

  let lastError = null;

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
        const jsonMatch = raw.match(/\{[\s\S]*\}/);

        let parsed;
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (e) {}
        }

        if (parsed && (parsed.aiScore !== undefined || parsed.verdict)) {
          return { status: 200, data: parsed };
        }
      } else {
        const errText = await response.text();
        lastError = `Model ${model} returned ${response.status}: ${errText}`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return { status: 502, data: { error: "Service temporarily busy, please try again.", details: lastError } };
}

/**
 * AI Image Detection Engine
 */
const IMAGE_SYSTEM_PROMPT = `You are a world-class forensic AI Image & Deepfake Detector.
Carefully examine the visual features of the provided image to determine if it is:
1. A real human camera photograph / smartphone snapshot / DSLR photo.
2. A real human hand-drawn illustration or graphic artwork.
3. An AI-generated synthetic image (Midjourney, DALL-E 3, Stable Diffusion, Flux, Ideogram, Leonardo.ai, Adobe Firefly).
4. A digital deepfake or AI face swap.

Examine these forensic factors:
- Anatomy & Details: Finger counts, knuckle articulation, eye symmetry, specular iris reflections, teeth regularity, ear folds.
- Textures & Skin: Natural skin pores/freckles/imperfections vs synthetic wax smoothing, airbrushed sheen, blurred hair strands.
- Lighting & Physics: Natural optical physics and single-source shadows vs physically impossible multi-directional highlights or hyper-glow.
- Background Coherence: Natural spatial geometry vs warped perspective, melting peripheral objects, pseudo-gibberish text.
- Camera Physics: Natural lens depth-of-field, sensor noise / film grain vs artificial Gaussian blur.

Calibration rules:
- Authentic Real Human Photo / Smartphone / DSLR Camera: aiProbability 1-15, humanProbability 85-99, verdict "Authentic Human Photo / Camera Capture", suspectedEngine "Smartphone / DSLR Camera".
- Authentic Human Hand-Drawn Artwork / Graphic: aiProbability 5-20, humanProbability 80-95, verdict "Authentic Human Artwork / Illustration", suspectedEngine "Hand-drawn / Digital Art".
- AI Generated Image: aiProbability 80-99, humanProbability 1-20, verdict "AI-Generated Image Detected", suspectedEngine "Midjourney / Diffusion Model" (or DALL-E / Flux).
- AI Deepfake / Synthetic Face: aiProbability 85-99, humanProbability 1-15, verdict "AI Deepfake / Synthetic Face Detected", suspectedEngine "Face Swap / Deepfake Synthesis".

Respond strictly with valid JSON only, without markdown fences or preamble:
{
  "aiProbability": <number 0-100, e.g. 96 or 8>,
  "humanProbability": <number 0-100, e.g. 4 or 92>,
  "verdict": "<AI-Generated Image Detected | Authentic Human Photo / Camera Capture | Authentic Human Artwork / Illustration | AI Deepfake / Synthetic Face Detected | Mixed / AI-Edited Image>",
  "suspectedEngine": "<Midjourney v6 | DALL-E 3 | Flux / Stable Diffusion | Smartphone / DSLR Camera | Hand-drawn Art | Unknown>",
  "checklist": {
    "anatomy": "<Natural Human Anatomy | Minor Artifacts | AI Anatomical Anomalies>",
    "skinAndTextures": "<Realistic Natural Textures | Synthetic / Airbrushed Sheen>",
    "lightingAndPhysics": "<Natural Optical Physics | Unnatural Ambient Glow / Multi-light>",
    "backgroundCoherence": "<Sharp & Coherent | Melting Geometry / Distorted Background>"
  },
  "explanation": "<2-3 concise sentences detailing the specific visual evidence and forensic findings in this image>"
}`;

async function runImageDetect(base64Data, mimeType = "image/jpeg", apiKey) {
  if (!base64Data) {
    return { status: 400, data: { error: "No image data provided" } };
  }

  if (!apiKey) {
    return { status: 500, data: { error: "Server misconfigured: GEMINI_API_KEY not set." } };
  }

  // Clean pure base64
  const cleanedBase64 = base64Data.replace(/^data:image\/[a-zA-Z+]+;base64,/, "").trim();

  // Normalize mime type for Gemini API
  let normMime = (mimeType || "image/jpeg").toLowerCase();
  if (normMime === "image/jpg") normMime = "image/jpeg";
  if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(normMime)) {
    normMime = "image/jpeg";
  }

  let lastError = null;

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
                  inlineData: {
                    mimeType: normMime,
                    data: cleanedBase64
                  }
                },
                {
                  text: "Perform forensic analysis on this image to determine whether it is an AI-generated image (Midjourney, DALL-E, Flux, Stable Diffusion), a digital deepfake, or an authentic human camera photograph/artwork. Output strictly JSON."
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
        const jsonMatch = raw.match(/\{[\s\S]*\}/);

        let parsed;
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch (e) {}
        }

        if (parsed && (parsed.aiProbability !== undefined || parsed.verdict)) {
          return { status: 200, data: parsed };
        }
      } else {
        const errText = await response.text();
        lastError = `Model ${model} returned ${response.status}: ${errText}`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return { status: 502, data: { error: "Image analysis temporarily busy, please try again.", details: lastError } };
}

module.exports = {
  runTextDetect,
  runImageDetect,
  MAX_TEXT_CHARS
};
