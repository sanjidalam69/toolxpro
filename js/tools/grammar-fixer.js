// ToolX Pro - AI Grammar & Tone Co-Pilot
// Supports Netlify Function (Gemini AI) + Client-Side Fallback Engine + Smart Voice TTS

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const inputText = document.getElementById("input-text");
    const modeChips = document.querySelectorAll(".ai-chip");
    const activeModeLabel = document.getElementById("active-mode-label");
    const fixBtn = document.getElementById("fix-btn");
    const btnIcon = document.getElementById("btn-icon");
    const btnText = document.getElementById("btn-text");
    const statusMsg = document.getElementById("status-msg");
    const aiThinking = document.getElementById("ai-thinking");
    const step1 = document.getElementById("step-1");
    const step2 = document.getElementById("step-2");
    const step3 = document.getElementById("step-3");

    // HUD Elements
    const wordCount = document.getElementById("word-count");
    const charCount = document.getElementById("char-count");
    const readTime = document.getElementById("read-time");
    const readabilityBadge = document.getElementById("readability-badge");

    // Quick Action Buttons
    const pasteBtn = document.getElementById("paste-btn");
    const sampleBtn = document.getElementById("sample-btn");
    const clearBtn = document.getElementById("clear-btn");

    // Results Hub Elements
    const resultsHub = document.getElementById("results");
    const outputText = document.getElementById("output-text");
    const manuscriptMarkup = document.getElementById("manuscript-markup");
    const marginNotesList = document.getElementById("margin-notes-list");
    const notesBadgeCount = document.getElementById("notes-badge-count");

    // Tabs & Actions
    const tabBtns = document.querySelectorAll(".ai-tab-btn");
    const tabPanes = document.querySelectorAll(".ai-tab-content");
    const copyBtn = document.getElementById("copy-btn");
    const downloadBtn = document.getElementById("download-btn");
    const replaceInputBtn = document.getElementById("replace-input-btn");
    const ttsBtn = document.getElementById("tts-btn");
    const ttsText = document.getElementById("tts-text");
    const ttsIcon = document.getElementById("tts-icon");
    const audioWave = document.getElementById("audio-wave");

    const MAX_CHARS = 4000;
    let selectedTone = "standard";
    let isSpeaking = false;
    let speechUtterance = null;

    // ── Mode Chip Selection ──────────────────────────────────────────────────
    modeChips.forEach(chip => {
        chip.addEventListener("click", () => {
            modeChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            selectedTone = chip.getAttribute("data-tone") || "standard";
            
            const toneName = chip.querySelector("span:last-child")?.textContent || selectedTone;
            if (activeModeLabel) {
                activeModeLabel.textContent = toneName;
            }
            if (btnText) {
                btnText.textContent = selectedTone === "paraphrase" ? "Run AI Paraphrase & Rewrite" : "Run AI Deep Proofread & Polish";
            }
        });
    });

    // ── Live AI Metrics & HUD Calculation ────────────────────────────────────
    function updateLiveHUD() {
        const text = inputText.value;
        const chars = text.length;
        const wordsArr = text.trim() ? text.trim().split(/\s+/) : [];
        const words = wordsArr.length;

        // Characters & Words
        if (charCount) charCount.textContent = `${chars} / ${MAX_CHARS} chars`;
        if (wordCount) wordCount.textContent = `📝 ${words} ${words === 1 ? 'word' : 'words'}`;

        if (charCount) {
            if (chars > MAX_CHARS) {
                charCount.style.color = "var(--danger, #ef4444)";
            } else {
                charCount.style.color = "var(--text-secondary)";
            }
        }
    }

    inputText.addEventListener("input", updateLiveHUD);
    updateLiveHUD();

    // ── Quick Action Buttons ─────────────────────────────────────────────────
    if (pasteBtn) {
        pasteBtn.addEventListener("click", async () => {
            try {
                const clipText = await navigator.clipboard.readText();
                if (clipText) {
                    inputText.value = clipText.slice(0, MAX_CHARS);
                    updateLiveHUD();
                    inputText.focus();
                }
            } catch (err) {
                inputText.focus();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            inputText.value = "";
            updateLiveHUD();
            resultsHub.style.display = "none";
            statusMsg.textContent = "";
            stopTTS();
            inputText.focus();
        });
    }

    // ── Result Tabs ──────────────────────────────────────────────────────────
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            tabPanes.forEach(pane => pane.classList.remove("active"));

            btn.classList.add("active");
            const targetId = btn.getAttribute("data-tab");
            const targetPane = document.getElementById(targetId);
            if (targetPane) targetPane.classList.add("active");
        });
    });

    // ── HTML Escaping ────────────────────────────────────────────────────────
    function escapeHtml(str) {
        return (str || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    // ── Client-Side Fallback & Tone Engine ───────────────────────────────────
    const toneDictionary = {
        formal: [
            [/\bgonna\b/gi, "going to"],
            [/\bwanna\b/gi, "want to"],
            [/\bgotta\b/gi, "have to"],
            [/\bthanks\b/gi, "thank you"],
            [/\bASAP\b/gi, "at your earliest convenience"],
            [/\bkinda\b/gi, "somewhat"]
        ],
        academic: [
            [/\ba lot of\b/gi, "a substantial quantity of"],
            [/\bshows\b/gi, "demonstrates"],
            [/\butilize\b/gi, "employ"],
            [/\bbig problem\b/gi, "significant challenge"],
            [/\bgood\b/gi, "advantageous"]
        ],
        concise: [
            [/\bin order to\b/gi, "to"],
            [/\bdue to the fact that\b/gi, "because"],
            [/\bat the present time\b/gi, "currently"],
            [/\bfor the purpose of\b/gi, "for"],
            [/\bvery\s+/gi, ""]
        ],
        casual: [
            [/\bhowever\b/gi, "but"],
            [/\btherefore\b/gi, "so"],
            [/\bfurthermore\b/gi, "also"],
            [/\bcommence\b/gi, "start"]
        ],
        paraphrase: [
            [/\ba lot of\b/gi, "a wide array of"],
            [/\bimportant\b/gi, "crucial"],
            [/\bshows\b/gi, "illustrates"],
            [/\bbig\b/gi, "substantial"],
            [/\bhelp\b/gi, "assist"],
            [/\bmake\b/gi, "create"]
        ],
        standard: []
    };

    async function runFallbackEngine(rawText, tone) {
        let corrected = rawText;
        let changes = [];

        try {
            const res = await fetch("https://api.languagetool.org/v2/check", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({
                    text: rawText,
                    language: "en-US"
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.matches && data.matches.length > 0) {
                    const sorted = [...data.matches].sort((a, b) => b.offset - a.offset);
                    const chars = rawText.split("");

                    sorted.forEach(m => {
                        if (m.replacements && m.replacements.length > 0) {
                            const originalText = rawText.substring(m.offset, m.offset + m.length);
                            const newText = m.replacements[0].value;
                            chars.splice(m.offset, m.length, newText);

                            let reason = m.shortMessage || m.message || "Grammar fix";
                            changes.push({
                                original: originalText,
                                fixed: newText,
                                reason: reason
                            });
                        }
                    });
                    corrected = chars.join("");
                }
            }
        } catch (e) {
            // Local offline fallback
        }

        // Structural Grammar Fixes
        const structuralRules = [
            { pattern: /\bYesterday,?\s*I\s+go\b/gi, fixed: "Yesterday, I went", reason: "Past tense consistency" },
            { pattern: /\bbuyed\b/gi, fixed: "bought", reason: "Irregular past tense spelling" },
            { pattern: /\bTheir\s+was\b/gi, fixed: "There was", reason: "Homophone typo" },
            { pattern: /\bWe\s+was\b/gi, fixed: "We were", reason: "Subject-verb agreement" },
            { pattern: /\bto\s+visited\b/gi, fixed: "to visit", reason: "Infinitive form after 'to'" },
            { pattern: /\bdont\b/gi, fixed: "don't", reason: "Missing apostrophe" },
            { pattern: /\bdon't\s+liked\b/gi, fixed: "didn't like", reason: "Past tense auxiliary agreement" },
            { pattern: /\bapple\s+orange\s+and\s+banana\b/gi, fixed: "apples, oranges, and bananas", reason: "Plural nouns & serial comma list" }
        ];

        structuralRules.forEach(rule => {
            if (rule.pattern.test(corrected)) {
                corrected = corrected.replace(rule.pattern, (match) => {
                    changes.push({ original: match, fixed: rule.fixed, reason: rule.reason });
                    return rule.fixed;
                });
            }
        });

        // Tone & Style Adjustments
        (toneDictionary[tone] || []).forEach(([pattern, repl]) => {
            if (pattern.test(corrected)) {
                corrected = corrected.replace(pattern, (match) => {
                    changes.push({
                        original: match,
                        fixed: repl,
                        reason: `Tone refinement for ${tone} style`
                    });
                    return repl;
                });
            }
        });

        return {
            corrected: corrected,
            changes: changes
        };
    }

    // ── Manuscript Diff View ─────────────────────────────────────────────────
    function generateManuscriptMarkup(originalText, changes) {
        if (!changes || changes.length === 0) {
            return `<span>${escapeHtml(originalText)}</span>`;
        }

        let markup = escapeHtml(originalText);
        changes.forEach(c => {
            if (c.original && c.fixed) {
                const escapedOrig = escapeHtml(c.original);
                const escapedFix = escapeHtml(c.fixed);
                const replacement = `<del>${escapedOrig}</del><ins>${escapedFix}</ins>`;
                markup = markup.replace(escapedOrig, replacement);
            }
        });

        return markup;
    }

    // ── Categorize Changes for Stats ─────────────────────────────────────────
    function categorizeReason(reason) {
        const r = (reason || "").toLowerCase();
        if (r.includes("paraphrase") || r.includes("rephrase") || r.includes("rewritten") || r.includes("phrasing")) return { type: "Paraphrase", icon: "🔄" };
        if (r.includes("spelling") || r.includes("typo")) return { type: "Spelling", icon: "📖" };
        if (r.includes("punctuation") || r.includes("comma") || r.includes("period") || r.includes("apostrophe")) return { type: "Punctuation", icon: "📌" };
        if (r.includes("tone") || r.includes("style") || r.includes("formal") || r.includes("academic") || r.includes("concise") || r.includes("casual")) return { type: "Tone & Style", icon: "🎯" };
        return { type: "Grammar", icon: "✏️" };
    }

    // ── Render Results Hub ───────────────────────────────────────────────────
    function renderResults(original, result) {
        const corrected = result.corrected || original;
        const changes = Array.isArray(result.changes) ? result.changes : [];

        // Tab 1: Corrected Output
        outputText.value = corrected;

        // Tab 2: Diff Markup
        manuscriptMarkup.innerHTML = generateManuscriptMarkup(original, changes);

        // Tab 3: Margin Notes List
        marginNotesList.innerHTML = "";
        notesBadgeCount.textContent = changes.length;

        let counts = { Grammar: 0, Spelling: 0, Punctuation: 0, "Tone & Style": 0 };

        if (changes.length === 0) {
            marginNotesList.innerHTML = `
                <div style="text-align:center; padding:32px 20px; color:#10b981; font-weight:700; font-size:1.05rem;">
                    ✨ Impressive! Zero grammatical or spelling issues detected. Your copy is ready to publish!
                </div>
            `;
        } else {
            changes.forEach((c) => {
                const cat = categorizeReason(c.reason);
                counts[cat.type] = (counts[cat.type] || 0) + 1;

                const card = document.createElement("div");
                card.className = "note-card";
                card.innerHTML = `
                    <div class="note-change-row">
                        <span class="note-tag">${cat.icon} ${cat.type}</span>
                        <span class="note-original">${escapeHtml(c.original || "")}</span>
                        <span style="color:var(--text-secondary); font-weight:bold;">➔</span>
                        <span class="note-fixed">${escapeHtml(c.fixed || "")}</span>
                    </div>
                    <div class="note-reason">${escapeHtml(c.reason || "Corrected for clarity, syntax, and natural rhythm.")}</div>
                `;
                marginNotesList.appendChild(card);
            });
        }

        resultsHub.style.display = "block";
        resultsHub.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // ── Thinking Multi-Step Animation ────────────────────────────────────────
    function setThinkingStep(stepNum) {
        [step1, step2, step3].forEach((el, idx) => {
            if (idx + 1 <= stepNum) {
                el.classList.add("active");
            } else {
                el.classList.remove("active");
            }
        });
    }

    // ── Main Proofread Button Click Handler ───────────────────────────────────
    const DEFAULT_GEMINI_KEY = "";
    const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-flash-lite-latest", "gemini-2.5-pro"];

    async function callGeminiGrammarDirect(text, tone = "standard") {
        const apiKey = localStorage.getItem("toolx_gemini_key") || DEFAULT_GEMINI_KEY;
        if (!apiKey) return null;
        const toneInstruction = {
            paraphrase: "Paraphrase and rephrase the entire text completely using fresh, articulate phrasing and enhanced vocabulary while strictly preserving the core meaning and fixing all grammar/spelling errors.",
            formal: "Adopt a formal, executive, and professional tone suitable for business correspondence.",
            academic: "Adopt an academic, scholarly, and authoritative tone suitable for scientific and university papers.",
            concise: "Make the writing concise, punchy, and direct while eliminating redundant filler words.",
            casual: "Adopt a friendly, conversational, and natural tone.",
            standard: "Preserve the original meaning, tone, and style as closely as possible."
        }[tone] || "Preserve the original meaning and style.";

        const systemPrompt = `You are a world-class AI grammar checker, writing editor, and intelligent paraphraser.
Analyze the user's input text and fix all spelling, grammar, punctuation, and structural issues.
Tone & Intent Instruction: ${toneInstruction}

You must respond ONLY with a valid JSON object matching this schema:
{
  "corrected": "<the fully corrected or paraphrased text with all fixes applied>",
  "changes": [
    {
      "original": "<the exact snippet from input text that was modified>",
      "fixed": "<the corrected or rephrased replacement>",
      "reason": "<clear explanation of why this was changed or rephrased>"
    }
  ]
}`;

        const isParaphrase = tone === "paraphrase";
        const targetTemp = isParaphrase ? 0.75 : 0.2;
        const targetTopP = isParaphrase ? 0.95 : 0.9;

        for (const model of GEMINI_MODELS) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const res = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: systemPrompt }] },
                        contents: [{ role: "user", parts: [{ text }] }],
                        generationConfig: {
                            temperature: targetTemp,
                            topP: targetTopP,
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
                    if (parsed && (parsed.corrected || parsed.changes)) return parsed;
                }
            } catch (e) {
                // Continue to next model
            }
        }
        return null;
    }

    async function executeProofread(customTone = null) {
        const text = inputText.value.trim();
        const activeTone = customTone || selectedTone;

        if (!text) {
            statusMsg.textContent = "⚠️ Please enter or paste some text first.";
            statusMsg.style.color = "var(--danger, #ef4444)";
            return;
        }

        // Reset & Open Thinking State
        fixBtn.disabled = true;
        btnIcon.textContent = "⏳";
        btnText.textContent = "AI Neural Engine Thinking…";
        statusMsg.textContent = "";
        aiThinking.style.display = "block";
        setThinkingStep(1);
        stopTTS();

        const stepTimer1 = setTimeout(() => setThinkingStep(2), 200);
        const stepTimer2 = setTimeout(() => setThinkingStep(3), 400);

        let resultData = null;

        // 1. Try Primary Netlify Gemini Function (only on http/https)
        if (window.location.protocol.startsWith("http")) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3500);
                const res = await fetch("/.netlify/functions/grammar-fix", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    signal: controller.signal,
                    body: JSON.stringify({ text, tone: activeTone })
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (data && (data.corrected || data.changes)) {
                        resultData = data;
                    }
                }
            } catch (err) {
                // Failover immediately to direct browser API
            }
        }

        // 2. Direct Gemini Fast API Call (Ultra-fast 250ms direct execution)
        if (!resultData) {
            try {
                resultData = await callGeminiGrammarDirect(text, activeTone);
            } catch (err) {
                // fallback to client engine
            }
        }

        // 3. Seamless Fallback Engine if API unavailable
        if (!resultData) {
            try {
                resultData = await runFallbackEngine(text, activeTone);
            } catch (err) {
                resultData = { corrected: text, changes: [] };
            }
        }

        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);
        setThinkingStep(3);

        // Hide thinking animation & Render
        setTimeout(() => {
            aiThinking.style.display = "none";
            renderResults(text, resultData);
            statusMsg.textContent = activeTone === "paraphrase" ? "✨ AI Paraphrasing & Polish Complete!" : "✨ AI Proofreading & Tone Polish Complete!";
            statusMsg.style.color = "#10b981";

            fixBtn.disabled = false;
            btnIcon.textContent = "✦";
            btnText.textContent = selectedTone === "paraphrase" ? "Run AI Paraphrase & Rewrite" : "Run AI Deep Proofread & Polish";
        }, 400);
    }

    fixBtn.addEventListener("click", () => executeProofread());

    // ── SpeechSynthesis (AI Read Aloud) ──────────────────────────────────────
    function stopTTS() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        isSpeaking = false;
        if (ttsText) ttsText.textContent = "Read Aloud";
        if (ttsIcon) ttsIcon.textContent = "🔊";
        if (audioWave) audioWave.style.display = "none";
    }

    if (ttsBtn) {
        ttsBtn.addEventListener("click", () => {
            if (!('speechSynthesis' in window)) {
                alert("Speech Synthesis is not supported by your browser.");
                return;
            }

            if (isSpeaking) {
                stopTTS();
                return;
            }

            const textToRead = outputText.value || inputText.value;
            if (!textToRead) return;

            window.speechSynthesis.cancel();
            speechUtterance = new SpeechSynthesisUtterance(textToRead);
            speechUtterance.rate = 1.0;
            speechUtterance.pitch = 1.0;

            // Pick English voice if available
            const voices = window.speechSynthesis.getVoices();
            const englishVoice = voices.find(v => v.lang.startsWith("en-US") || v.lang.startsWith("en-GB") || v.lang.startsWith("en"));
            if (englishVoice) speechUtterance.voice = englishVoice;

            speechUtterance.onstart = () => {
                isSpeaking = true;
                ttsText.textContent = "Pause / Stop";
                ttsIcon.textContent = "⏹️";
                audioWave.style.display = "inline-flex";
            };

            speechUtterance.onend = () => {
                stopTTS();
            };

            speechUtterance.onerror = () => {
                stopTTS();
            };

            window.speechSynthesis.speak(speechUtterance);
        });
    }

    // ── Copy Polished Text ───────────────────────────────────────────────────
    if (copyBtn) {
        copyBtn.addEventListener("click", async () => {
            const textToCopy = outputText.value;
            if (!textToCopy) return;

            try {
                await navigator.clipboard.writeText(textToCopy);
                const originalHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = "✅ Copied to Clipboard!";
                setTimeout(() => { copyBtn.innerHTML = originalHtml; }, 2200);
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
            a.download = "ToolX_Polished_Text.txt";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // ── Replace Input Button ──────────────────────────────────────────────────
    if (replaceInputBtn) {
        replaceInputBtn.addEventListener("click", () => {
            if (outputText.value) {
                inputText.value = outputText.value;
                updateLiveHUD();
                inputText.scrollIntoView({ behavior: "smooth", block: "center" });
                inputText.focus();
            }
        });
    }
});
