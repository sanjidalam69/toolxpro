// netlify/functions/grammar-fix.js
// Thin Netlify adapter. All real logic lives in lib/grammar-core.js.

const { runGrammarFix } = require("../../lib/grammar-core");

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

  let text, tone;
  try {
    const body = JSON.parse(event.body || "{}");
    text = (body.text || "").toString();
    tone = (body.tone || "standard").toString();
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { status, data } = await runGrammarFix(text, process.env.GEMINI_API_KEY, tone);
  return { statusCode: status, headers, body: JSON.stringify(data) };
};
