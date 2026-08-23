// netlify/functions/ai-humanize.js
// Netlify serverless handler for AI Text Humanizer

const { runHumanize } = require("../../lib/humanizer-core");

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

  let text, mode;
  try {
    const body = JSON.parse(event.body || "{}");
    text = (body.text || "").toString();
    mode = (body.mode || "standard").toString();
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { status, data } = await runHumanize(text, process.env.GEMINI_API_KEY, mode);
  return { statusCode: status, headers, body: JSON.stringify(data) };
};
