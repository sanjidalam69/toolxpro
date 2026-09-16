// ToolX Pro - AI Voice Typing & Speech Studio
// Comprehensive Web Speech Engine, Real-time Dual Translation, TTS, Bijoy Converter & Audio Feedback

document.addEventListener("DOMContentLoaded", () => {
    // ── DOM References ──
    const micToggleBtn = document.getElementById("mic-toggle-btn");
    const micIcon = document.getElementById("mic-icon");
    const micStatus = document.getElementById("mic-status");
    const micHint = document.getElementById("mic-hint");
    const liveWaveform = document.getElementById("live-waveform");
    const recordingTimer = document.getElementById("recording-timer");
    const timerCount = document.getElementById("timer-count");
    const modeTabs = document.querySelectorAll(".mode-tab-btn");
    const workspaceGrid = document.getElementById("workspace-grid");

    // Primary Transcript Pane
    const primaryIcon = document.getElementById("primary-pane-icon");
    const primaryTitle = document.getElementById("primary-pane-title");
    const primaryText = document.getElementById("primary-text");
    const primaryStats = document.getElementById("primary-stats");
    const copyPrimaryBtn = document.getElementById("copy-primary-btn");
    const listenPrimaryBtn = document.getElementById("listen-primary-btn");
    const downloadTxtBtn = document.getElementById("download-txt-btn");
    const convertBijoyBtn = document.getElementById("convert-bijoy-btn");
    const clearAllBtn = document.getElementById("clear-all-btn");

    // Translation Pane
    const translationPane = document.getElementById("translation-pane");
    const translationTitle = document.getElementById("translation-pane-title");
    const translationText = document.getElementById("translation-text");
    const translationStats = document.getElementById("translation-stats");
    const copyTransBtn = document.getElementById("copy-trans-btn");
    const listenTransBtn = document.getElementById("listen-trans-btn");

    // Font Controls & Quick Symbols
    const fontIncBtn = document.getElementById("font-inc-btn");
    const fontDecBtn = document.getElementById("font-dec-btn");
    const puncButtons = document.querySelectorAll(".punc-btn[data-char]");

    // Toast
    const toast = document.getElementById("studio-toast");
    const toastIcon = document.getElementById("toast-icon");
    const toastMsg = document.getElementById("toast-msg");

    // ── State Variables ──
    let currentMode = "bn-type"; // "bn-type" | "en-to-bn" | "bn-to-en"
    let isRecording = false;
    let recognition = null;
    let finalTranscript = "";
    let translationTimeout = null;
    let timerInterval = null;
    let elapsedSeconds = 0;
    let currentFontSize = 1.12; // rem

    // ── Web Audio Chime Synthesizer ──
    function playChime(type) {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === "start") {
                osc.frequency.setValueAtTime(520, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            } else if (type === "stop") {
                osc.frequency.setValueAtTime(780, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            }
        } catch (e) {
            // Audio context not allowed before gesture or not supported
        }
    }

    // ── Toast Notification System ──
    let toastTimeout = null;
    function showToast(message, icon = "✅") {
        if (!toast) return;
        toastMsg.textContent = message;
        toastIcon.textContent = icon;
        toast.classList.add("show");
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 2200);
    }

    // ── Check Browser Speech Support ──
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSpeechSupported = !!SpeechRecognition;

    if (!isSpeechSupported) {
        micStatus.innerHTML = `<span>⚠️ ব্রাউজারে ভয়েস সাপোর্ট নেই</span>`;
        micHint.textContent = "ভয়েস টাইপিং সুবিধার জন্য Google Chrome, Brave বা Microsoft Edge ব্যবহার করুন।";
        micToggleBtn.disabled = true;
        micToggleBtn.style.opacity = "0.5";
        micToggleBtn.style.cursor = "not-allowed";
    }

    // ── Initialize Speech Recognition Engine ──
    function initSpeechEngine() {
        if (!isSpeechSupported) return;

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        // Language setting
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
            recordingTimer.style.display = "inline-flex";
            startTimer();
            playChime("start");

            if (currentMode === "en-to-bn") {
                micStatus.innerHTML = `<span>🎙️ Listening in English... Speak clearly</span>`;
                micHint.textContent = "থামাতে লাল বাটনে ক্লিক করুন";
            } else {
                micStatus.innerHTML = `<span>🎙️ বাংলায় শুনছি... কথা বলুন!</span>`;
                micHint.textContent = "কথা বলা শেষ হলে লাল বাটনে ক্লিক করে থামান";
            }
        };

        recognition.onresult = (event) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const part = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += (finalTranscript ? " " : "") + part.trim();
                } else {
                    interim += part;
                }
            }

            const fullText = finalTranscript + (interim ? " " + interim : "");
            primaryText.value = fullText;
            updateStats();

            // Auto-scroll textarea to bottom
            primaryText.scrollTop = primaryText.scrollHeight;

            // Trigger real-time translation if enabled
            if (currentMode !== "bn-type" && finalTranscript.trim()) {
                clearTimeout(translationTimeout);
                translationTimeout = setTimeout(() => {
                    handleAutoTranslation(finalTranscript.trim());
                }, 500);
            }
        };

        recognition.onerror = (event) => {
            console.warn("Speech recognition warning/error:", event.error);
            if (event.error === "not-allowed") {
                micStatus.innerHTML = `<span>❌ মাইক্রোফোনের পারমিশন নেই</span>`;
                micHint.textContent = "ব্রাউজারের অ্যাড্রেস বারের লক আইকনে ক্লিক করে Microphone Allow করে পেজ রিলোড দিন।";
                stopRecording();
            } else if (event.error === "no-speech") {
                micHint.textContent = "কোনো আওয়াজ পাওয়া যায়নি, স্পষ্ট করে কথা বলুন...";
            }
        };

        recognition.onend = () => {
            if (isRecording) {
                // Keep listening continuously unless explicitly stopped
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

    // ── Timer Handlers ──
    function startTimer() {
        elapsedSeconds = 0;
        updateTimerDisplay();
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            elapsedSeconds++;
            updateTimerDisplay();
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        recordingTimer.style.display = "none";
        elapsedSeconds = 0;
    }

    function updateTimerDisplay() {
        const mins = Math.floor(elapsedSeconds / 60).toString().padStart(2, '0');
        const secs = (elapsedSeconds % 60).toString().padStart(2, '0');
        if (timerCount) timerCount.textContent = `${mins}:${secs}`;
    }

    // ── Start / Stop Recording ──
    function startRecording() {
        if (!isSpeechSupported) return;
        finalTranscript = primaryText.value;
        initSpeechEngine();
        try {
            recognition.start();
        } catch (e) {
            console.error("Speech start error:", e);
        }
    }

    function stopRecording() {
        isRecording = false;
        if (recognition) {
            try {
                recognition.stop();
            } catch (e) {}
        }
        playChime("stop");
        stopTimer();
        micToggleBtn.classList.remove("recording");
        micIcon.textContent = "🎤";
        liveWaveform.style.display = "none";
        micStatus.innerHTML = `<span>কথা বলতে মাইক বাটনে ক্লিক করুন</span>`;
        micHint.textContent = "মাইক্রোফোন অন করে পরিষ্কার ও সাবলীল কণ্ঠে কথা বলুন";
    }

    micToggleBtn.addEventListener("click", () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });

    // ── Segmented Mode Switching ──
    modeTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            modeTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            currentMode = tab.getAttribute("data-mode");

            if (isRecording) {
                stopRecording();
            }

            if (currentMode === "bn-type") {
                primaryIcon.textContent = "✍️";
                primaryTitle.textContent = "বাংলা টেক্সট (Speech Transcript)";
                primaryText.placeholder = "আপনি কথা বললে এখানে সরাসরি রিয়েল-টাইমে টাইপ হতে থাকবে... আপনি চাইলে কিবোর্ড দিয়েও এডিট করতে পারেন।";
                translationPane.style.display = "none";
                workspaceGrid.classList.remove("dual-view");
            } else if (currentMode === "en-to-bn") {
                primaryIcon.textContent = "🗣️";
                primaryTitle.textContent = "English Speech Input";
                primaryText.placeholder = "Speak in English... your spoken words will appear here instantly.";
                translationTitle.textContent = "অনূদিত বাংলা ফলাফল (Bangla Translation)";
                translationText.placeholder = "ইংরেজি কথার বাংলা অনুবাদ এখানে রিয়েল-টাইমে দেখতে পাবেন...";
                translationPane.style.display = "flex";
                workspaceGrid.classList.add("dual-view");
            } else if (currentMode === "bn-to-en") {
                primaryIcon.textContent = "🇧🇩";
                primaryTitle.textContent = "মুখে বলা বাংলা টেক্সট (Bangla Speech)";
                primaryText.placeholder = "বাংলায় কথা বলুন, এখানে টাইপ হতে থাকবে...";
                translationTitle.textContent = "English Translation Output";
                translationText.placeholder = "Real-time English translation will appear here...";
                translationPane.style.display = "flex";
                workspaceGrid.classList.add("dual-view");
            }
        });
    });

    // ── High-Speed Translation API ──
    async function handleAutoTranslation(text) {
        if (!text || !text.trim()) return;
        translationText.value = "অনুবাদ করা হচ্ছে... (Translating...)";

        const sourceLang = (currentMode === "en-to-bn") ? "en" : "bn";
        const targetLang = (currentMode === "en-to-bn") ? "bn" : "en";

        try {
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
            console.warn("Translation API notice:", e);
        }

        translationText.value = "অনুবাদ সার্ভার সাময়িকভাবে ব্যস্ত। অনুগ্রহ করে একটু পর চেষ্টা করুন।";
    }

    // ── Stats Calculation ──
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
    translationText.addEventListener("input", updateTranslationStats);

    // ── Punctuation Quick Buttons ──
    puncButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const char = btn.getAttribute("data-char");
            if (!char) return;

            const start = primaryText.selectionStart;
            const end = primaryText.selectionEnd;
            const currentVal = primaryText.value;

            const insertVal = (char === "\\n") ? "\n" : char;
            primaryText.value = currentVal.substring(0, start) + insertVal + currentVal.substring(end);
            primaryText.selectionStart = primaryText.selectionEnd = start + insertVal.length;
            primaryText.focus();
            
            finalTranscript = primaryText.value;
            updateStats();
        });
    });

    // ── Font Size Controls ──
    if (fontIncBtn) {
        fontIncBtn.addEventListener("click", () => {
            if (currentFontSize < 1.8) {
                currentFontSize += 0.15;
                primaryText.style.fontSize = `${currentFontSize}rem`;
                translationText.style.fontSize = `${currentFontSize}rem`;
            }
        });
    }

    if (fontDecBtn) {
        fontDecBtn.addEventListener("click", () => {
            if (currentFontSize > 0.9) {
                currentFontSize -= 0.15;
                primaryText.style.fontSize = `${currentFontSize}rem`;
                translationText.style.fontSize = `${currentFontSize}rem`;
            }
        });
    }

    // ── Copy Actions ──
    copyPrimaryBtn.addEventListener("click", () => {
        if (!primaryText.value.trim()) {
            showToast("কপি করার মতো টেক্সট নেই!", "⚠️");
            return;
        }
        navigator.clipboard.writeText(primaryText.value).then(() => {
            showToast("টেক্সট কপি করা হয়েছে! (Copied)", "📋");
        });
    });

    if (copyTransBtn) {
        copyTransBtn.addEventListener("click", () => {
            if (!translationText.value.trim()) {
                showToast("অনুবাদ ফলাফল খালি!", "⚠️");
                return;
            }
            navigator.clipboard.writeText(translationText.value).then(() => {
                showToast("অনুবাদ টেক্সট কপি করা হয়েছে!", "🌐");
            });
        });
    }

    // ── Text-to-Speech (Audio Voice Readout) ──
    function speakText(text, lang) {
        if (!('speechSynthesis' in window)) {
            showToast("ব্রাউজারে ভয়েস সিন্থেসিস সাপোর্ট নেই", "⚠️");
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
        showToast("ভয়েস অডিও বাজছে...", "🔊");
    }

    listenPrimaryBtn.addEventListener("click", () => {
        const text = primaryText.value.trim();
        if (!text) {
            showToast("আগে কিছু কথা বা টেক্সট লিখুন", "⚠️");
            return;
        }
        const lang = (currentMode === "en-to-bn") ? "en-US" : "bn-BD";
        speakText(text, lang);
    });

    if (listenTransBtn) {
        listenTransBtn.addEventListener("click", () => {
            const text = translationText.value.trim();
            if (!text) {
                showToast("কোনো অনূদিত টেক্সট নেই", "⚠️");
                return;
            }
            const lang = (currentMode === "en-to-bn") ? "bn-BD" : "en-US";
            speakText(text, lang);
        });
    }

    // ── Export as .txt File ──
    downloadTxtBtn.addEventListener("click", () => {
        const text = primaryText.value;
        if (!text.trim()) {
            showToast("ডাউনলোড করার মতো কোনো টেক্সট নেই", "⚠️");
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
        showToast("ফাইল ডাউনলোড সম্পন্ন হয়েছে!", "💾");
    });

    // ── 1-Click Jump to Bijoy 52 Converter ──
    convertBijoyBtn.addEventListener("click", () => {
        const text = primaryText.value;
        if (!text.trim()) {
            showToast("আগে কথা বলে বা টাইপ করে টেক্সট লিখুন", "⚠️");
            return;
        }
        localStorage.setItem("toolx_pending_unicode", text);
        showToast("বিজয় কনভার্টারে নিয়ে যাওয়া হচ্ছে...", "✍️");
        setTimeout(() => {
            window.location.href = "bangla-unicode.html";
        }, 300);
    });

    // ── Clear All ──
    clearAllBtn.addEventListener("click", () => {
        if (isRecording) stopRecording();
        primaryText.value = "";
        translationText.value = "";
        finalTranscript = "";
        updateStats();
        if (translationStats) translationStats.textContent = "0 words";
        showToast("সব টেক্সট মুছে ফেলা হয়েছে", "🧹");
    });
});
