// ToolX Pro - CamScanner Document Scanner & Image to PDF Engine (v71.0)
document.addEventListener("DOMContentLoaded", () => {
    // Core DOM Elements
    const dropArea = document.getElementById("drop-area");
    const imageUpload = document.getElementById("image-upload");
    const settingsArea = document.getElementById("settings-area");
    const imagesList = document.getElementById("images-list");
    const createPdfBtn = document.getElementById("create-pdf-btn");
    const resultsCard = document.getElementById("results");
    const resultsContent = document.getElementById("results-content");
    const addMoreBtn = document.getElementById("add-more-btn");
    const clearAllBtn = document.getElementById("clear-all-btn");
    const imagesCountHeading = document.getElementById("images-count-heading");

    const pageSizeSelect = document.getElementById("pdf-page-size");
    const orientationSelect = document.getElementById("pdf-orientation");
    const marginSelect = document.getElementById("pdf-margin");
    const qualitySelect = document.getElementById("pdf-quality");
    const globalFilterChips = document.getElementById("global-filter-chips");

    // CamScanner Cropper Modal Elements
    const cropModal = document.getElementById("crop-modal");
    const cropModalCloseBtn = document.getElementById("crop-modal-close-btn");
    const cropCancelBtn = document.getElementById("crop-cancel-btn");
    const cropApplyBtn = document.getElementById("crop-apply-btn");
    const cropAutoDetectBtn = document.getElementById("crop-auto-detect-btn");
    const cropFullBtn = document.getElementById("crop-full-btn");
    const cropRotateLeftBtn = document.getElementById("crop-rotate-left-btn");
    const cropRotateRightBtn = document.getElementById("crop-rotate-right-btn");
    const cropCanvas = document.getElementById("crop-canvas");

    // Internal State
    let uploadedFiles = [];
    let currentGlobalFilter = 'magic';

    // =========================================================
    // 1. FILE UPLOAD & AUTOMATIC BOUNDARY DETECTION
    // =========================================================
    dropArea.addEventListener("click", () => imageUpload.click());
    if (addMoreBtn) addMoreBtn.addEventListener("click", () => imageUpload.click());

    if (clearAllBtn) {
        clearAllBtn.addEventListener("click", () => {
            if (uploadedFiles.length === 0) return;
            if (confirm("Are you sure you want to clear all uploaded pages?")) {
                uploadedFiles = [];
                renderImagesList();
                resultsCard.style.display = "none";
            }
        });
    }

    dropArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropArea.classList.add("dragover");
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("dragover");
    });

    dropArea.addEventListener("drop", (e) => {
        e.preventDefault();
        dropArea.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesSelect(e.dataTransfer.files);
        }
    });

    imageUpload.addEventListener("change", (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesSelect(e.target.files);
            imageUpload.value = ''; // Reset input so same file can be re-selected
        }
    });

    // Global Filter Chips
    if (globalFilterChips) {
        globalFilterChips.addEventListener("click", (e) => {
            const chip = e.target.closest(".filter-chip");
            if (!chip) return;

            globalFilterChips.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            currentGlobalFilter = chip.getAttribute("data-filter") || 'magic';

            // Apply global filter across all pages
            uploadedFiles.forEach(file => {
                file.filter = currentGlobalFilter;
            });

            renderImagesList();
        });
    }

    /**
     * Ingest Uploaded Images.
     * Automatically eliminates unnecessary sides (laptop keyboard, yellow desk, pencil)
     * while preserving 100% of handwriting, dates, and margins.
     */
    function handleFilesSelect(files) {
        const fileArray = Array.from(files).filter(file => file.type.match('image.*'));
        if (fileArray.length === 0) return;

        let loadedCount = 0;

        fileArray.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // 1. Automatically detect exact paper bounds
                    const autoBounds = detectExactDocumentBounds(img, 0);

                    // 2. Crop working image to the detected paper boundaries
                    const origW = img.naturalWidth || img.width;
                    const origH = img.naturalHeight || img.height;

                    const cropX = Math.round(autoBounds.x * origW);
                    const cropY = Math.round(autoBounds.y * origH);
                    const cropW = Math.round(autoBounds.w * origW);
                    const cropH = Math.round(autoBounds.h * origH);

                    const initialCanvas = document.createElement("canvas");
                    initialCanvas.width = Math.max(1, cropW);
                    initialCanvas.height = Math.max(1, cropH);
                    const ictx = initialCanvas.getContext("2d");
                    ictx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

                    const croppedImg = new Image();
                    croppedImg.onload = () => {
                        uploadedFiles.push({
                            id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            rawImgElement: img,          // Original untouched backup
                            imgElement: croppedImg,      // Auto-cleaned paper image
                            cropBox: autoBounds,
                            filter: currentGlobalFilter,
                            rotation: 0
                        });

                        loadedCount++;
                        if (loadedCount === fileArray.length) {
                            settingsArea.style.display = "block";
                            resultsCard.style.display = "none";
                            renderImagesList();
                        }
                    };
                    croppedImg.src = initialCanvas.toDataURL("image/jpeg", 0.95);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Precision Document Boundary Detector:
     * Mathematically identifies laptop keyboard rows and yellow desk / pencil columns
     * to crop them out completely, while leaving handwriting, top date boxes, and margin lines intact.
     */
    function detectExactDocumentBounds(img, rotation = 0) {
        const isRot = (rotation === 90 || rotation === 270);
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;
        const srcW = isRot ? origH : origW;
        const srcH = isRot ? origW : origH;

        const analysisW = 450;
        const scale = analysisW / srcW;
        const analysisH = Math.max(10, Math.round(srcH * scale));

        const canvas = document.createElement("canvas");
        canvas.width = analysisW;
        canvas.height = analysisH;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        ctx.save();
        ctx.translate(analysisW / 2, analysisH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        const dw = isRot ? analysisH : analysisW;
        const dh = isRot ? analysisW : analysisH;
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();

        const imgData = ctx.getImageData(0, 0, analysisW, analysisH);
        const data = imgData.data;

        const lums = new Float32Array(analysisW * analysisH);
        const diffRB = new Float32Array(analysisW * analysisH);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const idx = i / 4;
            lums[idx] = 0.299 * r + 0.587 * g + 0.114 * b;
            diffRB[idx] = Math.abs(r - b);
        }

        // 1. Detect Top Edge (Laptop keyboard / dark chassis)
        let topCut = 0;
        const maxTopScan = Math.round(analysisH * 0.35);
        const keyboardRows = [];
        for (let y = 0; y < maxTopScan; y++) {
            let darkHits = 0;
            let sumLum = 0;
            const rowOffset = y * analysisW;
            for (let x = 0; x < analysisW; x++) {
                const l = lums[rowOffset + x];
                sumLum += l;
                if (l < 110) darkHits++;
            }
            const darkRatio = darkHits / analysisW;
            const meanLum = sumLum / analysisW;
            if (darkRatio > 0.25 || meanLum < 160) {
                keyboardRows.push(y);
            }
        }
        if (keyboardRows.length > 0) {
            const lastRow = keyboardRows[keyboardRows.length - 1];
            topCut = Math.min(Math.round(analysisH * 0.25), lastRow + 2);
        }

        // 2. Detect Right Edge (Yellow desk / green pencil / dark borders)
        let rightCut = analysisW - 1;
        const yStart = Math.max(topCut, Math.round(analysisH * 0.15));
        const yEnd = Math.round(analysisH * 0.85);
        const scanHeight = Math.max(1, yEnd - yStart);
        const deskCols = [];

        for (let x = Math.round(analysisW * 0.50); x < analysisW; x++) {
            let darkHits = 0;
            let sumDiff = 0;
            for (let y = yStart; y < yEnd; y++) {
                const idx = y * analysisW + x;
                sumDiff += diffRB[idx];
                if (lums[idx] < 100) darkHits++;
            }
            const meanDiff = sumDiff / scanHeight;
            const darkRatio = darkHits / scanHeight;
            if (meanDiff > 20.0 || darkRatio > 0.25) {
                deskCols.push(x);
            }
        }
        if (deskCols.length > 0) {
            rightCut = Math.max(Math.round(analysisW * 0.55), deskCols[0] - 2);
        }

        // 3. Detect Left Edge (Desk / shadow on the left)
        let leftCut = 0;
        const leftDeskCols = [];
        for (let x = 0; x < Math.round(analysisW * 0.25); x++) {
            let darkHits = 0;
            let sumDiff = 0;
            for (let y = yStart; y < yEnd; y++) {
                const idx = y * analysisW + x;
                sumDiff += diffRB[idx];
                if (lums[idx] < 100) darkHits++;
            }
            const meanDiff = sumDiff / scanHeight;
            const darkRatio = darkHits / scanHeight;
            if (meanDiff > 20.0 || darkRatio > 0.35) {
                leftDeskCols.push(x);
            }
        }
        if (leftDeskCols.length > 0) {
            const lastLeft = leftDeskCols[leftDeskCols.length - 1];
            leftCut = Math.min(Math.round(analysisW * 0.15), lastLeft + 2);
        }

        // 4. Detect Bottom Edge (Desk below paper)
        let bottomCut = analysisH - 1;
        const bottomRows = [];
        const scanWidth = Math.max(1, rightCut - leftCut);
        for (let y = analysisH - 1; y > Math.round(analysisH * 0.85); y--) {
            let darkHits = 0;
            let sumLum = 0;
            const rowOffset = y * analysisW;
            for (let x = leftCut; x < rightCut; x++) {
                const l = lums[rowOffset + x];
                sumLum += l;
                if (l < 100) darkHits++;
            }
            const darkRatio = darkHits / scanWidth;
            const meanLum = sumLum / scanWidth;
            if (darkRatio > 0.40 || meanLum < 130) {
                bottomRows.push(y);
            }
        }
        if (bottomRows.length > 0) {
            bottomCut = Math.max(Math.round(analysisH * 0.80), bottomRows[bottomRows.length - 1] - 2);
        }

        return {
            x: Math.max(0.0, Math.min(0.25, leftCut / analysisW)),
            y: Math.max(0.0, Math.min(0.25, topCut / analysisH)),
            w: Math.min(1.0, Math.max(0.50, (rightCut - leftCut) / analysisW)),
            h: Math.min(1.0, Math.max(0.50, (bottomCut - topCut) / analysisH))
        };
    }

    // =========================================================
    // 2. DOCUMENT PAGES LIST & CARD MANAGER
    // =========================================================
    function renderImagesList() {
        imagesList.innerHTML = '';

        if (uploadedFiles.length === 0) {
            settingsArea.style.display = "none";
            if (imagesCountHeading) imagesCountHeading.innerText = "Uploaded Document Pages (0):";
            return;
        }

        if (imagesCountHeading) {
            imagesCountHeading.innerText = `Uploaded Document Pages (${uploadedFiles.length}):`;
        }

        uploadedFiles.forEach((file, index) => {
            const card = document.createElement("div");
            card.className = "scan-item-card";

            const sizeKb = (file.size / 1024).toFixed(1);

            card.innerHTML = `
                <div class="scan-card-header">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span class="scan-page-badge">Page ${index + 1}</span>
                        <div style="display:inline-flex; gap:3px;">
                            <button type="button" class="scan-btn-icon" style="width:24px; height:24px; font-size:0.75rem;" onclick="window.moveImageOrder(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Move Up">▲</button>
                            <button type="button" class="scan-btn-icon" style="width:24px; height:24px; font-size:0.75rem;" onclick="window.moveImageOrder(${index}, 1)" ${index === uploadedFiles.length - 1 ? 'disabled' : ''} title="Move Down">▼</button>
                        </div>
                    </div>
                    <span style="font-size:0.75rem; color:var(--text-secondary); margin-left:auto; flex-shrink:0;">${sizeKb} KB</span>
                </div>

                <div class="scan-thumb-container" onclick="window.openCropper(${index})" title="Click to adjust crop boundaries">
                    <canvas class="scan-thumb-canvas" id="canvas_${file.id}"></canvas>
                </div>

                <div class="scan-item-meta">
                    <span class="scan-item-name" title="${file.name}">${file.name}</span>
                    <div class="scan-item-controls">
                        <button type="button" class="scan-btn-pill primary" onclick="window.openCropper(${index})" title="Adjust Crop Boundaries">
                            ✂️ Crop / Adjust
                        </button>
                        <button type="button" class="scan-btn-pill" onclick="window.rotateImage(${index})" title="Rotate 90°">
                            🔄 ${file.rotation > 0 ? file.rotation + '°' : 'Rotate'}
                        </button>
                        <button type="button" class="scan-btn-icon" onclick="window.removeScanImage(${index})" title="Delete Page" style="color:var(--danger, #ef4444);">
                            🗑️
                        </button>
                    </div>

                    <select class="scan-select-mini" onchange="window.updateImageFilter(${index}, this.value)">
                        <option value="magic" ${file.filter === 'magic' ? 'selected' : ''}>✨ Magic Color (CamScanner)</option>
                        <option value="bw" ${file.filter === 'bw' ? 'selected' : ''}>📄 B&W Clean Scan (Photocopy)</option>
                        <option value="sharp" ${file.filter === 'sharp' ? 'selected' : ''}>⚡ Sharp Document</option>
                        <option value="gray" ${file.filter === 'gray' ? 'selected' : ''}>🩶 Grayscale Scan</option>
                        <option value="original" ${file.filter === 'original' ? 'selected' : ''}>🖼️ Original (Raw)</option>
                    </select>
                </div>
            `;

            imagesList.appendChild(card);

            // Render live thumbnail on card canvas
            setTimeout(() => {
                const canvas = document.getElementById(`canvas_${file.id}`);
                if (canvas) {
                    renderProcessedCanvas(canvas, file.imgElement, file.filter, file.rotation, 320, 380);
                }
            }, 10);
        });
    }

    window.updateImageFilter = (index, newFilter) => {
        if (uploadedFiles[index]) {
            uploadedFiles[index].filter = newFilter;
            const canvas = document.getElementById(`canvas_${uploadedFiles[index].id}`);
            if (canvas) {
                renderProcessedCanvas(canvas, uploadedFiles[index].imgElement, newFilter, uploadedFiles[index].rotation, 320, 380);
            }
        }
    };

    window.rotateImage = (index) => {
        if (uploadedFiles[index]) {
            uploadedFiles[index].rotation = (uploadedFiles[index].rotation + 90) % 360;
            renderImagesList();
        }
    };

    window.moveImageOrder = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex >= 0 && targetIndex < uploadedFiles.length) {
            const temp = uploadedFiles[index];
            uploadedFiles[index] = uploadedFiles[targetIndex];
            uploadedFiles[targetIndex] = temp;
            renderImagesList();
        }
    };

    window.removeScanImage = (index) => {
        uploadedFiles.splice(index, 1);
        renderImagesList();
    };

    // =========================================================
    // 3. CAMSCANNER DOCUMENT FILTER ENGINE (PURE LUMINANCE GAIN)
    // =========================================================
    function renderProcessedCanvas(canvas, img, filter, rotation, maxW = null, maxH = null) {
        const isRot = (rotation === 90 || rotation === 270);
        let origW = img.naturalWidth || img.width;
        let origH = img.naturalHeight || img.height;

        let targetW = isRot ? origH : origW;
        let targetH = isRot ? origW : origH;

        if (maxW && maxH) {
            let ratio = Math.min(maxW / targetW, maxH / targetH);
            targetW = Math.max(1, Math.round(targetW * ratio));
            targetH = Math.max(1, Math.round(targetH * ratio));
        }

        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.clearRect(0, 0, targetW, targetH);

        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);
        ctx.rotate((rotation * Math.PI) / 180);

        const drawW = isRot ? targetH : targetW;
        const drawH = isRot ? targetW : targetH;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        if (filter !== 'original') {
            applyDocumentFilter(ctx, targetW, targetH, filter);
        }
    }

    /**
     * Fast Separable 1D Box Blur for Local Luminance Estimation
     */
    function computeSeparable1DLumBlur(lums, width, height, radius) {
        const len = width * height;
        const temp = new Float32Array(len);
        const blurred = new Float32Array(len);

        // Horizontal Pass
        for (let y = 0; y < height; y++) {
            const rowOffset = y * width;
            let sum = 0;
            let hits = 0;

            for (let x = -radius; x <= radius; x++) {
                const px = Math.min(width - 1, Math.max(0, x));
                sum += lums[rowOffset + px];
                hits++;
            }
            temp[rowOffset] = sum / hits;

            for (let x = 1; x < width; x++) {
                const addX = Math.min(width - 1, x + radius);
                const subX = Math.max(0, x - radius - 1);
                sum += lums[rowOffset + addX] - lums[rowOffset + subX];
                temp[rowOffset + x] = sum / hits;
            }
        }

        // Vertical Pass
        for (let x = 0; x < width; x++) {
            let sum = 0;
            let hits = 0;

            for (let y = -radius; y <= radius; y++) {
                const py = Math.min(height - 1, Math.max(0, y));
                sum += temp[py * width + x];
                hits++;
            }
            blurred[x] = sum / hits;

            for (let y = 1; y < height; y++) {
                const addY = Math.min(height - 1, y + radius);
                const subY = Math.max(0, y - radius - 1);
                sum += temp[addY * width + x] - temp[subY * width + x];
                blurred[y * width + x] = sum / hits;
            }
        }

        return blurred;
    }

    /**
     * Flawless CamScanner Magic Color & Document Filters
     * Uses uniform luminance scaling to guarantee ZERO cyan / neon discoloration.
     */
    function applyDocumentFilter(ctx, width, height, filter) {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const len = width * height;

        if (filter === 'magic') {
            // 1. Calculate pixel luminance map
            const lums = new Float32Array(len);
            for (let i = 0; i < len; i++) {
                const idx = i * 4;
                lums[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            }

            // 2. Compute background illumination surface
            const radius = Math.max(10, Math.round(Math.min(width, height) / 26));
            const bgLum = computeSeparable1DLumBlur(lums, width, height, radius);

            // 3. Luminance-Only Illumination Normalization
            for (let i = 0; i < len; i++) {
                const idx = i * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];

                const bVal = Math.max(30.0, bgLum[i]);
                const k = 255.0 / bVal;

                // Scale all 3 channels by identical luminance gain k
                const normR = Math.min(255, r * k);
                const normG = Math.min(255, g * k);
                const normB = Math.min(255, b * k);
                const normLum = 0.299 * normR + 0.587 * normG + 0.114 * normB;

                if (normLum > 200) {
                    // Clean White Paper Background
                    data[idx] = 255;
                    data[idx + 1] = 255;
                    data[idx + 2] = 255;
                } else {
                    // Deep, crisp handwriting and diagrams
                    data[idx] = Math.max(0, Math.min(255, (normR - 35) * 1.35));
                    data[idx + 1] = Math.max(0, Math.min(255, (normG - 35) * 1.35));
                    data[idx + 2] = Math.max(0, Math.min(255, (normB - 35) * 1.35));
                }
            }

            // Clean outer 2px boundary perimeter to pure white
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) {
                        const idx = (y * width + x) * 4;
                        data[idx] = 255;
                        data[idx + 1] = 255;
                        data[idx + 2] = 255;
                    }
                }
            }

            ctx.putImageData(imgData, 0, 0);

        } else if (filter === 'bw') {
            // Clean Photocopy / High Contrast B&W Scan
            const lums = new Float32Array(len);
            for (let i = 0; i < len; i++) {
                const idx = i * 4;
                lums[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            }

            const radius = Math.max(10, Math.round(Math.min(width, height) / 26));
            const bgLum = computeSeparable1DLumBlur(lums, width, height, radius);

            for (let i = 0; i < len; i++) {
                const idx = i * 4;
                const lum = lums[i];
                const ratio = lum / Math.max(1.0, bgLum[i]);

                let val;
                if (ratio > 0.82) {
                    val = 255;
                } else if (ratio < 0.60) {
                    val = Math.max(0, ratio * 160);
                } else {
                    val = ((ratio - 0.60) / 0.22) * 255;
                }

                data[idx] = val;
                data[idx + 1] = val;
                data[idx + 2] = val;
            }

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) {
                        const idx = (y * width + x) * 4;
                        data[idx] = 255;
                        data[idx + 1] = 255;
                        data[idx + 2] = 255;
                    }
                }
            }

            ctx.putImageData(imgData, 0, 0);

        } else if (filter === 'sharp') {
            // Document Sharpening & Color Boost
            for (let i = 0; i < len * 4; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                r = Math.max(0, Math.min(255, (r - 128) * 1.28 + 140));
                g = Math.max(0, Math.min(255, (g - 128) * 1.28 + 140));
                b = Math.max(0, Math.min(255, (b - 128) * 1.28 + 140));

                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }
            ctx.putImageData(imgData, 0, 0);

        } else if (filter === 'gray') {
            // Smooth Grayscale Scan
            for (let i = 0; i < len * 4; i += 4) {
                const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const val = Math.max(0, Math.min(255, (lum - 128) * 1.30 + 142));
                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
            }
            ctx.putImageData(imgData, 0, 0);
        }
    }

    // =========================================================
    // 4. CAMSCANNER INTERACTIVE CROPPER WITH MAGNIFYING LOUPE
    // =========================================================
    let activeCropIndex = null;
    let cropImg = null;
    let cropRotation = 0;
    let cropBox = { x: 0.0, y: 0.0, w: 1.0, h: 1.0 };
    let isDragging = false;
    let dragMode = null;
    let dragStart = { x: 0, y: 0 };
    let cropBoxStart = { x: 0, y: 0, w: 1, h: 1 };
    let currentPointerPos = { x: 0, y: 0 };

    window.openCropper = (index) => {
        if (!uploadedFiles[index]) return;
        activeCropIndex = index;
        const file = uploadedFiles[index];

        // Always crop from the raw untouched image backup
        cropImg = file.rawImgElement;
        cropRotation = file.rotation || 0;

        // Use file's existing cropBox, or run precision auto detection
        cropBox = file.cropBox ? { ...file.cropBox } : detectExactDocumentBounds(cropImg, cropRotation);

        cropModal.style.display = "flex";
        initCropCanvas();
    };

    function closeCropper() {
        cropModal.style.display = "none";
        activeCropIndex = null;
        cropImg = null;
        isDragging = false;
        dragMode = null;
    }

    if (cropModalCloseBtn) cropModalCloseBtn.addEventListener("click", closeCropper);
    if (cropCancelBtn) cropCancelBtn.addEventListener("click", closeCropper);

    cropModal.addEventListener("click", (e) => {
        if (e.target === cropModal) closeCropper();
    });

    if (cropRotateLeftBtn) {
        cropRotateLeftBtn.addEventListener("click", () => {
            cropRotation = (cropRotation + 270) % 360;
            initCropCanvas();
        });
    }

    if (cropRotateRightBtn) {
        cropRotateRightBtn.addEventListener("click", () => {
            cropRotation = (cropRotation + 90) % 360;
            initCropCanvas();
        });
    }

    // Full 100% Document Reset
    if (cropFullBtn) {
        cropFullBtn.addEventListener("click", () => {
            cropBox = { x: 0.0, y: 0.0, w: 1.0, h: 1.0 };
            drawCropCanvas();
        });
    }

    // Smart Auto-Detect Button (Calculates boundaries to exclude keyboard and desk)
    if (cropAutoDetectBtn) {
        cropAutoDetectBtn.addEventListener("click", () => {
            if (!cropImg) return;
            cropBox = detectExactDocumentBounds(cropImg, cropRotation);
            drawCropCanvas();
        });
    }

    function initCropCanvas() {
        if (!cropImg) return;

        const isRotated = (cropRotation === 90 || cropRotation === 270);
        const imgW = cropImg.naturalWidth || cropImg.width;
        const imgH = cropImg.naturalHeight || cropImg.height;

        const parent = cropCanvas.parentElement;
        const containerW = parent ? parent.clientWidth - 20 : 650;
        const containerH = parent ? parent.clientHeight - 20 : 420;

        const rotatedW = isRotated ? imgH : imgW;
        const rotatedH = isRotated ? imgW : imgH;

        const ratio = Math.min(containerW / rotatedW, containerH / rotatedH, 1);
        cropCanvas.width = Math.max(100, Math.round(rotatedW * ratio));
        cropCanvas.height = Math.max(100, Math.round(rotatedH * ratio));

        drawCropCanvas();
    }

    window.addEventListener("resize", () => {
        if (cropModal.style.display === "flex") {
            initCropCanvas();
        }
    });

    /**
     * Renders Cropper Screen:
     * - Rotated source image
     * - Darkened translucent boundary mask
     * - CamScanner Orange boundary rect + rule of thirds
     * - 8 Magnetic drag handles
     * - CamScanner Magnifying Loupe (Zoom Lens) when dragging
     */
    function drawCropCanvas() {
        if (!cropImg) return;
        const ctx = cropCanvas.getContext("2d");
        const cw = cropCanvas.width;
        const ch = cropCanvas.height;

        ctx.clearRect(0, 0, cw, ch);

        // 1. Draw base image
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate((cropRotation * Math.PI) / 180);
        const isRotated = (cropRotation === 90 || cropRotation === 270);
        const drawW = isRotated ? ch : cw;
        const drawH = isRotated ? cw : ch;
        ctx.drawImage(cropImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        const bx = cropBox.x * cw;
        const by = cropBox.y * ch;
        const bw = cropBox.w * cw;
        const bh = cropBox.h * ch;

        // 2. Translucent Dark Mask Outside Crop Box
        ctx.fillStyle = "rgba(10, 15, 29, 0.72)";
        ctx.fillRect(0, 0, cw, by);
        ctx.fillRect(0, by + bh, cw, ch - (by + bh));
        ctx.fillRect(0, by, bx, bh);
        ctx.fillRect(bx + bw, by, cw - (bx + bw), bh);

        // 3. Selection Box Outline
        ctx.strokeStyle = "#f57c00";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(245, 124, 0, 0.4)";
        ctx.shadowBlur = 6;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // 4. Rule-of-Thirds Grid
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx + bw / 3, by);
        ctx.lineTo(bx + bw / 3, by + bh);
        ctx.moveTo(bx + (2 * bw) / 3, by);
        ctx.lineTo(bx + (2 * bw) / 3, by + bh);
        ctx.moveTo(bx, by + bh / 3);
        ctx.lineTo(bx + bw, by + bh / 3);
        ctx.moveTo(bx, by + (2 * bh) / 3);
        ctx.lineTo(bx + bw, by + (2 * bh) / 3);
        ctx.stroke();

        // 5. 8 Magnetic Handles
        const handles = getCropHandles(bx, by, bw, bh);
        handles.forEach(h => {
            const isCorner = ['nw', 'ne', 'se', 'sw'].includes(h.id);

            ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
            ctx.shadowBlur = 5;

            if (isCorner) {
                // Corner Handle: Dual Ring
                ctx.fillStyle = "#ffffff";
                ctx.strokeStyle = "#f57c00";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(h.x, h.y, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = "#f57c00";
                ctx.beginPath();
                ctx.arc(h.x, h.y, 4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Side Midpoint: Sleek Slider Bar
                ctx.fillStyle = "#ffffff";
                ctx.strokeStyle = "#f57c00";
                ctx.lineWidth = 2.5;

                if (h.id === 'n' || h.id === 's') {
                    ctx.beginPath();
                    ctx.roundRect(h.x - 14, h.y - 4, 28, 8, 4);
                    ctx.fill();
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.roundRect(h.x - 4, h.y - 14, 8, 28, 4);
                    ctx.fill();
                    ctx.stroke();
                }
            }

            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
        });

        // 6. Signature CamScanner Magnifying Loupe (Zoom Lens)
        if (isDragging && dragMode && dragMode !== 'move') {
            drawMagnifyingLoupe(ctx, cw, ch);
        }
    }

    /**
     * Draw Real-Time Magnifying Loupe Bubble Above the Active Drag Handle
     */
    function drawMagnifyingLoupe(ctx, cw, ch) {
        const hx = currentPointerPos.x;
        const hy = currentPointerPos.y;

        const loupeRadius = 46;
        const loupeY = (hy - 75 < loupeRadius) ? hy + 75 : hy - 75;
        const loupeX = Math.max(loupeRadius + 5, Math.min(cw - loupeRadius - 5, hx));

        ctx.save();

        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#000000";
        ctx.fill();
        ctx.clip();

        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        const zoom = 2.4;
        ctx.translate(loupeX, loupeY);
        ctx.scale(zoom, zoom);
        ctx.translate(-hx, -hy);

        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate((cropRotation * Math.PI) / 180);
        const isRotated = (cropRotation === 90 || cropRotation === 270);
        const drawW = isRotated ? ch : cw;
        const drawH = isRotated ? cw : ch;
        ctx.drawImage(cropImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        ctx.restore();

        ctx.save();
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(loupeX, loupeY, loupeRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "#f57c00";
        ctx.beginPath();
        ctx.arc(loupeX, loupeY, loupeRadius - 2.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "#f57c00";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(loupeX - 10, loupeY);
        ctx.lineTo(loupeX + 10, loupeY);
        ctx.moveTo(loupeX, loupeY - 10);
        ctx.lineTo(loupeX, loupeY + 10);
        ctx.stroke();

        ctx.restore();
    }

    function getCropHandles(bx, by, bw, bh) {
        return [
            { id: 'nw', x: bx, y: by, cursor: 'nwse-resize' },
            { id: 'ne', x: bx + bw, y: by, cursor: 'nesw-resize' },
            { id: 'se', x: bx + bw, y: by + bh, cursor: 'nwse-resize' },
            { id: 'sw', x: bx, y: by + bh, cursor: 'nesw-resize' },
            { id: 'n', x: bx + bw / 2, y: by, cursor: 'ns-resize' },
            { id: 's', x: bx + bw / 2, y: by, cursor: 'ns-resize' },
            { id: 'w', x: bx, y: by + bh / 2, cursor: 'ew-resize' },
            { id: 'e', x: bx + bw, y: by + bh / 2, cursor: 'ew-resize' }
        ];
    }

    function getCanvasPos(e) {
        const rect = cropCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    function hitTestHandle(pos) {
        const cw = cropCanvas.width;
        const ch = cropCanvas.height;
        const bx = cropBox.x * cw;
        const by = cropBox.y * ch;
        const bw = cropBox.w * cw;
        const bh = cropBox.h * ch;
        const hitDist = 32;

        const handles = getCropHandles(bx, by, bw, bh);
        for (let h of handles) {
            const dist = Math.hypot(pos.x - h.x, pos.y - h.y);
            if (dist <= hitDist) return h;
        }

        if (pos.x >= bx && pos.x <= bx + bw && pos.y >= by && pos.y <= by + bh) {
            return { id: 'move', cursor: 'move' };
        }

        return null;
    }

    function onPointerDown(e) {
        const pos = getCanvasPos(e);
        const hit = hitTestHandle(pos);
        if (hit) {
            isDragging = true;
            dragMode = hit.id;
            dragStart = { x: pos.x, y: pos.y };
            cropBoxStart = { ...cropBox };
            currentPointerPos = { x: pos.x, y: pos.y };
            e.preventDefault();
            drawCropCanvas();
        }
    }

    function onPointerMove(e) {
        const pos = getCanvasPos(e);
        const cw = cropCanvas.width;
        const ch = cropCanvas.height;
        currentPointerPos = { x: pos.x, y: pos.y };

        if (!isDragging) {
            const hit = hitTestHandle(pos);
            cropCanvas.style.cursor = hit ? hit.cursor : 'default';
            return;
        }

        e.preventDefault();
        const dx = (pos.x - dragStart.x) / cw;
        const dy = (pos.y - dragStart.y) / ch;

        let nx = cropBoxStart.x;
        let ny = cropBoxStart.y;
        let nw = cropBoxStart.w;
        let nh = cropBoxStart.h;

        const minSize = 0.05;

        if (dragMode === 'move') {
            nx = Math.max(0, Math.min(1 - nw, cropBoxStart.x + dx));
            ny = Math.max(0, Math.min(1 - nh, cropBoxStart.y + dy));
        } else {
            if (dragMode.includes('w')) {
                const right = cropBoxStart.x + cropBoxStart.w;
                nx = Math.max(0, Math.min(right - minSize, cropBoxStart.x + dx));
                nw = right - nx;
            }
            if (dragMode.includes('e')) {
                nw = Math.max(minSize, Math.min(1 - cropBoxStart.x, cropBoxStart.w + dx));
            }
            if (dragMode.includes('n')) {
                const bottom = cropBoxStart.y + cropBoxStart.h;
                ny = Math.max(0, Math.min(bottom - minSize, cropBoxStart.y + dy));
                nh = bottom - ny;
            }
            if (dragMode.includes('s')) {
                nh = Math.max(minSize, Math.min(1 - cropBoxStart.y, cropBoxStart.h + dy));
            }
        }

        cropBox = { x: nx, y: ny, w: nw, h: nh };
        drawCropCanvas();
    }

    function onPointerUp() {
        if (isDragging) {
            isDragging = false;
            dragMode = null;
            drawCropCanvas();
        }
    }

    cropCanvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    cropCanvas.addEventListener("touchstart", onPointerDown, { passive: false });
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);

    // Apply Crop and Enhance Selection
    if (cropApplyBtn) {
        cropApplyBtn.addEventListener("click", () => {
            if (activeCropIndex === null || !uploadedFiles[activeCropIndex]) return;

            const file = uploadedFiles[activeCropIndex];
            const sourceImg = file.rawImgElement;

            const isRotated = (cropRotation === 90 || cropRotation === 270);
            const origW = sourceImg.naturalWidth || sourceImg.width;
            const origH = sourceImg.naturalHeight || sourceImg.height;

            const fullRotatedW = isRotated ? origH : origW;
            const fullRotatedH = isRotated ? origW : origH;

            // 1. Render rotated full image
            const rotCanvas = document.createElement("canvas");
            rotCanvas.width = fullRotatedW;
            rotCanvas.height = fullRotatedH;
            const rotCtx = rotCanvas.getContext("2d");

            rotCtx.save();
            rotCtx.translate(fullRotatedW / 2, fullRotatedH / 2);
            rotCtx.rotate((cropRotation * Math.PI) / 180);
            const drawW = isRotated ? fullRotatedH : fullRotatedW;
            const drawH = isRotated ? fullRotatedW : fullRotatedH;
            rotCtx.drawImage(sourceImg, -drawW / 2, -drawH / 2, drawW, drawH);
            rotCtx.restore();

            // 2. Crop to user's selected box
            const cropX = Math.round(cropBox.x * fullRotatedW);
            const cropY = Math.round(cropBox.y * fullRotatedH);
            const cropW = Math.round(cropBox.w * fullRotatedW);
            const cropH = Math.round(cropBox.h * fullRotatedH);

            const croppedCanvas = document.createElement("canvas");
            croppedCanvas.width = Math.max(1, cropW);
            croppedCanvas.height = Math.max(1, cropH);
            const croppedCtx = croppedCanvas.getContext("2d");

            croppedCtx.drawImage(rotCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

            const croppedDataUrl = croppedCanvas.toDataURL("image/jpeg", 0.95);
            const newImg = new Image();
            newImg.onload = () => {
                file.imgElement = newImg;
                file.cropBox = { ...cropBox };
                file.rotation = 0; // Rotation is now baked into imgElement
                closeCropper();
                renderImagesList();
            };
            newImg.src = croppedDataUrl;
        });
    }

    // =========================================================
    // 5. MULTI-PAGE PDF COMPILER & GENERATOR
    // =========================================================
    createPdfBtn.addEventListener("click", async () => {
        if (uploadedFiles.length === 0) return;

        createPdfBtn.disabled = true;
        createPdfBtn.innerHTML = `
            <span class="scan-spinner" style="width:20px; height:20px; border-width:2px; display:inline-block; vertical-align:middle; margin-right:8px;"></span>
            <span>Compiling Scan PDF...</span>
        `;

        await new Promise(r => setTimeout(r, 60));

        try {
            const { jsPDF } = window.jspdf;
            const pageSize = pageSizeSelect.value;
            const orientationSetting = orientationSelect.value;
            const margin = parseInt(marginSelect.value);
            const isHighQuality = (qualitySelect.value === 'high');

            let pdf = null;

            for (let i = 0; i < uploadedFiles.length; i++) {
                const file = uploadedFiles[i];

                const offscreenCanvas = document.createElement("canvas");
                const maxDim = isHighQuality ? 2400 : 1600;
                renderProcessedCanvas(offscreenCanvas, file.imgElement, file.filter, file.rotation, maxDim, maxDim);

                const canvasW = offscreenCanvas.width;
                const canvasH = offscreenCanvas.height;

                let pageWidth = 210; // A4 standard (mm)
                let pageHeight = 297;

                if (pageSize === "letter") {
                    pageWidth = 216;
                    pageHeight = 279;
                }

                let pageOrientation = orientationSetting;
                if (pageOrientation === 'auto') {
                    pageOrientation = canvasW > canvasH ? 'l' : 'p';
                }

                if (pageOrientation === 'l' && pageSize !== 'fit') {
                    const temp = pageWidth;
                    pageWidth = pageHeight;
                    pageHeight = temp;
                }

                let finalPageW = pageWidth;
                let finalPageH = pageHeight;

                if (pageSize === "fit") {
                    finalPageW = canvasW * 0.264583; // px to mm at 96 DPI
                    finalPageH = canvasH * 0.264583;
                    pageOrientation = finalPageW > finalPageH ? 'l' : 'p';
                }

                if (i === 0) {
                    pdf = new jsPDF({
                        orientation: pageOrientation,
                        unit: 'mm',
                        format: pageSize === 'fit' ? [finalPageW, finalPageH] : pageSize
                    });
                } else {
                    pdf.addPage(pageSize === 'fit' ? [finalPageW, finalPageH] : pageSize, pageOrientation);
                }

                const printableW = finalPageW - (margin * 2);
                const printableH = finalPageH - (margin * 2);

                // Aspect Fit - Preserves 100% of handwriting and bottom code lines!
                let drawW = printableW;
                let drawH = (canvasH / canvasW) * drawW;

                if (drawH > printableH) {
                    drawH = printableH;
                    drawW = (canvasW / canvasH) * drawH;
                }

                const posX = margin + ((printableW - drawW) / 2);
                const posY = margin + ((printableH - drawH) / 2);

                const imgDataUrl = offscreenCanvas.toDataURL('image/jpeg', isHighQuality ? 0.92 : 0.82);
                pdf.addImage(imgDataUrl, 'JPEG', posX, posY, drawW, drawH);
            }

            if (pdf) {
                const pdfBlob = pdf.output('blob');
                const pdfUrl = URL.createObjectURL(pdfBlob);
                const numPages = pdf.getNumberOfPages();
                const totalMb = (pdfBlob.size / (1024 * 1024)).toFixed(2);

                resultsContent.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:15px; align-items:center;">
                        <div style="background:var(--bg-secondary); padding:12px 20px; border-radius:10px; border:1px solid var(--border-color); text-align:center; display:flex; gap:20px; flex-wrap:wrap; justify-content:center;">
                            <div>
                                <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:2px;">Scanned Pages:</p>
                                <b style="font-size:1.1rem; color:var(--primary);">${numPages}</b>
                            </div>
                            <div style="border-left:1px solid var(--border-color); padding-left:20px;">
                                <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:2px;">PDF File Size:</p>
                                <b style="font-size:1.1rem; color:var(--text-primary);">${totalMb} MB</b>
                            </div>
                            <div style="border-left:1px solid var(--border-color); padding-left:20px;">
                                <p style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:2px;">Scan Filter:</p>
                                <b style="font-size:0.95rem; color:var(--success, #10b981); text-transform:capitalize;">${currentGlobalFilter}</b>
                            </div>
                        </div>

                        <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center; width:100%;">
                            <a href="${pdfUrl}" target="_blank" class="btn btn-secondary" style="flex:1; min-width:180px; max-width:240px; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                                <span>👀 Preview PDF</span>
                            </a>

                            <a href="${pdfUrl}" download="ToolX_Pro_Scanned_Document.pdf" class="btn btn-primary" style="flex:1; min-width:180px; max-width:240px; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px;">
                                <span>📥 Download Scan PDF</span>
                            </a>
                        </div>
                    </div>
                `;

                resultsCard.style.display = "block";
                resultsCard.scrollIntoView({ behavior: 'smooth' });
            }

        } catch (err) {
            console.error("PDF Compilation Error:", err);
            alert("An error occurred during PDF generation: " + err.message);
        } finally {
            createPdfBtn.disabled = false;
            createPdfBtn.innerHTML = `<span>Generate Scan PDF Document 🚀</span>`;
        }
    });
});
