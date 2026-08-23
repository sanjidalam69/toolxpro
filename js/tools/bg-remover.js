// ToolX Pro - AI Background Remover & High-Precision PNG Generator
document.addEventListener("DOMContentLoaded", () => {
    const imgUpload = document.getElementById("img-upload");
    const controlsPanel = document.getElementById("controls-panel");
    const bgToolType = document.getElementById("bg-tool-type");
    const colorSamplerSection = document.getElementById("color-sampler-section");
    const pickerCanvas = document.getElementById("picker-canvas");
    const colorPreviewBox = document.getElementById("color-preview-box");
    const colorHexLabel = document.getElementById("color-hex-label");
    const toleranceSlider = document.getElementById("tolerance-slider");
    const toleranceVal = document.getElementById("tolerance-val");
    const processBtn = document.getElementById("process-btn");
    const aiLoadingText = document.getElementById("ai-loading-text");
    const resultsCard = document.getElementById("results");
    const comparisonContainer = document.getElementById("comparison-container");
    const origImagePreview = document.getElementById("orig-image-preview");
    const viewSideBySide = document.getElementById("view-side-by-side");
    const viewResultOnly = document.getElementById("view-result-only");
    const brushEraseBtn = document.getElementById("brush-erase-btn");
    const brushRestoreBtn = document.getElementById("brush-restore-btn");
    const pngCanvas = document.getElementById("png-canvas");
    const eraserSize = document.getElementById("eraser-size");
    const downloadPng = document.getElementById("download-png");

    let loadedImg = null;
    let selectedRGB = { r: 255, g: 255, b: 255 };
    let isBrushing = false;
    let currentBrushMode = "erase";
    let selfieSegmentation = null;

    // Brush Mode Switcher
    if (brushEraseBtn && brushRestoreBtn) {
        brushEraseBtn.addEventListener("click", () => {
            currentBrushMode = "erase";
            brushEraseBtn.classList.add("active-view");
            brushRestoreBtn.classList.remove("active-view");
        });

        brushRestoreBtn.addEventListener("click", () => {
            currentBrushMode = "restore";
            brushRestoreBtn.classList.add("active-view");
            brushEraseBtn.classList.remove("active-view");
        });
    }

    // View Toggles
    if (viewSideBySide && viewResultOnly) {
        viewSideBySide.addEventListener("click", () => {
            comparisonContainer.style.gridTemplateColumns = "repeat(auto-fit, minmax(280px, 1fr))";
            origImagePreview.parentElement.parentElement.style.display = "block";
            viewSideBySide.classList.add("active-view");
            viewResultOnly.classList.remove("active-view");
        });

        viewResultOnly.addEventListener("click", () => {
            comparisonContainer.style.gridTemplateColumns = "1fr";
            origImagePreview.parentElement.parentElement.style.display = "none";
            viewResultOnly.classList.add("active-view");
            viewSideBySide.classList.remove("active-view");
        });
    }

    // Toggle sampler visibility
    bgToolType.addEventListener("change", () => {
        if (bgToolType.value === "color-key") {
            colorSamplerSection.style.display = "flex";
        } else {
            colorSamplerSection.style.display = "none";
        }
    });

    toleranceSlider.addEventListener("input", () => {
        toleranceVal.innerText = toleranceSlider.value;
    });

    imgUpload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => {
                loadedImg = img;
                origImagePreview.src = evt.target.result;
                
                pickerCanvas.width = img.width;
                pickerCanvas.height = img.height;
                const pCtx = pickerCanvas.getContext("2d");
                pCtx.drawImage(img, 0, 0);

                const pixel = pCtx.getImageData(0, 0, 1, 1).data;
                updateSelectedColor(pixel[0], pixel[1], pixel[2]);

                controlsPanel.style.display = "flex";
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Sample color from canvas
    pickerCanvas.addEventListener("click", (e) => {
        if (!loadedImg) return;
        const rect = pickerCanvas.getBoundingClientRect();
        const scaleX = pickerCanvas.width / rect.width;
        const scaleY = pickerCanvas.height / rect.height;

        const x = Math.floor((e.clientX - rect.left) * scaleX);
        const y = Math.floor((e.clientY - rect.top) * scaleY);

        const pCtx = pickerCanvas.getContext("2d");
        const pixel = pCtx.getImageData(x, y, 1, 1).data;

        updateSelectedColor(pixel[0], pixel[1], pixel[2]);
    });

    function updateSelectedColor(r, g, b) {
        selectedRGB = { r, g, b };
        const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        colorPreviewBox.style.backgroundColor = hex;
        colorHexLabel.innerText = hex;
    }

    processBtn.addEventListener("click", async () => {
        if (!loadedImg) return;

        const tool = bgToolType.value;

        if (tool === "ai-person") {
            aiLoadingText.style.display = "block";
            processBtn.disabled = true;

            try {
                if (!selfieSegmentation && typeof SelfieSegmentation !== 'undefined') {
                    selfieSegmentation = new SelfieSegmentation({
                        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
                    });
                    selfieSegmentation.setOptions({ modelSelection: 1 });
                    selfieSegmentation.onResults(onAiResults);
                }

                if (selfieSegmentation) {
                    await selfieSegmentation.send({ image: loadedImg });
                } else {
                    alert("AI model script not loaded. Switching to Color Key mode.");
                    runColorKey();
                }
            } catch (err) {
                console.error("AI Error:", err);
                runColorKey();
            } finally {
                aiLoadingText.style.display = "none";
                processBtn.disabled = false;
            }
        } else {
            runColorKey();
        }
    });

    // Pure AI Segmentation Handler
    function onAiResults(results) {
        const w = loadedImg.width;
        const h = loadedImg.height;

        pngCanvas.width = w;
        pngCanvas.height = h;

        const ctx = pngCanvas.getContext("2d");
        ctx.save();
        ctx.clearRect(0, 0, w, h);

        ctx.drawImage(results.segmentationMask, 0, 0, w, h);
        ctx.globalCompositeOperation = 'source-in';
        ctx.drawImage(loadedImg, 0, 0, w, h);
        ctx.restore();

        updateDownloadUrl();
        aiLoadingText.style.display = "none";
        processBtn.disabled = false;

        resultsCard.style.display = "block";
        resultsCard.scrollIntoView({ behavior: "smooth" });
    }

    // Color Key Mode (For Logos & Signatures)
    function runColorKey() {
        const w = loadedImg.width;
        const h = loadedImg.height;

        pngCanvas.width = w;
        pngCanvas.height = h;

        const ctx = pngCanvas.getContext("2d");
        ctx.drawImage(loadedImg, 0, 0);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        const targetR = selectedRGB.r;
        const targetG = selectedRGB.g;
        const targetB = selectedRGB.b;

        const tolerance = (parseFloat(toleranceSlider.value) / 100) * 255;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const diff = Math.sqrt(
                Math.pow(r - targetR, 2) +
                Math.pow(g - targetG, 2) +
                Math.pow(b - targetB, 2)
            );

            if (diff <= tolerance) {
                data[i + 3] = 0;
            }
        }

        ctx.putImageData(imgData, 0, 0);
        updateDownloadUrl();

        resultsCard.style.display = "block";
        resultsCard.scrollIntoView({ behavior: "smooth" });
    }

    // Interactive Brush (Erase or Restore)
    function applyBrush(e) {
        if (!isBrushing || !loadedImg) return;
        const rect = pngCanvas.getBoundingClientRect();
        const scaleX = pngCanvas.width / rect.width;
        const scaleY = pngCanvas.height / rect.height;

        const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
        const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

        const cx = x * scaleX;
        const cy = y * scaleY;
        const radius = parseInt(eraserSize.value);

        const ctx = pngCanvas.getContext("2d");

        if (currentBrushMode === "erase") {
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(loadedImg, 0, 0, pngCanvas.width, pngCanvas.height);
            ctx.restore();
        }

        updateDownloadUrl();
    }

    function updateDownloadUrl() {
        downloadPng.href = pngCanvas.toDataURL("image/png");
    }

    pngCanvas.addEventListener("mousedown", (e) => { isBrushing = true; applyBrush(e); });
    pngCanvas.addEventListener("mousemove", applyBrush);
    window.addEventListener("mouseup", () => { isBrushing = false; });

    pngCanvas.addEventListener("touchstart", (e) => { isBrushing = true; applyBrush(e); });
    pngCanvas.addEventListener("touchmove", applyBrush);
    window.addEventListener("touchend", () => { isBrushing = false; });
});
