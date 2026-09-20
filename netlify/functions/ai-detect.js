// netlify/functions/ai-detect.js
// Netlify serverless endpoint for Multi-Modal AI Content & Image Detector

const { runTextDetect, runImageDetect } = require("../../lib/detector-core");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const type = body.type || "text"; // "text" or "image"

    if (type === "image") {
      const imageData = body.image || "";
      const mimeType = body.mimeType || "image/jpeg";
      const { status, data } = await runImageDetect(imageData, mimeType, process.env.GEMINI_API_KEY);
      return { statusCode: status, headers, body: JSON.stringify(data) };
    } else {
      const text = (body.text || "").toString();
      const { status, data } = await runTextDetect(text, process.env.GEMINI_API_KEY);
      return { statusCode: status, headers, body: JSON.stringify(data) };
    }
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid request payload" }) };
  }
};
