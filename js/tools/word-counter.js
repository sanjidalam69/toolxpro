// ToolX Pro - Word Counter Javascript
document.addEventListener("DOMContentLoaded", () => {
    const textInput = document.getElementById("text-input");
    const clearBtn = document.getElementById("clear-btn");

    const wordCountEl = document.getElementById("word-count");
    const charCountEl = document.getElementById("char-count");
    const nospaceCharCountEl = document.getElementById("nospace-char-count");
    const lineCountEl = document.getElementById("line-count");
    const sentenceCountEl = document.getElementById("sentence-count");
    const readTimeEl = document.getElementById("read-time");

    function updateStats() {
        const text = textInput.value;

        // Characters Count
        const charCount = text.length;
        charCountEl.innerText = charCount;

        // No Space Characters Count
        const nospaceCharCount = text.replace(/\s/g, '').length;
        nospaceCharCountEl.innerText = nospaceCharCount;

        // Words Count
        const wordsArray = text.trim().split(/\s+/).filter(w => w.length > 0);
        const wordCount = wordsArray.length;
        wordCountEl.innerText = wordCount;

        // Lines Count
        const lineCount = text.length > 0 ? text.split(/\r?\n/).length : 0;
        lineCountEl.innerText = lineCount;

        // Sentences Count (English .!? and Bangla Dari ।)
        const sentenceCount = text.length > 0 ? text.split(/[.!?।]+/).filter(s => s.trim().length > 0).length : 0;
        sentenceCountEl.innerText = sentenceCount;

        // Reading Time (Standard speed: 200 words per minute)
        if (wordCount === 0) {
            readTimeEl.innerText = `0 sec`;
        } else {
            const totalSeconds = Math.round((wordCount / 200) * 60);
            if (totalSeconds < 60) {
                readTimeEl.innerText = `${totalSeconds} sec`;
            } else {
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                if (seconds === 0) {
                    readTimeEl.innerText = `${minutes} min`;
                } else {
                    readTimeEl.innerText = `${minutes} min ${seconds} sec`;
                }
            }
        }
    }

    textInput.addEventListener("input", updateStats);

    clearBtn.addEventListener("click", () => {
        textInput.value = "";
        updateStats();
        textInput.focus();
    });
});
