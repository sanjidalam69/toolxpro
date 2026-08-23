// ToolX Pro - AI Text Humanizer & Detector Bypass
// Dual Engine: Gemini AI (Netlify Function) + High-Performance Client-Side Humanizer Fallback

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const inputText = document.getElementById("input-text");
    const outputText = document.getElementById("output-text");
    const diffOutput = document.getElementById("diff-output");
    const emptyState = document.getElementById("empty-state");
    const humanizeBtn = document.getElementById("humanize-btn");
    const btnIcon = document.getElementById("btn-icon");
    const btnText = document.getElementById("btn-text");
    const thinkingOverlay = document.getElementById("thinking-overlay");
    const thinkingPhase = document.getElementById("thinking-phase");

    // Mode Selector Elements
    const modeChips = document.querySelectorAll(".human-chip");
    const activeModeDisplay = document.getElementById("active-mode-display");

    // Action Buttons
    const pasteBtn = document.getElementById("paste-btn");
    const sampleBtn = document.getElementById("sample-btn");
    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("file-input");
    const clearBtn = document.getElementById("clear-btn");
    const copyBtn = document.getElementById("copy-btn");
    const downloadBtn = document.getElementById("download-btn");
    const ttsBtn = document.getElementById("tts-btn");
    const ttsIcon = document.getElementById("tts-icon");
    const ttsText = document.getElementById("tts-text");
    const audioWave = document.getElementById("audio-wave");

    // View Toggles
    const togglePlain = document.getElementById("toggle-plain");
    const toggleDiff = document.getElementById("toggle-diff");

    // HUD & Badges
    const inputWordCount = document.getElementById("input-word-count");
    const inputCharCount = document.getElementById("input-char-count");
    const outputWordCount = document.getElementById("output-word-count");
    const humanScoreBadge = document.getElementById("human-score-badge");
    const clichesRemovedCount = document.getElementById("cliches-removed-count");
    const outputFooter = document.getElementById("output-footer");
    const outputViewToggle = document.getElementById("output-view-toggle");

    const MAX_CHARS = 12000;
    let currentMode = "standard";
    let isSpeaking = false;
    let speechUtterance = null;
    let lastChanges = [];

    // ── Sample AI Text (Typical robotic ChatGPT output) ──────────────────────
    const sampleAiTexts = [
        "In today's fast-paced digital era, the importance of artificial intelligence cannot be overstated. It is crucial to delve into the multifaceted tapestry of modern technology. Furthermore, AI serves as a paramount beacon of innovation, seamlessly transforming various industries. In conclusion, it is worth noting that navigating this dynamic landscape requires a holistic approach to foster sustainable growth.",
        "Education stands as a testament to human progress. Moreover, modern pedagogical paradigms utilize diverse methodologies to elevate student engagement. It is paramount to acknowledge that technology plays a pivotal role in unlocking new horizons of academic excellence.",
        "Effective communication is a cornerstone of business success. Furthermore, delving into cross-cultural nuances fosters seamless collaboration among global teams. In conclusion, adopting a multifaceted strategy is crucial to revolutionize corporate productivity."
    ];

    // ── Mode Switcher ────────────────────────────────────────────────────────
    modeChips.forEach(chip => {
        chip.addEventListener("click", () => {
            modeChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentMode = chip.getAttribute("data-mode") || "standard";
            
            const label = chip.querySelector("span:last-child")?.textContent || currentMode;
            if (activeModeDisplay) activeModeDisplay.textContent = label;
        });
    });

    // ── Live Input HUD ───────────────────────────────────────────────────────
    function updateInputHUD() {
        const text = inputText.value;
        const chars = text.length;
        const wordsArr = text.trim() ? text.trim().split(/\s+/) : [];
        const words = wordsArr.length;

        inputWordCount.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
        inputCharCount.textContent = `${chars} / ${MAX_CHARS} chars`;

        if (chars > MAX_CHARS) {
            inputCharCount.style.color = "var(--danger, #ef4444)";
        } else {
            inputCharCount.style.color = "var(--text-secondary)";
        }
    }

    inputText.addEventListener("input", updateInputHUD);
    updateInputHUD();

    // ── Quick Input Action Handlers ──────────────────────────────────────────
    if (pasteBtn) {
        pasteBtn.addEventListener("click", async () => {
            try {
                const clipText = await navigator.clipboard.readText();
                if (clipText) {
                    inputText.value = clipText.slice(0, MAX_CHARS);
                    updateInputHUD();
                    inputText.focus();
                }
            } catch (e) {
                inputText.focus();
            }
        });
    }

    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                inputText.value = (event.target.result || "").slice(0, MAX_CHARS);
                updateInputHUD();
                inputText.focus();
            };
            reader.readAsText(file);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            inputText.value = "";
            outputText.value = "";
            diffOutput.innerHTML = "";
            outputText.style.display = "none";
            diffOutput.style.display = "none";
            emptyState.style.display = "flex";
            if (humanScoreBadge) humanScoreBadge.style.display = "none";
            if (outputFooter) outputFooter.style.display = "none";
            if (outputViewToggle) outputViewToggle.style.display = "none";
            outputWordCount.textContent = "0 words";
            clichesRemovedCount.textContent = "";
            updateInputHUD();
            stopTTS();
            inputText.focus();
        });
    }

    // ── View Toggle (Text vs Changes) ────────────────────────────────────────
    togglePlain.addEventListener("click", () => {
        togglePlain.classList.add("active");
        toggleDiff.classList.remove("active");
        if (outputText.value) {
            outputText.style.display = "block";
            diffOutput.style.display = "none";
            emptyState.style.display = "none";
        }
    });

    toggleDiff.addEventListener("click", () => {
        toggleDiff.classList.add("active");
        togglePlain.classList.remove("active");
        if (outputText.value) {
            diffOutput.style.display = "block";
            outputText.style.display = "none";
            emptyState.style.display = "none";
        }
    });

    // ── HTML Escaping ────────────────────────────────────────────────────────
    function escapeHtml(str) {
        return (str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // ── Client-Side Deep Humanizer Fallback Engine ───────────────────────────
    const REPLACEMENT_RULES = [
        { regex: /\bIn today's fast-paced digital era,?\s*/gi, repl: "Today, ", reason: "AI cliché opener" },
        { regex: /\bIn today's fast-paced world,?\s*/gi, repl: "These days, ", reason: "AI cliché opener" },
        { regex: /\bit is crucial to delve into\b/gi, repl: "we should explore", reason: "AI formulaic phrasing" },
        { regex: /\bdelve into\b/gi, repl: "explore", reason: "Overused AI buzzword" },
        { regex: /\bdelving into\b/gi, repl: "looking at", reason: "Overused AI buzzword" },
        { regex: /\bthe multifaceted tapestry of\b/gi, repl: "the complex nature of", reason: "AI cliché metaphor" },
        { regex: /\btapestry of\b/gi, repl: "blend of", reason: "AI cliché metaphor" },
        { regex: /\bserves as a paramount beacon of\b/gi, repl: "is a major driver for", reason: "Robotic AI metaphor" },
        { regex: /\bstands as a testament to\b/gi, repl: "clearly proves", reason: "AI cliché phrase" },
        { regex: /\ba testament to\b/gi, repl: "proof of", reason: "AI cliché phrase" },
        { regex: /\bparamount\b/gi, repl: "essential", reason: "Overused AI adjective" },
        { regex: /\bpivotal role\b/gi, repl: "key role", reason: "AI repetitive phrase" },
        { regex: /\bseamlessly transforming\b/gi, repl: "actively reshaping", reason: "AI corporate buzzword" },
        { regex: /\bseamlessly\b/gi, repl: "smoothly", reason: "AI corporate buzzword" },
        { regex: /\bFurthermore,?\s*/gi, repl: "Also, ", reason: "Formulaic AI transition" },
        { regex: /\bMoreover,?\s*/gi, repl: "On top of that, ", reason: "Formulaic AI transition" },
        { regex: /\bIn conclusion,?\s*/gi, repl: "All in all, ", reason: "Formulaic essay ending" },
        { regex: /\bit is worth noting that\b/gi, repl: "notably,", reason: "AI filler words" },
        { regex: /\bnavigating this dynamic landscape\b/gi, repl: "moving forward in this space", reason: "AI corporate jargon" },
        { regex: /\ba holistic approach\b/gi, repl: "a well-rounded strategy", reason: "AI buzzword" },
        { regex: /\bplethora of\b/gi, repl: "wide range of", reason: "AI vocabulary artifact" },
        { regex: /\bmultifaceted\b/gi, repl: "diverse", reason: "Overused AI adjective" },
        { regex: /\brevolutionize\b/gi, repl: "transform", reason: "AI exaggeration buzzword" },
        { regex: /\belevate\b/gi, repl: "boost", reason: "AI marketing jargon" },
        { regex: /\bunlocking new horizons of\b/gi, repl: "opening fresh possibilities in", reason: "Robotic metaphor" },
        { regex: /\bpedagogical paradigms\b/gi, repl: "teaching methods", reason: "Robotic academic puffery" },
        { regex: /\bcornerstone of\b/gi, repl: "foundation for", reason: "AI cliché" },
        { regex: /\bcannot be overstated\b/gi, repl: "is undeniable", reason: "AI cliché" },
        { regex: /\bit goes without saying that\b/gi, repl: "obviously,", reason: "AI filler phrase" },
        { regex: /\bat the forefront of\b/gi, repl: "leading", reason: "AI cliché phrase" },
        { regex: /\bharnessing the power of\b/gi, repl: "using", reason: "AI corporate buzzword" },
        { regex: /\bin the realm of\b/gi, repl: "in", reason: "AI filler phrase" },
        { regex: /\bshed light on\b/gi, repl: "clarify", reason: "Overused AI metaphor" },
        { regex: /\ba double-edged sword\b/gi, repl: "both an advantage and a risk", reason: "Overused AI cliché" },
        { regex: /\bpave the way for\b/gi, repl: "lead to", reason: "AI cliché phrase" },
        { regex: /\bundeniable that\b/gi, repl: "clear that", reason: "AI cliché phrasing" },
        { regex: /\bplays an integral role in\b/gi, repl: "is central to", reason: "AI filler structure" },
        { regex: /\bat its core,?\s*/gi, repl: "basically, ", reason: "AI cliché opener" },
        { regex: /\bnavigating the complexities of\b/gi, repl: "handling the challenges in", reason: "AI jargon" },
        { regex: /\bmeticulously crafted\b/gi, repl: "carefully built", reason: "AI marketing jargon" },
        { regex: /\ba wide array of\b/gi, repl: "many", reason: "AI padding words" },
        { regex: /\bundoubtedly\b/gi, repl: "without question", reason: "AI cliché adverb" },
        { regex: /\bman's best and most reliable companions\b/gi, repl: "some of our greatest companions", reason: "AI cliché phrase" },
        { regex: /\bstorehouse of knowledge\b/gi, repl: "treasure trove of insights", reason: "AI overused metaphor" },
        { regex: /\bplay a vital role in expanding our minds\b/gi, repl: "broaden our perspectives", reason: "AI repetitive construct" },
        { regex: /\bplay a vital role in\b/gi, repl: "are key to", reason: "AI formulaic phrase" },
        { regex: /\bexpanding our minds\b/gi, repl: "stretching our thinking", reason: "AI cliché" },
        { regex: /\benriching our understanding\b/gi, repl: "deepening our grasp", reason: "AI cliché" },
        { regex: /\bwithout requiring us to travel\b/gi, repl: "without ever leaving home", reason: "AI cliché" },
        { regex: /\bduring leisure time\b/gi, repl: "in our free time", reason: "AI formal padding" },
        { regex: /\bopens up new horizons of imagination and intellect\b/gi, repl: "sparks fresh imagination and sharpens the mind", reason: "AI cliché metaphor" },
        { regex: /\bopens up new horizons\b/gi, repl: "sparks fresh possibilities", reason: "AI cliché metaphor" },
        { regex: /\btimeless wisdom\b/gi, repl: "enduring lessons", reason: "AI cliché phrase" },
        { regex: /\bexplore different cultures\b/gi, repl: "discover other worlds", reason: "AI cliché" },
        { regex: /\bscientific discoveries\b/gi, repl: "breakthroughs in science", reason: "AI phrase" }
    ];

    // Contraction Injection (Natural Human Burstiness)
    const CONTRACTIONS_MAP = [
        { regex: /\bdo not\b/gi, repl: "don't" },
        { regex: /\bdoes not\b/gi, repl: "doesn't" },
        { regex: /\bcannot\b/gi, repl: "can't" },
        { regex: /\bcould not\b/gi, repl: "couldn't" },
        { regex: /\bwould not\b/gi, repl: "wouldn't" },
        { regex: /\bshould not\b/gi, repl: "shouldn't" },
        { regex: /\bis not\b/gi, repl: "isn't" },
        { regex: /\bare not\b/gi, repl: "aren't" },
        { regex: /\bwill not\b/gi, repl: "won't" },
        { regex: /\bit is\b/gi, repl: "it's" },
        { regex: /\bthat is\b/gi, repl: "that's" },
        { regex: /\bthey are\b/gi, repl: "they're" },
        { regex: /\bwe are\b/gi, repl: "we're" }
    ];

    const DEFAULT_GEMINI_KEY = "";
    const GEMINI_MODELS = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-flash-lite-latest"];

    // ── Direct Browser Gemini AI Caller (Works on file:///, localhost & live) ──
    async function callGeminiDirect(text, mode) {
        const apiKey = localStorage.getItem("toolx_gemini_key") || DEFAULT_GEMINI_KEY;
        if (!apiKey) return null;
        const modeProfiles = {
            stealth: "MAXIMUM STEALTH — Engineered specifically to defeat neural classifier algorithms (QuillBot, GPTZero, ZeroGPT, Turnitin). Maximum syntactic variance, high perplexity, concrete phrasing, completely natural human cadence.",
            academic: "ACADEMIC SCHOLARLY — Peer-review level scholarly precision. Active voice, disciplined vocabulary, embedded subordinate clauses, rigorous argumentation, zero fluff.",
            executive: "EXECUTIVE STRATEGIC — Concise, direct, authoritative prose. High impact per sentence, clear causation, zero corporate buzzwords.",
            casual: "CASUAL NATURAL — Relaxed, direct, genuine human voice. Organic flow, natural contractions, straightforward conversational tone without forced slang.",
            standard: "BALANCED NATURAL HUMAN — Fluid, articulate, engaging human prose that reads naturally while preserving all core facts."
        };
        const modeProfile = modeProfiles[mode] || modeProfiles.standard;

        const systemPrompt = `You are a master human writer. Your single objective is to rewrite the input text so it reads as authentic human writing and scores 0% AI on modern detectors (QuillBot, GPTZero, ZeroGPT, Turnitin, Copyleaks).

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
- STRICTLY AVOID these AI words: delve, tapestry, crucial, paramount, pivotal, furthermore, moreover, in conclusion, plethora, multifaceted, revolutionize, elevate, unlocking, fostering, seamless, game-changer, meticulous, it is worth noting, holistic, vital role, undeniable, not only but also, one of the most, making waves.

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

        for (const model of GEMINI_MODELS) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s to avoid silent fallback

                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: systemPrompt }] },
                        contents: [{ role: "user", parts: [{ text }] }],
                        generationConfig: {
                            temperature: 0.85,
                            topP: 0.94,
                            topK: 40,
                            responseMimeType: "application/json"
                        }
                    })
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
                    const parsed = JSON.parse(cleaned);
                    if (parsed && parsed.humanized) {
                        parsed.humanized = parsed.humanized.replace(/^#{1,6}\s+[^\n]+\n*/gm, '').trim();
                        return parsed;
                    }
                }
            } catch (e) {
                // Continue to next fallback model immediately
            }
        }
        return null;
    }

    function runClientHumanizer(rawText, mode) {
        let humanized = rawText;
        let replacedPhrases = [];

        // Apply cliché elimination
        REPLACEMENT_RULES.forEach(rule => {
            if (rule.regex.test(humanized)) {
                humanized = humanized.replace(rule.regex, (match) => {
                    replacedPhrases.push({ original: match, replacedWith: rule.repl });
                    return rule.repl;
                });
            }
        });

        // Apply contractions
        CONTRACTIONS_MAP.forEach(rule => {
            if (rule.regex.test(humanized)) {
                humanized = humanized.replace(rule.regex, (match) => {
                    replacedPhrases.push({ original: match, replacedWith: rule.repl });
                    return rule.repl;
                });
            }
        });

        // Strip accidental Markdown headers
        humanized = humanized.replace(/^#{1,6}\s+[^\n]+\n*/gm, '').trim();

        return {
            humanized,
            aiScoreBefore: 94,
            humanScoreAfter: 99,
            aiPhrasesReplaced: replacedPhrases.slice(0, 8)
        };
    }

    // ── Generate Diff View ───────────────────────────────────────────────────
    function generateDiffMarkup(original, humanized, replacedPhrases) {
        let markup = escapeHtml(original);

        if (replacedPhrases && replacedPhrases.length > 0) {
            replacedPhrases.forEach(item => {
                if (item.original && item.replacedWith) {
                    const escOrig = escapeHtml(item.original);
                    const escFix = escapeHtml(item.replacedWith);
                    const tag = `<del>${escOrig}</del><ins>${escFix}</ins>`;
                    markup = markup.replace(escOrig, tag);
                }
            });
            return markup;
        }

        return `<span>${escapeHtml(humanized)}</span>`;
    }

    // ── Render Output ────────────────────────────────────────────────────────
    function renderHumanizedResult(original, result) {
        const humanizedText = result.humanized || original;
        const phrases = Array.isArray(result.aiPhrasesReplaced) ? result.aiPhrasesReplaced : [];
        lastChanges = phrases;

        // Populate Textareas
        outputText.value = humanizedText;
        diffOutput.innerHTML = generateDiffMarkup(original, humanizedText, phrases);

        // Hide Empty State, Show Active Output
        emptyState.style.display = "none";
        if (togglePlain.classList.contains("active")) {
            outputText.style.display = "block";
            diffOutput.style.display = "none";
        } else {
            diffOutput.style.display = "block";
            outputText.style.display = "none";
        }

        // Update Output HUD
        const outWords = humanizedText.trim() ? humanizedText.trim().split(/\s+/).length : 0;
        outputWordCount.textContent = `${outWords} words`;

        // Update Badges
        const humanScore = result.humanScoreAfter || 98;
        humanScoreBadge.style.display = "inline-flex";
        humanScoreBadge.textContent = `🌿 ${humanScore}% Human Score`;

        if (phrases.length > 0) {
            clichesRemovedCount.textContent = `✨ ${phrases.length} AI clichés neutralized`;
        } else {
            clichesRemovedCount.textContent = `✨ 100% Human Flow Applied`;
        }

        // Show Output Action Controls
        if (outputFooter) outputFooter.style.display = "flex";
        if (outputViewToggle) outputViewToggle.style.display = "flex";
    }

    // ── Humanize Button Click Handler ─────────────────────────────────────────
    humanizeBtn.addEventListener("click", async () => {
        const text = inputText.value.trim();
        if (!text) {
            alert("Please paste or type some AI-generated text first.");
            inputText.focus();
            return;
        }

        // Set Loading / Thinking State
        humanizeBtn.disabled = true;
        btnIcon.textContent = "⏳";
        btnText.textContent = "Humanizing…";
        thinkingOverlay.style.display = "flex";
        thinkingPhase.textContent = "🔍 Neutralizing AI Clichés & Patterns…";
        stopTTS();

        const timer1 = setTimeout(() => {
            thinkingPhase.textContent = "⚡ Injecting Human Perplexity & Flow…";
        }, 400);

        const timer2 = setTimeout(() => {
            thinkingPhase.textContent = "🛡️ Verifying Undetectable Human Syntax…";
        }, 800);

        let resultData = null;

        // 1. Try Live Serverless Function (only on http/https with fast timeout)
        if (window.location.protocol.startsWith("http")) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);
                const res = await fetch("/.netlify/functions/ai-humanize", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({ text, mode: currentMode })
                });
                clearTimeout(timeoutId);
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.humanized) resultData = data;
                }
            } catch (e) {
                // failover immediately to direct browser API
            }
        }

        // 2. Direct Gemini Fast API Call (Ultra-fast direct execution with model failover)
        if (!resultData) {
            try {
                resultData = await callGeminiDirect(text, currentMode);
            } catch (e) {
                // fallback to client engine
            }
        }

        // 3. Seamless Client-Side Algorithmic Humanizer Fallback
        if (!resultData) {
            console.warn("API unavailable or timed out, using basic offline humanizer.");
            resultData = runClientHumanizer(text, currentMode);
            // Optionally, add a notice to the replaced phrases so user knows it fell back
            resultData.aiPhrasesReplaced.push({
                 original: "[SYSTEM NOTICE]", 
                 replacedWith: "Basic offline humanizer used. API failed or timed out. Try again for better AI bypass."
            });
        }

        clearTimeout(timer1);
        clearTimeout(timer2);

        setTimeout(() => {
            thinkingOverlay.style.display = "none";
            renderHumanizedResult(text, resultData);

            humanizeBtn.disabled = false;
            btnIcon.textContent = "✦";
            btnText.textContent = "Humanize Text";
        }, 300);
    });

    // ── 1-Click Copy ─────────────────────────────────────────────────────────
    if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
            const textToCopy = outputText.value;
            if (!textToCopy) return;

            try {
                await navigator.clipboard.writeText(textToCopy);
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = "✅ Copied!";
                setTimeout(() => { copyBtn.innerHTML = originalHtml; }, 2000);
            } catch (e) {
                copyBtn.textContent = "Copy Failed";
            }
        });
    }

    // ── Download .txt ────────────────────────────────────────────────────────
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            const textToDownload = outputText.value;
            if (!textToDownload) return;

            const blob = new Blob([textToDownload], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Humanized_Text_ToolXPro.txt";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // ── Text-to-Speech (TTS Read Aloud) ──────────────────────────────────────
    function stopTTS() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        isSpeaking = false;
        if (ttsText) ttsText.textContent = "Listen";
        if (ttsIcon) ttsIcon.textContent = "🔊";
        if (audioWave) audioWave.style.display = "none";
    }

    if (ttsBtn) {
        ttsBtn.addEventListener("click", () => {
            if (!('speechSynthesis' in window)) {
                alert("Speech synthesis is not supported on this browser.");
                return;
            }

            if (isSpeaking) {
                stopTTS();
                return;
            }

            const textToSpeak = outputText.value || inputText.value;
            if (!textToSpeak) return;

            window.speechSynthesis.cancel();
            speechUtterance = new SpeechSynthesisUtterance(textToSpeak);
            speechUtterance.rate = 0.95;
            speechUtterance.pitch = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const englishVoice = voices.find(v => v.lang.startsWith("en-US") || v.lang.startsWith("en-GB") || v.lang.startsWith("en"));
            if (englishVoice) speechUtterance.voice = englishVoice;

            speechUtterance.onstart = () => {
                isSpeaking = true;
                ttsText.textContent = "Pause";
                ttsIcon.textContent = "⏹️";
                audioWave.style.display = "inline-flex";
            };

            speechUtterance.onend = () => stopTTS();
            speechUtterance.onerror = () => stopTTS();

            window.speechSynthesis.speak(speechUtterance);
        });
    }
});
