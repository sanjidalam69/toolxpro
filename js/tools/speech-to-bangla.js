// ToolX Pro - Bangla Voice Typing & Real-time Speech Translator
// Minimalist, high-performance Web Speech API & Translation Engine

document.addEventListener("DOMContentLoaded", () => {
    // ── DOM References ──
    const tabButtons = document.querySelectorAll(".v-tab-btn");
    const workspace = document.getElementById("voice-workspace");
    
    // Primary Editor
    const primaryTitle = document.getElementById("primary-box-title");
    const primaryStats = document.getElementById("primary-stats");
    const primaryText = document.getElementById("primary-text");

    // Translation Editor
    const translationBox = document.getElementById("translation-box");
    const translationTitle = document.getElementById("translation-box-title");
    const translationStats = document.getElementById("translation-stats");
    const translationText = document.getElementById("translation-text");

    // Mic Controls
    const micToggleBtn = document.getElementById("mic-toggle-btn");
    const micIcon = document.getElementById("mic-icon");
    const micBtnText = document.getElementById("mic-btn-text");
    const micStatusText = document.getElementById("mic-status-text");
    const recordingTimer = document.getElementById("recording-timer");
    const timerCount = document.getElementById("timer-count");

    // Action Buttons
    const copyBtn = document.getElementById("copy-btn");
    const listenBtn = document.getElementById("listen-btn");
    const downloadBtn = document.getElementById("download-btn");
    const convertBijoyBtn = document.getElementById("convert-bijoy-btn");
    const clearBtn = document.getElementById("clear-btn");

    // Toast
    const toast = document.getElementById("clean-toast");
    const toastIcon = document.getElementById("toast-icon");
    const toastText = document.getElementById("toast-text");

    // ── State Variables ──
    let currentMode = "bn-type"; // "bn-type" | "en-to-bn" | "bn-to-en"
    let isRecording = false;
    let recognition = null;
    let finalTranscript = "";
    let translationTimeout = null;
    let timerInterval = null;
    let elapsedSeconds = 0;

    // ── Toast Helper ──
    let toastTimeout = null;
    function showToast(msg, icon = "✅") {
        if (!toast) return;
        toastText.textContent = msg;
        toastIcon.textContent = icon;
        toast.classList.add("show");
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 2000);
    }

    // ── Check Browser Speech Support ──
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSpeechSupported = !!SpeechRecognition;

    if (!isSpeechSupported) {
        micStatusText.textContent = "⚠️ ব্রাউজারে ভয়েস সাপোর্ট নেই (Chrome/Edge ব্যবহার করুন)";
        micToggleBtn.disabled = true;
        micToggleBtn.style.opacity = "0.5";
        micToggleBtn.style.cursor = "not-allowed";
    }

    // ── Speech Engine ──
    function initSpeechEngine() {
        if (!isSpeechSupported) return;

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        if (currentMode === "en-to-bn") {
            recognition.lang = "en-US";
        } else {
            recognition.lang = "bn-BD"; // বাংলা (বাংলাদেশ)
        }

        recognition.onstart = () => {
            isRecording = true;
            micToggleBtn.classList.add("recording");
            micIcon.textContent = "⏹️";
            micBtnText.textContent = "Stop Speaking";
            recordingTimer.style.display = "inline-flex";
            startTimer();

            if (currentMode === "en-to-bn") {
                micStatusText.textContent = "Listening in English...";
            } else {
                micStatusText.textContent = "বাংলায় শুনছি... কথা বলুন";
            }
        };

        // ── Smart Punctuation Helper ──
        function formatPunctuation(text, mode) {
            if (mode === "en-to-bn") {
                return text
                    .replace(/\s*period\s*/gi, ". ")
                    .replace(/\s*full stop\s*/gi, ". ")
                    .replace(/\s*comma\s*/gi, ", ")
                    .replace(/\s*question mark\s*/gi, "? ")
                    .replace(/\s*exclamation mark\s*/gi, "! ")
                    .replace(/\s*new line\s*/gi, "\n")
                    .replace(/\s*new paragraph\s*/gi, "\n\n");
            } else {
                return text
                    .replace(/\s*(দাঁড়ি|দাড়ি|পূর্ণচ্ছেদ)\s*/gi, "। ")
                    .replace(/\s*কমা\s*/gi, ", ")
                    .replace(/\s*(প্রশ্নবোধক চিহ্ন|প্রশ্নচিহ্ন|প্রশ্নবোধক)\s*/gi, "? ")
                    .replace(/\s*(বিস্ময়সূচক চিহ্ন|আশ্চর্যবোধক চিহ্ন|বিস্ময়চিহ্ন)\s*/gi, "! ")
                    .replace(/\s*নতুন লাইন\s*/gi, "\n")
                    .replace(/\s*নতুন প্যারা\s*/gi, "\n\n");
            }
        }

        recognition.onresult = (event) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const part = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    const formattedPart = formatPunctuation(part.trim(), currentMode);
                    finalTranscript += (finalTranscript ? " " : "") + formattedPart;
                } else {
                    interim += part;
                }
            }

            const fullText = finalTranscript + (interim ? " " + interim : "");
            primaryText.value = fullText;
            updateStats();

            primaryText.scrollTop = primaryText.scrollHeight;

            if (currentMode !== "bn-type" && finalTranscript.trim()) {
                clearTimeout(translationTimeout);
                translationTimeout = setTimeout(() => {
                    handleAutoTranslation(finalTranscript.trim());
                }, 400);
            }
        };

        recognition.onerror = (event) => {
            console.warn("Speech recognition warning:", event.error);
            if (event.error === "not-allowed") {
                micStatusText.textContent = "❌ মাইক্রোফোনের অনুমতি দিন (Microphone Blocked)";
                stopRecording();
            } else if (event.error === "no-speech") {
                micStatusText.textContent = "কথা স্পষ্ট করে বলুন...";
            }
        };

        recognition.onend = () => {
            if (isRecording) {
                try {
                    recognition.start();
                } catch (e) {
                    // Retry once after a brief delay if browser closed socket
                    setTimeout(() => {
                        if (isRecording) {
                            try { recognition.start(); } catch(err) { stopRecording(); }
                        }
                    }, 250);
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

    // ── Start / Stop Voice ──
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
        stopTimer();
        micToggleBtn.classList.remove("recording");
        micIcon.textContent = "🎤";
        micBtnText.textContent = "Start Speaking";
        micStatusText.textContent = "মাইক বন্ধ আছে";
    }

    micToggleBtn.addEventListener("click", () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });

    // ── Tab Switcher ──
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentMode = btn.getAttribute("data-mode");

            if (isRecording) stopRecording();

            if (currentMode === "bn-type") {
                primaryTitle.textContent = "✍️ বাংলা টেক্সট";
                primaryText.placeholder = "এখানে সরাসরি কথা বলে টাইপ করতে নিচে 'Start Speaking' বাটনে চাপুন...";
                translationBox.style.display = "none";
                workspace.classList.remove("dual-mode");
            } else if (currentMode === "en-to-bn") {
                primaryTitle.textContent = "🗣️ English Input";
                primaryText.placeholder = "Speak in English... words will appear here instantly.";
                translationTitle.textContent = "🌐 বাংলা অনুবাদ";
                translationText.placeholder = "ইংরেজি কথার বাংলা অনুবাদ এখানে দেখতে পাবেন...";
                translationBox.style.display = "flex";
                workspace.classList.add("dual-mode");
            } else if (currentMode === "bn-to-en") {
                primaryTitle.textContent = "🇧🇩 বাংলা টেক্সট";
                primaryText.placeholder = "বাংলায় কথা বলুন, এখানে টাইপ হতে থাকবে...";
                translationTitle.textContent = "🌐 English Output";
                translationText.placeholder = "Real-time English translation will appear here...";
                translationBox.style.display = "flex";
                workspace.classList.add("dual-mode");
            }
        });
    });

    // ── Fast Translation API ──
    async function handleAutoTranslation(text) {
        if (!text || !text.trim()) return;
        translationText.value = "অনুবাদ করা হচ্ছে...";

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
            console.warn("Translation API issue:", e);
        }

        translationText.value = "অনুবাদ সার্ভার সাময়িকভাবে ব্যস্ত।";
    }

    // ── Stats ──
    function updateStats() {
        const text = primaryText.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        primaryStats.textContent = `${words} words`;
    }

    function updateTranslationStats() {
        const text = translationText.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        translationStats.textContent = `${words} words`;
    }

    primaryText.addEventListener("input", updateStats);
    translationText.addEventListener("input", updateTranslationStats);

    // ── 1-Click Copy ──
    copyBtn.addEventListener("click", () => {
        const activeText = (currentMode !== "bn-type" && translationText.value.trim()) 
            ? translationText.value 
            : primaryText.value;

        if (!activeText.trim()) {
            showToast("কপি করার মতো টেক্সট নেই!", "⚠️");
            return;
        }

        navigator.clipboard.writeText(activeText).then(() => {
            showToast("টেক্সট কপি সম্পন্ন!", "📋");
        });
    });

    // ── Text-to-Speech (Listen) ──
    listenBtn.addEventListener("click", () => {
        const activeText = (currentMode !== "bn-type" && translationText.value.trim())
            ? translationText.value.trim()
            : primaryText.value.trim();

        if (!activeText) {
            showToast("শুনার মতো কোনো টেক্সট নেই!", "⚠️");
            return;
        }

        if (!('speechSynthesis' in window)) {
            showToast("TTS ব্রাউজারে সাপোর্ট নেই", "⚠️");
            return;
        }

        const lang = (currentMode === "bn-to-en") ? "en-US" : "bn-BD";
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(activeText);
        utterance.lang = lang;
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
        showToast("অডিও চালু হয়েছে...", "🔊");
    });

    // ── Download .txt ──
    downloadBtn.addEventListener("click", () => {
        const text = primaryText.value;
        if (!text.trim()) {
            showToast("ডাউনলোড করার মতো টেক্সট নেই!", "⚠️");
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
        showToast("ফাইল ডাউনলোড হয়েছে!", "💾");
    });

    // ── Convert to Bijoy 52 ──
    convertBijoyBtn.addEventListener("click", () => {
        const text = primaryText.value;
        if (!text.trim()) {
            showToast("আগে কথা বলে বা লিখে টেক্সট তৈরি করুন!", "⚠️");
            return;
        }
        localStorage.setItem("toolx_pending_unicode", text);
        showToast("বিজয় কনভার্টারে যাচ্ছি...", "✍️");
        setTimeout(() => {
            window.location.href = "bangla-unicode.html";
        }, 250);
    });

    // ── Clear All ──
    clearBtn.addEventListener("click", () => {
        if (isRecording) stopRecording();
        primaryText.value = "";
        translationText.value = "";
        finalTranscript = "";
        updateStats();
        if (translationStats) translationStats.textContent = "0 words";
        showToast("সব লেখা মুছে ফেলা হয়েছে", "🧹");
    });
});
