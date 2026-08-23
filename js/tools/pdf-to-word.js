// ToolX Pro - High-Fidelity Dynamic Page Size PDF to Word Engine (iLovePDF Exact Dimensions)
document.addEventListener("DOMContentLoaded", () => {
    const uploadStage = document.getElementById("upload-stage");
    const previewStage = document.getElementById("preview-stage");
    const loadingStage = document.getElementById("loading-stage");
    const successStage = document.getElementById("success-stage");

    const selectPdfBtn = document.getElementById("select-pdf-btn");
    const pdfInput = document.getElementById("pdf-upload");
    const changePdfBtn = document.getElementById("change-pdf-btn");
    const convertNowBtn = document.getElementById("convert-now-btn");
    const conversionModeSelect = document.getElementById("conversion-mode-select");

    const pdfThumbCanvas = document.getElementById("pdf-thumb-canvas");
    const previewFileName = document.getElementById("preview-file-name");
    const previewFileMeta = document.getElementById("preview-file-meta");
    const pageCountBadge = document.getElementById("page-count-badge");

    const loadingTitle = document.getElementById("loading-title");
    const loadingSubtitle = document.getElementById("loading-subtitle");

    const downloadWordPrimaryBtn = document.getElementById("download-word-primary-btn");
    const downloadDocAltBtn = document.getElementById("download-doc-alt-btn");
    const copyTextAltBtn = document.getElementById("copy-text-alt-btn");
    const toggleEditorBtn = document.getElementById("toggle-editor-btn");
    const editorWrapper = document.getElementById("editor-wrapper");
    const extractedTextArea = document.getElementById("extracted-text-area");

    let currentFile = null;
    let pdfDoc = null;
    let totalPages = 0;
    let parsedPagesData = [];
    let generatedDocxBlob = null;

    // Trigger File Input Click
    selectPdfBtn.addEventListener("click", () => pdfInput.click());

    // Drag and Drop Effects
    ["dragenter", "dragover"].forEach(eventName => {
        uploadStage.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadStage.style.borderColor = "#e5322d";
            uploadStage.style.background = "rgba(229, 50, 45, 0.05)";
        }, false);
    });

    ["dragleave", "drop"].forEach(eventName => {
        uploadStage.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadStage.style.borderColor = "var(--border-color)";
            uploadStage.style.background = "var(--bg-secondary)";
        }, false);
    });

    uploadStage.addEventListener("drop", (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === "application/pdf") {
            handlePdfFile(files[0]);
        } else {
            alert("Please select a valid PDF file.");
        }
    });

    pdfInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handlePdfFile(e.target.files[0]);
        }
    });

    changePdfBtn.addEventListener("click", resetToUploadStage);

    function resetToUploadStage() {
        currentFile = null;
        pdfDoc = null;
        totalPages = 0;
        parsedPagesData = [];
        generatedDocxBlob = null;
        pdfInput.value = "";
        
        previewStage.style.display = "none";
        loadingStage.style.display = "none";
        successStage.style.display = "none";
        uploadStage.style.display = "block";
    }

    // Load PDF & Render Thumbnail Card
    async function handlePdfFile(file) {
        currentFile = file;
        previewFileName.textContent = file.name;
        previewFileMeta.textContent = `Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`;

        uploadStage.style.display = "none";
        loadingStage.style.display = "block";
        loadingTitle.textContent = "Loading PDF Document...";
        loadingSubtitle.textContent = "Reading pages & rendering preview card";

        try {
            const arrayBuffer = await file.arrayBuffer();
            pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            totalPages = pdfDoc.numPages;
            
            pageCountBadge.textContent = totalPages;
            previewFileMeta.textContent = `${totalPages} Page${totalPages > 1 ? 's' : ''} | ${(file.size / (1024 * 1024)).toFixed(2)} MB`;

            // Render Page 1 Thumbnail onto Canvas
            const page1 = await pdfDoc.getPage(1);
            const viewport = page1.getViewport({ scale: 0.5 });
            pdfThumbCanvas.width = viewport.width;
            pdfThumbCanvas.height = viewport.height;

            const renderContext = {
                canvasContext: pdfThumbCanvas.getContext("2d"),
                viewport: viewport
            };
            await page1.render(renderContext).promise;

            loadingStage.style.display = "none";
            previewStage.style.display = "block";

        } catch (err) {
            console.error(err);
            alert("Error loading PDF document. Make sure the file is not corrupted or password-protected.");
            resetToUploadStage();
        }
    }

    // Convert to WORD Action Button Click
    convertNowBtn.addEventListener("click", async () => {
        if (!pdfDoc) return;

        const mode = conversionModeSelect.value || "high-fidelity";

        previewStage.style.display = "none";
        loadingStage.style.display = "block";
        loadingTitle.textContent = "Converting PDF to WORD...";
        loadingSubtitle.textContent = "Matching exact PDF page dimensions & layout";

        parsedPagesData = [];
        let rawFullText = "";

        try {
            for (let i = 1; i <= totalPages; i++) {
                loadingSubtitle.textContent = `Processing Page ${i} of ${totalPages}...`;
                
                const page = await pdfDoc.getPage(i);
                const unscaledViewport = page.getViewport({ scale: 1.0 });
                const scale = 2.0; // High resolution rendering scale
                const viewport = page.getViewport({ scale: scale });
                
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = viewport.width;
                tempCanvas.height = viewport.height;
                const ctx = tempCanvas.getContext("2d", { willReadFrequently: true });
                
                await page.render({ canvasContext: ctx, viewport: viewport }).promise;

                const imgArrayBuffer = await canvasToArrayBuffer(tempCanvas);
                const textContent = await page.getTextContent();
                const pageParsed = parsePageTextWithColorAndSize(textContent, ctx, viewport.height, viewport.width, scale, i);

                parsedPagesData.push({
                    pageNum: i,
                    lines: pageParsed.lines,
                    plainText: pageParsed.plainText,
                    imageArrayBuffer: imgArrayBuffer,
                    widthPt: unscaledViewport.width,
                    heightPt: unscaledViewport.height
                });

                rawFullText += `\n\n--- PAGE ${i} ---\n\n` + pageParsed.plainText;
            }

            extractedTextArea.value = rawFullText.trim();

            loadingSubtitle.textContent = "Packing native Word document (.docx)...";
            generatedDocxBlob = await buildDocxBlobByMode(parsedPagesData, mode);

            loadingStage.style.display = "none";
            successStage.style.display = "block";

        } catch (err) {
            console.error("Conversion error:", err);
            alert("An error occurred during conversion. Please try again.");
            previewStage.style.display = "block";
            loadingStage.style.display = "none";
        }
    });

    // High-Precision Page Text Items Parser
    function parsePageTextWithColorAndSize(textContent, canvasCtx, canvasHeight, canvasWidth, scale, pageNum) {
        const items = textContent.items;
        if (!items || items.length === 0) {
            return { lines: [], plainText: "" };
        }

        const linesMap = new Map();

        items.forEach(item => {
            if (!item.str || item.str.trim() === "") return;

            const rawFontSize = Math.hypot(item.transform[0], item.transform[1]);
            const fontSizePt = Math.round(rawFontSize > 0 ? rawFontSize : 11);

            const xPt = item.transform[4];
            const yPt = item.transform[5];

            const sampleX = Math.min(canvasWidth - 1, Math.max(0, Math.round((xPt + 2) * scale)));
            const sampleY = Math.min(canvasHeight - 1, Math.max(0, Math.round((canvasHeight / scale - yPt - 2) * scale)));

            let hexColor = "000000";
            try {
                const pixel = canvasCtx.getImageData(sampleX, sampleY, 1, 1).data;
                if (pixel[0] < 240 || pixel[1] < 240 || pixel[2] < 240) {
                    hexColor = rgbToHex(pixel[0], pixel[1], pixel[2]);
                }
            } catch (e) {
                // fallback black
            }

            const fontName = (item.fontName || "").toLowerCase();
            const isBold = fontName.includes("bold") || fontName.includes("black") || fontName.includes("heavy") || fontSizePt >= 16;
            const isItalic = fontName.includes("italic") || fontName.includes("oblique");

            const yKey = Math.round(yPt / 4) * 4;

            if (!linesMap.has(yKey)) {
                linesMap.set(yKey, []);
            }

            linesMap.get(yKey).push({
                str: item.str,
                x: xPt,
                fontSize: fontSizePt,
                bold: isBold,
                italic: isItalic,
                color: hexColor
            });
        });

        const sortedYKeys = Array.from(linesMap.keys()).sort((a, b) => b - a);
        const parsedLines = [];
        let plainText = "";

        const pagePtWidth = canvasWidth / scale;

        sortedYKeys.forEach(yKey => {
            const lineItems = linesMap.get(yKey);
            lineItems.sort((a, b) => a.x - b.x);

            const firstX = lineItems[0].x;
            let textAlign = "left";
            if (firstX > pagePtWidth * 0.3 && firstX < pagePtWidth * 0.55) {
                textAlign = "center";
            } else if (firstX >= pagePtWidth * 0.55) {
                textAlign = "right";
            }

            let lineStr = "";
            lineItems.forEach(item => {
                lineStr += item.str + " ";
            });

            plainText += lineStr.trim() + "\n";
            parsedLines.push({
                alignment: textAlign,
                items: lineItems,
                fullStr: lineStr.trim()
            });
        });

        return { lines: parsedLines, plainText: plainText };
    }

    function canvasToArrayBuffer(canvas) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsArrayBuffer(blob);
            }, "image/png");
        });
    }

    function rgbToHex(r, g, b) {
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    }

    // Build Exact 1-to-1 Dynamic Page Dimensions OpenXML Word Document (.docx) using docx.js
    async function buildDocxBlobByMode(pagesData, mode) {
        if (window.docx) {
            try {
                const { Document, Paragraph, TextRun, ImageRun, AlignmentType, PageBreak, PageOrientation, Packer } = window.docx;
                const docChildren = [];

                // Read exact PDF dimensions from first page (e.g. 4:3 slide vs Portrait A4)
                const firstPage = pagesData[0] || { widthPt: 595, heightPt: 842 };
                const pageWidthPt = Math.round(firstPage.widthPt);
                const pageHeightPt = Math.round(firstPage.heightPt);
                const isLandscape = pageWidthPt > pageHeightPt;

                // Conversion in Twips (1 pt = 20 twips in Word OpenXML)
                const wordWidthTwips = Math.round(pageWidthPt * 20);
                const wordHeightTwips = Math.round(pageHeightPt * 20);

                for (let pIdx = 0; pIdx < pagesData.length; pIdx++) {
                    const pageObj = pagesData[pIdx];

                    // Page break between pages
                    if (pIdx > 0) {
                        docChildren.push(new Paragraph({
                            children: [new PageBreak()]
                        }));
                    }

                    if (mode === "high-fidelity") {
                        // High-Fidelity Mode (iLovePDF Style):
                        // Embed 100% exact page size image matching PDF dimensions with zero margins
                        if (pageObj.imageArrayBuffer) {
                            docChildren.push(new Paragraph({
                                children: [
                                    new ImageRun({
                                        data: pageObj.imageArrayBuffer,
                                        transformation: {
                                            width: Math.round(pageObj.widthPt),
                                            height: Math.round(pageObj.heightPt)
                                        }
                                    })
                                ],
                                alignment: AlignmentType.CENTER,
                                spacing: { before: 0, after: 0 }
                            }));
                        }
                    } else {
                        // Text-Editable Mode:
                        pageObj.lines.forEach(lineObj => {
                            const runs = [];
                            lineObj.items.forEach(item => {
                                runs.push(new TextRun({
                                    text: item.str + " ",
                                    bold: item.bold,
                                    italic: item.italic,
                                    color: item.color || "111111",
                                    size: Math.round((item.fontSize || 11) * 2),
                                    font: "Calibri"
                                }));
                            });

                            let alignEnum = AlignmentType.LEFT;
                            if (lineObj.alignment === "center") alignEnum = AlignmentType.CENTER;
                            if (lineObj.alignment === "right") alignEnum = AlignmentType.RIGHT;

                            docChildren.push(new Paragraph({
                                children: runs,
                                alignment: alignEnum,
                                spacing: { before: 60, after: 60, line: 260 }
                            }));
                        });
                    }
                }

                const doc = new Document({
                    sections: [{
                        properties: {
                            page: {
                                size: {
                                    width: wordWidthTwips,
                                    height: wordHeightTwips,
                                    orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT
                                },
                                margin: { top: 0, right: 0, bottom: 0, left: 0 } // Zero margin for 1-to-1 exact page size
                            }
                        },
                        children: docChildren
                    }]
                });

                return await Packer.toBlob(doc);
            } catch (err) {
                console.error("docx.js build error:", err);
            }
        }

        return generateRtfWordBlob(extractedTextArea.value);
    }

    function generateRtfWordBlob(textContent) {
        const lines = textContent.split("\n");
        let rtfBody = "";

        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith("--- PAGE")) {
                rtfBody += `\\page \\b\\fs26\\cf1 ${escapeRtf(trimmed)}\\b0\\fs22\\cf0 \\par\\par\n`;
            } else if (trimmed === "") {
                rtfBody += `\\par\n`;
            } else {
                rtfBody += `\\fs22 ${escapeRtf(trimmed)}\\par\n`;
            }
        });

        const rtfDoc = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0\\fnil\\fcharset0 Calibri;}}{\\colortbl ;\\red0\\green51\\blue102;}\\viewkind4\\uc1\\pard\\f0\\fs22 ${rtfBody}}`;
        return new Blob([rtfDoc], { type: "application/rtf" });
    }

    function escapeRtf(text) {
        return text.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
    }

    // Download Primary Word (.docx)
    downloadWordPrimaryBtn.addEventListener("click", async () => {
        let blob = generatedDocxBlob;
        if (!blob) {
            blob = await buildDocxBlobByMode(parsedPagesData, conversionModeSelect.value || "high-fidelity");
        }
        const fileName = (currentFile ? currentFile.name.replace(/\.pdf$/i, "") : "converted_document") + ".docx";
        downloadBlob(blob, fileName);
    });

    // Download Secondary Word (.doc / .rtf)
    downloadDocAltBtn.addEventListener("click", () => {
        const blob = generateRtfWordBlob(extractedTextArea.value);
        const fileName = (currentFile ? currentFile.name.replace(/\.pdf$/i, "") : "converted_document") + ".doc";
        downloadBlob(blob, fileName);
    });

    // Copy Raw Text
    copyTextAltBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(extractedTextArea.value).then(() => {
            copyTextAltBtn.textContent = "✓ Copied!";
            setTimeout(() => {
                copyTextAltBtn.textContent = "📋 Copy Raw Text";
            }, 2000);
        });
    });

    // Toggle Text Editor
    toggleEditorBtn.addEventListener("click", () => {
        if (editorWrapper.style.display === "none" || !editorWrapper.style.display) {
            editorWrapper.style.display = "block";
            toggleEditorBtn.textContent = "🙈 Hide Text Editor";
        } else {
            editorWrapper.style.display = "none";
            toggleEditorBtn.textContent = "✏️ Edit Text Content";
        }
    });

    function downloadBlob(blob, fileName) {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }
});
