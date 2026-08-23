// server.js
//
// Standalone Express server. This is the MOST portable option — it
// doesn't depend on Netlify or Vercel's function conventions at all,
// so it runs anywhere Node runs: a VPS, Render, Railway, Fly.io, or
// inside a Docker container.
//
// This is also the right backend to use if you convert ToolX Pro into
// an Android APK later (via Capacitor/Median/GoNative/WebView wrapper):
// the APK will just be your frontend making requests to whatever URL
// this server is deployed at — it doesn't care that the frontend is
// running inside a native app shell instead of a browser tab.
//
// Run locally:   npm install && node server.js
// Deploy: push this repo to Render/Railway, set GEMINI_API_KEY in
// their dashboard, point it at "node server.js" as the start command.

const express = require("express");
const cors = require("cors");
const { runGrammarFix } = require("./lib/grammar-core");

const app = express();
app.use(cors()); // lock this down to your real domain(s) before going live
app.use(express.json({ limit: "1mb" }));

app.post("/api/grammar-fix", async (req, res) => {
  const text = (req.body?.text || "").toString();
  const { status, data } = await runGrammarFix(text, process.env.GEMINI_API_KEY);
  res.status(status).json(data);
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Grammar fixer API running on http://localhost:${PORT}`);
});
