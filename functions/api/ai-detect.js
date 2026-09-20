// functions/api/ai-detect.js
// Cloudflare Pages Function for AI Content & Image Detector (Gemini Vision AI)

const MAX_TEXT_CHARS = 10000;
const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-pro",
  "gemini-1.5-flash-8b",
  "gemini-2.0-flash-lite"
];

const TEXT_SYSTEM_PROMPT = `You are an expert, unbiased AI Content Detector.
Analyze the provided text and determine whether it was authored by an AI language model (ChatGPT, Claude, Gemini, DeepSeek, LLaMA) or a human.

Evaluate:
1. Perplexity (predictability of vocabulary sequences and repetitive phrasing)
2. Burstiness (variation in sentence lengths, structural rhythm, and cadence)
3. AI signature vocabulary & clichés (e.g. delve, tapestry, testament, crucial, furthermore, moreover, in conclusion, holistic, pivotal, unlock)
4. Formulaic syntactic templates and binary contrasts
5. Multilingual fluency (English, Bengali, Spanish, etc.)

Calibration:
- Real human text: aiScore 1-25, humanScore 75-99, verdict "Highly Likely Human".
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

const IMAGE_SYSTEM_PROMPT = `You are a world-class forensic AI Image, Deepfake & Graphic Media Detector.
Carefully examine the visual features, composition, typography, and optical properties of the provided image to determine its exact category:

1. AUTHENTIC DIGITAL GRAPHIC / NEWS POSTER / SOCIAL MEDIA CARD:
   - Social media news cards, editorial posters, infographics, YouTube thumbnails, flyer layouts with typography headlines (in Bengali, English, etc.), logos, cutout photo inserts, and solid/gradient design banners created by human graphic designers.
   - Classification: aiProbability 2-12%, humanProbability 88-98%, verdict "Authentic Human Graphic Design / News Poster", suspectedEngine "Digital Graphic Suite / Editorial Layout (Human Design)".
   - Checklist: anatomy "Crisp Typography & Vector Layout", skinAndTextures "Solid Graphic Fills & Cutouts", lightingAndPhysics "Digital Palette & Brand Graphics", backgroundCoherence "Structured Card & Banner Layout".

2. AUTHENTIC HUMAN CAMERA PHOTOGRAPH:
   - Real photographs captured via smartphone cameras (iPhone, Samsung, Xiaomi, Pixel), DSLRs, or mirrorless cameras.
   - Natural optical depth of field, physical sensor shot noise (PRNU), organic specular highlights, realistic skin pores, hair strands, and consistent single/physical light sources.
   - Classification: aiProbability 1-15%, humanProbability 85-99%, verdict "Authentic Human Photo / Camera Capture", suspectedEngine "Smartphone / DSLR Camera".
   - Checklist: anatomy "Natural Human Anatomy", skinAndTextures "Realistic Optical Pores & Texture", lightingAndPhysics "Natural Optical Physics", backgroundCoherence "Coherent Lens Depth & Optics".

3. AUTHENTIC HUMAN ARTWORK / ILLUSTRATION:
   - Hand-drawn sketches, traditional oil/watercolor paintings, vector art illustrations, or digital drawings made by human artists.
   - Classification: aiProbability 3-18%, humanProbability 82-97%, verdict "Authentic Human Artwork / Illustration", suspectedEngine "Hand-drawn / Digital Art Suite".

4. AI-GENERATED SYNTHETIC IMAGE:
   - Images fully synthesized by Generative AI diffusion models (Midjourney v5/v6, FLUX.1, DALL-E 3, Stable Diffusion SDXL, Imagen 3, Leonardo.ai, Ideogram).
   - Forensic indicators: diffusion micro-smoothing, plastic/waxy skin sheen, anatomical anomalies (hands/eyes/teeth), physically inconsistent multi-directional ambient glow, warping/melting peripheral objects, or pseudo-gibberish background text.
   - Classification: aiProbability 82-99%, humanProbability 1-18%, verdict "AI-Generated Image Detected", suspectedEngine "Midjourney v6 / FLUX.1 / Stable Diffusion" (or specific model identified).
   - Checklist: anatomy "AI Artifacts & Anomalies", skinAndTextures "Synthetic / Airbrushed Sheen", lightingAndPhysics "Unnatural Multi-directional Glow", backgroundCoherence "Melting Geometry / Latent Artifacts".

5. AI DEEPFAKE / SYNTHETIC FACE:
   - AI face swap or generated human portrait with facial blending anomalies, artificial iris reflections, waxy skin, or boundary seams.
   - Classification: aiProbability 86-99%, humanProbability 1-14%, verdict "AI Deepfake / Synthetic Face Detected", suspectedEngine "Face Swap / Deepfake Synthesis".

6. MIXED / AI-EDITED HYBRID:
   - AI generated artwork overlaid with human text/graphics or heavy AI generative fill on real photos.
   - Classification: aiProbability 40-75%, humanProbability 25-60%, verdict "Mixed / AI-Edited Image", suspectedEngine "Hybrid AI + Graphic Design".

Respond strictly with valid JSON only, without markdown fences or preamble:
{
  "aiProbability": <number 0-100, e.g. 8 or 96>,
  "humanProbability": <number 0-100, e.g. 92 or 4>,
  "verdict": "<Authentic Human Graphic Design / News Poster | Authentic Human Photo / Camera Capture | Authentic Human Artwork / Illustration | AI-Generated Image Detected | AI Deepfake / Synthetic Face Detected | Mixed / AI-Edited Image>",
  "suspectedEngine": "<Digital Graphic Suite / Editorial Layout (Human Design) | Smartphone / DSLR Camera | Midjourney v6 / FLUX.1 | DALL-E 3 | Stable Diffusion | Hand-drawn Art | Face Swap Synthesis>",
  "checklist": {
    "anatomy": "<string>",
    "skinAndTextures": "<string>",
    "lightingAndPhysics": "<string>",
    "backgroundCoherence": "<string>"
  },
  "explanation": "<2-3 concise sentences detailing the specific visual, structural, and forensic findings in this image>"
}`;

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
    const type = body.type || "text";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server GEMINI_API_KEY not configured." }), { status: 500, headers: corsHeaders });
    }

    if (type === "image") {
      const imageData = (body.image || "").toString();
      const mimeType = (body.mimeType || "image/jpeg").toLowerCase();

      if (!imageData) {
        return new Response(JSON.stringify({ error: "No image data provided" }), { status: 400, headers: corsHeaders });
      }

      const cleanedBase64 = imageData.replace(/^data:image\/[a-zA-Z+]+;base64,/, "").trim();
      let normMime = mimeType === "image/jpg" ? "image/jpeg" : mimeType;
      if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(normMime)) {
        normMime = "image/jpeg";
      }

      for (const model of MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: IMAGE_SYSTEM_PROMPT }] },
              contents: [{
                role: "user",
                parts: [
                  { inlineData: { mimeType: normMime, data: cleanedBase64 } },
                  { text: "Perform forensic analysis on this image to accurately determine whether it is a human-designed digital graphic / social media news poster, an authentic camera photograph, human artwork, or an AI-generated synthetic image. Output strictly JSON." }
                ]
              }],
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
              try { parsed = JSON.parse(jsonMatch[0]); } catch (e) {}
            }
            if (parsed && (parsed.aiProbability !== undefined || parsed.verdict)) {
              return new Response(JSON.stringify(parsed), { status: 200, headers: corsHeaders });
            }
          }
        } catch (err) {}
      }

      return new Response(JSON.stringify({ error: "Image analysis temporarily busy, please try again." }), { status: 502, headers: corsHeaders });

    } else {
      const text = (body.text || "").toString();
      if (!text || !text.trim()) {
        return new Response(JSON.stringify({ error: "No text provided" }), { status: 400, headers: corsHeaders });
      }

      if (text.length > MAX_TEXT_CHARS) {
        return new Response(JSON.stringify({ error: `Text too long. Max ${MAX_TEXT_CHARS} characters.` }), { status: 400, headers: corsHeaders });
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
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            let parsed;
            if (jsonMatch) {
              try { parsed = JSON.parse(jsonMatch[0]); } catch (e) {}
            }
            if (parsed && (parsed.aiScore !== undefined || parsed.verdict)) {
              return new Response(JSON.stringify(parsed), { status: 200, headers: corsHeaders });
            }
          }
        } catch (err) {}
      }

      return new Response(JSON.stringify({ error: "Text analysis temporarily busy, please try again." }), { status: 502, headers: corsHeaders });
    }
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
