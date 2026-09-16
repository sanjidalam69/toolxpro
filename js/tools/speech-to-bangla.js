// ToolX Pro - Bangla Voice Typing & Realtime Speech Translator
// Features: Web Speech API (bn-BD / en-US), Gemini AI Real-time Translation, TTS, Bijoy Converter, TXT Download

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements
    const micToggleBtn = document.getElementById("mic-toggle-btn");
    const micIcon = document.getElementById("mic-icon");
    const micStatus = document.getElementById("mic-status");
    const micHint = document.getElementById("mic-hint");
    const liveWaveform = document.getElementById("live-waveform");
    const modeChips = document.querySelectorAll(".voice-mode-chip");

    // Primary Text Elements
    const primaryTitle = document.getElementById("primary-box-title");
    const primaryText = document.getElementById("primary-text");
    const primaryStats = document.getElementById("primary-stats");
    const copyPrimaryBtn = document.getElementById("copy-primary-btn");
    const listenPrimaryBtn = document.getElementById("listen-primary-btn");
    const downloadTxtBtn = document.getElementById("download-txt-btn");
    const convertBijoyBtn = document.getElementById("convert-bijoy-btn");
    const clearAllBtn = document.getElementById("clear-all-btn");

    // Translation Elements
    const translationCard = document.getElementById("translation-card");
    const translationTitle = document.getElementById("translation-box-title");
    const translationText = document.getElementById("translation-text");
    const translationStats = document.getElementById("translation-stats");
    const copyTransBtn = document.getElementById("copy-trans-btn");
    const listenTransBtn = document.getElementById("listen-trans-btn");

    // State Variables
    let currentMode = "bn-type"; // "bn-type", "en-to-bn", "bn-to-en"
    let isRecording = false;
    let recognition = null;
    let interimTranscript = "";
    let finalTranscript = "";
    let translationTimeout = null;

    // Check Browser Speech Support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSpeechSupported = !!SpeechRecognition;

    if (!isSpeechSupported) {
        micStatus.textContent = "⚠️ আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই";
        micHint.textContent = "ভয়েস টাইপিং ব্যবহারের জন্য দয়া করে Google Chrome বা Microsoft Edge ব্যবহার করুন।";
        micToggleBtn.disabled = true;
        micToggleBtn.style.opacity = "0.5";
    }

    // ── Initialize Speech Recognition ──
    function initSpeechEngine() {
        if (!isSpeechSupported) return;

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // Set Language based on Mode
        if (currentMode === "en-to-bn") {
            recognition.lang = "en-US";
        } else {
            recognition.lang = "bn-BD"; // বাংলা (বাংলাদেশ)
        }

        recognition.onstart = () => {
            isRecording = true;
            micToggleBtn.classList.add("recording");
            micIcon.textContent = "⏹️";
            liveWaveform.style.display = "flex";
            
            if (currentMode === "en-to-bn") {
                micStatus.textContent = "🎙️ Listening in English... Speak now!";
                micHint.textContent = "কথা বলা শেষ হলে লাল বাটনে ক্লিক করে বন্ধ করুন";
            } else {
                micStatus.textContent = "🎙️ বাংলায় শুনছি... স্পষ্ট করে কথা বলুন!";
                micHint.textContent = "কথা বলা শেষ হলে লাল বাটনে ক্লিক করে থামান";
            }
        };

        recognition.onresult = (event) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptPart = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += (finalTranscript ? " " : "") + transcriptPart.trim();
                } else {
                    interim += transcriptPart;
                }
            }

            interimTranscript = interim;
            const fullDisplay = finalTranscript + (interim ? " " + interim : "");
            primaryText.value = fullDisplay;
            updateStats();

            // Auto-trigger translation if in translation mode
            if (currentMode !== "bn-type" && finalTranscript.trim()) {
                clearTimeout(translationTimeout);
                translationTimeout = setTimeout(() => {
                    handleAutoTranslation(finalTranscript.trim());
                }, 600);
            }
        };

        recognition.onerror = (event) => {
            console.warn("Speech recognition error:", event.error);
            if (event.error === "not-allowed") {
                micStatus.textContent = "❌ মাইক্রোফোনের অনুমতি দিন (Microphone Blocked)";
                micHint.textContent = "ব্রাউজারের অ্যাড্রেস বারের তালার চিহ্নে ক্লিক করে Microphone Allow করুন।";
                stopRecording();
            } else if (event.error === "no-speech") {
                micHint.textContent = "কোনো আওয়াজ পাওয়া যায়নি, আবার কথা বলুন...";
            }
        };

        recognition.onend = () => {
            if (isRecording) {
                // Auto restart if continuous was stopped unexpectedly
                try {
                    recognition.start();
                } catch (e) {
                    stopRecording();
                }
            } else {
                stopRecording();
            }
        };
    }

    // ── Start / Stop Voice Recording ──
    function startRecording() {
        if (!isSpeechSupported) return;
        finalTranscript = primaryText.value; // keep existing text
        initSpeechEngine();
        try {
            recognition.start();
        } catch (e) {
            console.error("Recognition start error:", e);
        }
    }

    function stopRecording() {
        isRecording = false;
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {}
        }
        micToggleBtn.classList.remove("recording");
        micIcon.textContent = "🎤";
        liveWaveform.style.display = "none";
        micStatus.textContent = "মাইক চালু করতে ক্লিক করুন";
        micHint.textContent = "মাইক্রোফোন অন করে স্পষ্ট উচ্চারণে কথা বলুন";
    }

    micToggleBtn.addEventListener("click", () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });

    // ── Mode Switching ──
    modeChips.forEach(chip => {
        chip.addEventListener("click", () => {
            modeChips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentMode = chip.getAttribute("data-mode");

            if (isRecording) {
                stopRecording();
            }

            if (currentMode === "bn-type") {
                primaryTitle.textContent = "বাংলা টেক্সট (Speech Transcript)";
                primaryText.placeholder = "আপনি কথা বললে এখানে সরাসরি ইউনিকোড বাংলায় টাইপ হতে থাকবে...";
                translationCard.style.display = "none";
            } else if (currentMode === "en-to-bn") {
                primaryTitle.textContent = "Spoken English Transcript";
                primaryText.placeholder = "Speak in English, your speech will appear here...";
                translationTitle.textContent = "অনূদিত বাংলা টেক্সট (Bangla Translation)";
                translationText.placeholder = "ইংরেজি কথার বাংলা অনুবাদ এখানে রিয়েল-টাইমে দেখতে পাবেন...";
                translationCard.style.display = "block";
            } else if (currentMode === "bn-to-en") {
                primaryTitle.textContent = "মুখে বলা বাংলা টেক্সট (Bangla Speech)";
                primaryText.placeholder = "বাংলায় কথা বলুন, এখানে টাইপ হবে...";
                translationTitle.textContent = "English Translation Output";
                translationText.placeholder = "English translation will appear here in real-time...";
                translationCard.style.display = "block";
            }
        });
    });

    // ── Translation Engine ──
    async function handleAutoTranslation(text) {
        if (!text) return;
        translationText.value = "অনুবাদ করা হচ্ছে... (Translating...)";

        const sourceLang = (currentMode === "en-to-bn") ? "en" : "bn";
        const targetLang = (currentMode === "en-to-bn") ? "bn" : "en";

        try {
            // Free high-speed Google Translate API endpoint
            const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                let translated = "";
                if (data && data[0]) {
                    data[0].forEach(item => {
                        if (item && item[0]) translated += item[0];
                    });
                }
                translationText.value = translated || text;
                updateTranslationStats();
                return;
            }
        } catch (e) {
            console.warn("Fast translate fallback:", e);
        }

        // Fallback notice
        translationText.value = "অনুবাদ সার্ভার সাময়িকভাবে ব্যস্ত। একটু পর আবার চেষ্টা করুন।";
    }

    // ── Word and Character Stats HUD ──
    function updateStats() {
        const text = primaryText.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        primaryStats.textContent = `${words} words | ${chars} chars`;
    }

    function updateTranslationStats() {
        const text = translationText.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        translationStats.textContent = `${words} words`;
    }

    primaryText.addEventListener("input", updateStats);

    // ── 1-Click Copy Actions ──
    copyPrimaryBtn.addEventListener("click", () => {
        if (!primaryText.value) return;
        navigator.clipboard.writeText(primaryText.value).then(() => {
            const orig = copyPrimaryBtn.innerHTML;
            copyPrimaryBtn.innerHTML = "✅ Copied!";
            setTimeout(() => { copyPrimaryBtn.innerHTML = orig; }, 1800);
        });
    });

    if (copyTransBtn) {
        copyTransBtn.addEventListener("click", () => {
            if (!translationText.value) return;
            navigator.clipboard.writeText(translationText.value).then(() => {
                const orig = copyTransBtn.innerHTML;
                copyTransBtn.innerHTML = "✅ Copied!";
                setTimeout(() => { copyTransBtn.innerHTML = orig; }, 1800);
            });
        });
    }

    // ── Text-to-Speech (TTS Audio Playback) ──
    function speakText(text, lang) {
        if (!('speechSynthesis' in window)) {
            alert("Speech synthesis is not supported in this browser.");
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }

    listenPrimaryBtn.addEventListener("click", () => {
        const text = primaryText.value.trim();
        if (!text) return;
        const lang = (currentMode === "en-to-bn") ? "en-US" : "bn-BD";
        speakText(text, lang);
    });

    if (listenTransBtn) {
        listenTransBtn.addEventListener("click", () => {
            const text = translationText.value.trim();
            if (!text) return;
            const lang = (currentMode === "en-to-bn") ? "bn-BD" : "en-US";
            speakText(text, lang);
        });
    }

    // ── Download as .txt File ──
    downloadTxtBtn.addEventListener("click", () => {
        const text = primaryText.value;
        if (!text) {
            alert("ডাউনলোড করার মতো কোনো টেক্সট নেই।");
            return;
        }
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ToolX_Bangla_Voice_Transcript.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // ── Quick Convert to Bijoy 52 ──
    convertBijoyBtn.addEventListener("click", () => {
        const text = primaryText.value;
        if (!text) {
            alert("আগে কিছু কথা বলে টাইপ করুন।");
            return;
        }
        // Redirect to Bangla Unicode converter tool with preloaded text
        localStorage.setItem("toolx_pending_unicode", text);
        window.location.href = "bangla-unicode.html";
    });

    // ── Clear All ──
    clearAllBtn.addEventListener("click", () => {
        if (isRecording) stopRecording();
        primaryText.value = "";
        translationText.value = "";
        finalTranscript = "";
        interimTranscript = "";
        updateStats();
        if (translationStats) translationStats.textContent = "0 words";
    });
});
