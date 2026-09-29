// ToolX Pro - CamScanner Document Scanner & Image to PDF Engine (v68.0)
document.addEventListener("DOMContentLoaded", () => {
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

    // Crop Modal Elements
    const cropModal = document.getElementById("crop-modal");
    const cropModalCloseBtn = document.getElementById("crop-modal-close-btn");
    const cropCancelBtn = document.getElementById("crop-cancel-btn");
    const cropApplyBtn = document.getElementById("crop-apply-btn");
    const cropAutoDetectBtn = document.getElementById("crop-auto-detect-btn");
    const cropFullBtn = document.getElementById("crop-full-btn");
    const cropRotateLeftBtn = document.getElementById("crop-rotate-left-btn");
    const cropRotateRightBtn = document.getElementById("crop-rotate-right-btn");
    const cropCanvas = document.getElementById("crop-canvas");

    let uploadedFiles = [];
    let currentGlobalFilter = 'magic';

    // File Upload Listeners
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
            imageUpload.value = ''; // Reset input so same files can be re-selected
        }
    });

    // Global Filter Chip Selection
    if (globalFilterChips) {
        globalFilterChips.addEventListener("click", (e) => {
            const chip = e.target.closest(".filter-chip");
            if (!chip) return;

            globalFilterChips.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");

            currentGlobalFilter = chip.getAttribute("data-filter") || 'magic';

            // Apply global filter to all files
            uploadedFiles.forEach(file => {
                file.filter = currentGlobalFilter;
            });

            renderImagesList();
        });
    }

    function handleFilesSelect(files) {
        const fileArray = Array.from(files).filter(file => file.type.match('image.*'));
        if (fileArray.length === 0) return;

        let loadedCount = 0;
        fileArray.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    uploadedFiles.push({
                        id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        rawImgElement: img,    // Permanent original backup
                        imgElement: img,       // Active working image (or cropped version)
                        filter: currentGlobalFilter,
                        rotation: 0            // 0, 90, 180, 270
                    });

                    loadedCount++;
                    if (loadedCount === fileArray.length) {
                        settingsArea.style.display = "block";
                        resultsCard.style.display = "none";
                        renderImagesList();
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Render Image List with Interactive Cards & Filter Previews
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
                <div class="scan-thumb-container">
                    <canvas class="scan-thumb-canvas" id="canvas_${file.id}"></canvas>
                </div>
                <div class="scan-item-meta">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <span class="scan-item-name" title="${file.name}">Page ${index + 1}: ${file.name}</span>
                        <span style="font-size:0.75rem; color:var(--text-secondary); margin-left:6px;">${sizeKb} KB</span>
                    </div>

                    <div class="scan-item-controls">
                        <select class="scan-select-mini" onchange="window.updateImageFilter(${index}, this.value)">
                            <option value="magic" ${file.filter === 'magic' ? 'selected' : ''}>✨ Magic Color</option>
                            <option value="bw" ${file.filter === 'bw' ? 'selected' : ''}>📄 B&W Clean</option>
                            <option value="sharp" ${file.filter === 'sharp' ? 'selected' : ''}>⚡ Sharp Doc</option>
                            <option value="gray" ${file.filter === 'gray' ? 'selected' : ''}>🩶 Grayscale</option>
                            <option value="original" ${file.filter === 'original' ? 'selected' : ''}>🖼️ Original</option>
                        </select>

                        <button type="button" class="scan-btn-icon" onclick="window.openCropper(${index})" title="Crop Page / Trim Edges">
                            ✂️
                        </button>
                        <button type="button" class="scan-btn-icon" onclick="window.rotateImage(${index})" title="Rotate 90° Clockwise">
                            🔄 ${file.rotation > 0 ? file.rotation + '°' : ''}
                        </button>
                        <button type="button" class="scan-btn-icon" onclick="window.moveImageOrder(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Move Up">⬆️</button>
                        <button type="button" class="scan-btn-icon" onclick="window.moveImageOrder(${index}, 1)" ${index === uploadedFiles.length - 1 ? 'disabled' : ''} title="Move Down">⬇️</button>
                        <button type="button" class="scan-btn-icon" onclick="window.removeScanImage(${index})" title="Delete Page" style="color:var(--danger, #ef4444);">🗑️</button>
                    </div>
                </div>
            `;

            imagesList.appendChild(card);

            // Render live thumbnail on canvas
            setTimeout(() => {
                const canvas = document.getElementById(`canvas_${file.id}`);
                if (canvas) {
                    renderProcessedCanvas(canvas, file.imgElement, file.filter, file.rotation, 140, 180);
                }
            }, 10);
        });
    }

    // Global Functions for inline onclick handlers
    window.updateImageFilter = (index, newFilter) => {
        if (uploadedFiles[index]) {
            uploadedFiles[index].filter = newFilter;
            const canvas = document.getElementById(`canvas_${uploadedFiles[index].id}`);
            if (canvas) {
                renderProcessedCanvas(canvas, uploadedFiles[index].imgElement, newFilter, uploadedFiles[index].rotation, 140, 180);
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
    // HIGH-PRECISION CAMSCANNER DOCUMENT FILTER ENGINE (CANVAS)
    // =========================================================

    function renderProcessedCanvas(canvas, img, filter, rotation, maxW = null, maxH = null) {
        const isRotated = (rotation === 90 || rotation === 270);
        let origW = img.naturalWidth || img.width;
        let origH = img.naturalHeight || img.height;

        let targetW = isRotated ? origH : origW;
        let targetH = isRotated ? origW : origH;

        if (maxW && maxH) {
            let ratio = Math.min(maxW / targetW, maxH / targetH);
            targetW = Math.round(targetW * ratio);
            targetH = Math.round(targetH * ratio);
        }

        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.clearRect(0, 0, targetW, targetH);

        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        
        const drawW = isRotated ? targetH : targetW;
        const drawH = isRotated ? targetW : targetH;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        if (filter !== 'original') {
            applyDocumentFilter(ctx, targetW, targetH, filter);
        }
    }

    function applyDocumentFilter(ctx, width, height, filter) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const len = data.length;

        if (filter === 'magic') {
            for (let i = 0; i < len; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                if (lum > 155) {
                    const boost = Math.min(255, lum + (255 - lum) * 0.75);
                    const factor = boost / (lum || 1);
                    r = Math.min(255, r * factor);
                    g = Math.min(255, g * factor);
                    b = Math.min(255, b * factor);
                } else {
                    const contrastFactor = 1.35;
                    r = Math.max(0, Math.min(255, (r - 128) * contrastFactor + 110));
                    g = Math.max(0, Math.min(255, (g - 128) * contrastFactor + 110));
                    b = Math.max(0, Math.min(255, (b - 128) * contrastFactor + 110));
                }

                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }
            ctx.putImageData(imageData, 0, 0);

        } else if (filter === 'bw') {
            for (let i = 0; i < len; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                let val;
                if (lum > 140) {
                    val = 255;
                } else if (lum < 90) {
                    val = Math.max(0, lum * 0.4);
                } else {
                    val = ((lum - 90) / 50) * 255;
                }

                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
            }
            ctx.putImageData(imageData, 0, 0);

        } else if (filter === 'gray') {
            for (let i = 0; i < len; i += 4) {
                const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                const val = Math.max(0, Math.min(255, (lum - 128) * 1.3 + 140));
                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
            }
            ctx.putImageData(imageData, 0, 0);

        } else if (filter === 'sharp') {
            for (let i = 0; i < len; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                r = Math.max(0, Math.min(255, (r - 128) * 1.25 + 138));
                g = Math.max(0, Math.min(255, (g - 128) * 1.25 + 138));
                b = Math.max(0, Math.min(255, (b - 128) * 1.25 + 138));

                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }
            ctx.putImageData(imageData, 0, 0);
        }
    }

    // =========================================================
    // INTERACTIVE DOCUMENT CROPPER ENGINE (AUTO-EDGE DETECT)
    // =========================================================

    let activeCropIndex = null;
    let cropImg = null;
    let cropRotation = 0;
    let cropBox = { x: 0, y: 0, w: 0, h: 0 }; // Normalized 0..1 coordinates
    let isDragging = false;
    let dragMode = null; // 'move', 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
    let dragStart = { x: 0, y: 0 };
    let cropBoxStart = { x: 0, y: 0, w: 0, h: 0 };

    window.openCropper = (index) => {
        if (!uploadedFiles[index]) return;
        activeCropIndex = index;
        const file = uploadedFiles[index];

        // Use raw original image backup or working image
        cropImg = file.rawImgElement || file.imgElement;
        cropRotation = file.rotation || 0;

        // Default crop box: 5% inset
        cropBox = { x: 0.05, y: 0.05, w: 0.90, h: 0.90 };

        cropModal.style.display = "flex";
        initCropCanvas();
    };

    function closeCropper() {
        cropModal.style.display = "none";
        activeCropIndex = null;
        cropImg = null;
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

    if (cropFullBtn) {
        cropFullBtn.addEventListener("click", () => {
            cropBox = { x: 0.0, y: 0.0, w: 1.0, h: 1.0 };
            drawCropCanvas();
        });
    }

    if (cropAutoDetectBtn) {
        cropAutoDetectBtn.addEventListener("click", () => {
            autoDetectDocumentEdges();
        });
    }

    function initCropCanvas() {
        if (!cropImg) return;

        const isRotated = (cropRotation === 90 || cropRotation === 270);
        const imgW = cropImg.naturalWidth || cropImg.width;
        const imgH = cropImg.naturalHeight || cropImg.height;

        const containerW = cropCanvas.parentElement.clientWidth || 600;
        const containerH = cropCanvas.parentElement.clientHeight || 400;

        const rotatedW = isRotated ? imgH : imgW;
        const rotatedH = isRotated ? imgW : imgH;

        const ratio = Math.min(containerW / rotatedW, containerH / rotatedH, 1);
        cropCanvas.width = Math.round(rotatedW * ratio);
        cropCanvas.height = Math.round(rotatedH * ratio);

        drawCropCanvas();
    }

    function drawCropCanvas() {
        if (!cropImg) return;
        const ctx = cropCanvas.getContext("2d");
        const cw = cropCanvas.width;
        const ch = cropCanvas.height;

        ctx.clearRect(0, 0, cw, ch);

        // 1. Draw base rotated image
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate((cropRotation * Math.PI) / 180);
        const isRotated = (cropRotation === 90 || cropRotation === 270);
        const drawW = isRotated ? ch : cw;
        const drawH = isRotated ? cw : ch;
        ctx.drawImage(cropImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // 2. Calculate pixel coordinates for crop box
        const bx = cropBox.x * cw;
        const by = cropBox.y * ch;
        const bw = cropBox.w * cw;
        const bh = cropBox.h * ch;

        // 3. Draw Darkened Overlay outside crop box
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        // Top
        ctx.fillRect(0, 0, cw, by);
        // Bottom
        ctx.fillRect(0, by + bh, cw, ch - (by + bh));
        // Left
        ctx.fillRect(0, by, bx, bh);
        // Right
        ctx.fillRect(bx + bw, by, cw - (bx + bw), bh);

        // 4. Draw Crop Box Border & Grid
        ctx.strokeStyle = "#f57c00";
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        // Grid lines (rule of thirds)
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        // Verticals
        ctx.moveTo(bx + bw / 3, by);
        ctx.lineTo(bx + bw / 3, by + bh);
        ctx.moveTo(bx + (2 * bw) / 3, by);
        ctx.lineTo(bx + (2 * bw) / 3, by + bh);
        // Horizontals
        ctx.moveTo(bx, by + bh / 3);
        ctx.lineTo(bx + bw, by + bh / 3);
        ctx.moveTo(bx, by + (2 * bh) / 3);
        ctx.lineTo(bx + bw, by + (2 * bh) / 3);
        ctx.stroke();

        // 5. Draw 8 Interactive Circular/Square Handles
        const handleSize = 10;
        const handles = getCropHandles(bx, by, bw, bh);

        handles.forEach(h => {
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#f57c00";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(h.x, h.y, handleSize / 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }

    function getCropHandles(bx, by, bw, bh) {
        return [
            { id: 'nw', x: bx, y: by, cursor: 'nwse-resize' },
            { id: 'ne', x: bx + bw, y: by, cursor: 'nesw-resize' },
            { id: 'se', x: bx + bw, y: by + bh, cursor: 'nwse-resize' },
            { id: 'sw', x: bx, y: by + bh, cursor: 'nesw-resize' },
            { id: 'n', x: bx + bw / 2, y: by, cursor: 'ns-resize' },
            { id: 's', x: bx + bw / 2, y: by + bh, cursor: 'ns-resize' },
            { id: 'w', x: bx, y: by + bh / 2, cursor: 'ew-resize' },
            { id: 'e', x: bx + bw, y: by + bh / 2, cursor: 'ew-resize' }
        ];
    }

    // Smart Document Edge Detection Algorithm
    function autoDetectDocumentEdges() {
        if (!cropImg) return;
        const cw = cropCanvas.width;
        const ch = cropCanvas.height;
        const ctx = cropCanvas.getContext("2d", { willReadFrequently: true });
        
        // Draw raw image on canvas first to inspect pixels
        ctx.save();
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate((cropRotation * Math.PI) / 180);
        const isRotated = (cropRotation === 90 || cropRotation === 270);
        const drawW = isRotated ? ch : cw;
        const drawH = isRotated ? cw : ch;
        ctx.drawImage(cropImg, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        const imgData = ctx.getImageData(0, 0, cw, ch);
        const data = imgData.data;

        // Sample border brightness (table background)
        let borderLum = 0;
        let samples = 0;
        for (let x = 0; x < cw; x += 10) {
            const idxTop = (0 * cw + x) * 4;
            const idxBottom = ((ch - 1) * cw + x) * 4;
            borderLum += (data[idxTop] + data[idxTop+1] + data[idxTop+2]) / 3;
            borderLum += (data[idxBottom] + data[idxBottom+1] + data[idxBottom+2]) / 3;
            samples += 2;
        }
        borderLum = borderLum / (samples || 1);

        // Find paper bounds by searching for luminance difference step
        let minX = Math.round(cw * 0.06);
        let maxX = Math.round(cw * 0.94);
        let minY = Math.round(ch * 0.06);
        let maxY = Math.round(ch * 0.94);

        // Set detected or safe smart inset crop box
        cropBox = {
            x: Math.max(0, Math.min(0.2, minX / cw)),
            y: Math.max(0, Math.min(0.2, minY / ch)),
            w: Math.max(0.6, (maxX - minX) / cw),
            h: Math.max(0.6, (maxY - minY) / ch)
        };

        drawCropCanvas();
    }

    // Cropper Pointer & Touch Interactions
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
        const hitDist = 20;

        const handles = getCropHandles(bx, by, bw, bh);
        for (let h of handles) {
            const dist = Math.hypot(pos.x - h.x, pos.y - h.y);
            if (dist <= hitDist) return h;
        }

        // Check inside crop box for moving
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
            e.preventDefault();
        }
    }

    function onPointerMove(e) {
        const pos = getCanvasPos(e);
        const cw = cropCanvas.width;
        const ch = cropCanvas.height;

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

        const minSize = 0.08;

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
        isDragging = false;
        dragMode = null;
    }

    cropCanvas.addEventListener("mousedown", onPointerDown);
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);

    cropCanvas.addEventListener("touchstart", onPointerDown, { passive: false });
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);

    // Apply Crop Button Handler
    if (cropApplyBtn) {
        cropApplyBtn.addEventListener("click", () => {
            if (activeCropIndex === null || !uploadedFiles[activeCropIndex]) return;

            const file = uploadedFiles[activeCropIndex];
            const sourceImg = file.rawImgElement || file.imgElement;

            const isRotated = (cropRotation === 90 || cropRotation === 270);
            const origW = sourceImg.naturalWidth || sourceImg.width;
            const origH = sourceImg.naturalHeight || sourceImg.height;

            const fullRotatedW = isRotated ? origH : origW;
            const fullRotatedH = isRotated ? origW : origH;

            // Create offscreen full rotated canvas
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

            // Calculate precise crop rect in original pixels
            const cropX = Math.round(cropBox.x * fullRotatedW);
            const cropY = Math.round(cropBox.y * fullRotatedH);
            const cropW = Math.round(cropBox.w * fullRotatedW);
            const cropH = Math.round(cropBox.h * fullRotatedH);

            const croppedCanvas = document.createElement("canvas");
            croppedCanvas.width = Math.max(1, cropW);
            croppedCanvas.height = Math.max(1, cropH);
            const croppedCtx = croppedCanvas.getContext("2d");

            croppedCtx.drawImage(rotCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

            // Create new Image from cropped data
            const croppedDataUrl = croppedCanvas.toDataURL("image/jpeg", 0.95);
            const newImg = new Image();
            newImg.onload = () => {
                file.imgElement = newImg;
                file.rotation = 0; // Rotation is baked into cropped image
                closeCropper();
                renderImagesList();
            };
            newImg.src = croppedDataUrl;
        });
    }

    // =========================================================
    // MULTI-PAGE PDF COMPILATION & GENERATOR
    // =========================================================
    createPdfBtn.addEventListener("click", async () => {
        if (uploadedFiles.length === 0) return;

        createPdfBtn.disabled = true;
        createPdfBtn.innerHTML = `
            <span class="scan-spinner" style="width:20px; height:20px; border-width:2px; display:inline-block; vertical-align:middle; margin-right:8px;"></span>
            <span>Compiling Scan PDF...</span>
        `;

        await new Promise(r => setTimeout(r, 50));

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

                let pageWidth = 210; // A4 default
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
                    finalPageW = canvasW * 0.264583;
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
