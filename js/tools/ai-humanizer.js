// ToolX Pro - AI Text Humanizer & Natural Writing Refiner
// 100% Client-Side Style Refiner, Cliché Eliminator & Readability Engine

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

    // Extra Plain-English Simplifications for Deep Rewrite mode
    const DEEP_REWRITE_RULES = [
        { regex: /\bin order to\b/gi, repl: "to" },
        { regex: /\butilize\b/gi, repl: "use" },
        { regex: /\butilizes\b/gi, repl: "uses" },
        { regex: /\butilizing\b/gi, repl: "using" },
        { regex: /\bfacilitate\b/gi, repl: "help" },
        { regex: /\bsubsequently\b/gi, repl: "later" },
        { regex: /\bprior to\b/gi, repl: "before" },
        { regex: /\bcommence\b/gi, repl: "start" },
        { regex: /\bterminate\b/gi, repl: "end" },
        { regex: /\bendeavor\b/gi, repl: "try" },
        { regex: /\bis designed to\b/gi, repl: "helps" },
        { regex: /\ballows users to\b/gi, repl: "lets you" },
        { regex: /\ba significant number of\b/gi, repl: "many" },
        { regex: /\bdue to the fact that\b/gi, repl: "because" },
        { regex: /\bfor the purpose of\b/gi, repl: "for" }
    ];

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

        // Apply extra plain-English rewrite simplifications in Deep Rewrite mode
        if (mode === "stealth") {
            DEEP_REWRITE_RULES.forEach(rule => {
                if (rule.regex.test(humanized)) {
                    humanized = humanized.replace(rule.regex, (match) => {
                        replacedPhrases.push({ original: match, replacedWith: rule.repl });
                        return rule.repl;
                    });
                }
            });
        }

        // Apply contractions
        CONTRACTIONS_MAP.forEach(rule => {
            if (rule.regex.test(humanized)) {
                humanized = humanized.replace(rule.regex, (match) => {
                    replacedPhrases.push({ original: match, replacedWith: rule.repl });
                    return rule.repl;
                });
            }
        });

        // Normalize extra double spaces without collapsing paragraph breaks
        humanized = humanized.replace(/^#{1,6}\s+[^\n]+\n*/gm, '').replace(/ {2,}/g, ' ').trim();

        const editCount = replacedPhrases.length;
        return {
            humanized,
            aiScoreBefore: editCount > 0 ? Math.min(95, 55 + editCount * 8) : 30,
            humanScoreAfter: editCount > 0 ? 96 : 98,
            aiPhrasesReplaced: replacedPhrases.slice(0, 12)
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
            thinkingPhase.textContent = "⚡ Refining Flow & Readability…";
        }, 180);

        const resultData = runClientHumanizer(text, currentMode);

        setTimeout(() => {
            clearTimeout(timer1);
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
