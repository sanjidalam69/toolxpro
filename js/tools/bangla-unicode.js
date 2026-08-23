// ToolX Pro - Unicode to Bijoy & Bijoy to Unicode Converter
document.addEventListener("DOMContentLoaded", () => {
    const unicodeText = document.getElementById("unicode-text");
    const bijoyText = document.getElementById("bijoy-text");
    const uniToBijoyBtn = document.getElementById("uni-to-bijoy-btn");
    const bijoyToUniBtn = document.getElementById("bijoy-to-uni-btn");
    const copyUnicodeBtn = document.getElementById("copy-unicode-btn");
    const copyBijoyBtn = document.getElementById("copy-bijoy-btn");
    const clearBtn = document.getElementById("clear-btn");

    const uniToBijoyMap = {
        'অ': 'R', 'আ': 'Av', 'ই': 'B', 'ঈ': 'C', 'উ': 'D', 'ঊ': 'E', 'ঋ': 'F', 'এ': 'G', 'ঐ': 'H', 'ও': 'I', 'ঔ': 'J',
        'ক': 'k', 'খ': 'L', 'গ': 'g', 'ঘ': 'N', 'ঙ': 'U', 'চ': 'c', 'ছ': 'C', 'জ': 'j', 'ঝ': 'J', 'ঞ': 'I',
        'ট': 't', 'ঠ': 'T', 'ড': 'd', 'ঢ': 'D', 'ণ': 'Y', 'ত': 'r', 'থ': 'R', 'দ': 'e', 'ধ': 'E', 'ন': 'n',
        'প': 'p', 'ফ': 'P', 'ব': 'b', 'ভ': 'v', 'ম': 'm', 'য': 'h', 'র': 'v', 'ল': 'l', 'শ': 'k', 'ষ': 'Y',
        'স': 'm', 'হ': 'i', 'ড়': 'o', 'ঢ়': 'O', 'য়': 'y', 'ৎ': '?', 'ং': 's', 'ঃ': 's', 'ঁ': '^',
        '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9', '০': '0',
        'া': 'v', 'ি': 'w', 'ী': 'x', 'ু': 'y', 'ূ': 'z', 'ৃ': 'r', 'ে': 'G', 'ৈ': 'C', 'ৌ': 'S', 'ী': 'x', '্': '&'
    };

    const bijoyToUniMap = {};
    for (let key in uniToBijoyMap) {
        bijoyToUniMap[uniToBijoyMap[key]] = key;
    }

    function convertUnicodeToBijoy(text) {
        if (!text) return "";
        let result = "";
        let i = 0;

        while (i < text.length) {
            let char = text.charAt(i);

            if (i < text.length - 1 && (text.charAt(i + 1) === 'ি' || text.charAt(i + 1) === 'ে' || text.charAt(i + 1) === 'ৈ')) {
                const vowelSign = text.charAt(i + 1);
                const consonant = char;
                
                const bijoyVowel = uniToBijoyMap[vowelSign] || "";
                const bijoyConsonant = uniToBijoyMap[consonant] || consonant;
                
                result += bijoyVowel + bijoyConsonant;
                i += 2;
                continue;
            }

            if (i < text.length - 1 && text.charAt(i + 1) === 'ো') {
                const consonant = char;
                const bijoyConsonant = uniToBijoyMap[consonant] || consonant;
                result += 'G' + bijoyConsonant + 'v';
                i += 2;
                continue;
            }

            if (i < text.length - 1 && text.charAt(i + 1) === 'ৌ') {
                const consonant = char;
                const bijoyConsonant = uniToBijoyMap[consonant] || consonant;
                result += 'G' + bijoyConsonant + 'S';
                i += 2;
                continue;
            }

            result += uniToBijoyMap[char] || char;
            i++;
        }

        return result;
    }

    function convertBijoyToUnicode(text) {
        if (!text) return "";
        let result = "";
        let i = 0;

        while (i < text.length) {
            let char = text.charAt(i);

            if ((char === 'w' || char === 'G' || char === 'C') && i < text.length - 1) {
                const vowelSign = char;
                const nextChar = text.charAt(i + 1);
                
                if (vowelSign === 'G' && i < text.length - 2) {
                    const thirdChar = text.charAt(i + 2);
                    if (thirdChar === 'v') {
                        const uniConsonant = bijoyToUniMap[nextChar] || nextChar;
                        result += uniConsonant + 'ো';
                        i += 3;
                        continue;
                    }
                    if (thirdChar === 'S') {
                        const uniConsonant = bijoyToUniMap[nextChar] || nextChar;
                        result += uniConsonant + 'ৌ';
                        i += 3;
                        continue;
                    }
                }

                const uniVowelSign = bijoyToUniMap[vowelSign] || "";
                const uniConsonant = bijoyToUniMap[nextChar] || nextChar;
                
                result += uniConsonant + uniVowelSign;
                i += 2;
                continue;
            }

            result += bijoyToUniMap[char] || char;
            i++;
        }

        return result;
    }

    uniToBijoyBtn.addEventListener("click", () => {
        const text = unicodeText.value;
        if (!text) {
            window.showToast("Please enter Unicode text to convert.", "error");
            return;
        }
        bijoyText.value = convertUnicodeToBijoy(text);
    });

    bijoyToUniBtn.addEventListener("click", () => {
        const text = bijoyText.value;
        if (!text) {
            window.showToast("Please enter Bijoy ANSI text to convert.", "error");
            return;
        }
        unicodeText.value = convertBijoyToUnicode(text);
    });

    function setupCopy(btn, textarea) {
        btn.addEventListener("click", () => {
            const val = textarea.value;
            if (!val) {
                window.showToast("Nothing to copy!", "error");
                return;
            }
            navigator.clipboard.writeText(val).then(() => {
                window.showToast("Text copied to clipboard!");
                const originalText = btn.innerText;
                btn.innerText = "✅ Copied!";
                setTimeout(() => btn.innerText = originalText, 1500);
            });
        });
    }

    setupCopy(copyUnicodeBtn, unicodeText);
    setupCopy(copyBijoyBtn, bijoyText);

    clearBtn.addEventListener("click", () => {
        unicodeText.value = "";
        bijoyText.value = "";
        unicodeText.focus();
    });
});
