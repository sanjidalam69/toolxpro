// ToolX Pro - CamScanner Document Scanner & Image to PDF Engine (v67.0)
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
                        imgElement: img,
                        filter: currentGlobalFilter,
                        rotation: 0 // 0, 90, 180, 270
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

    /**
     * Renders an image onto a target canvas with rotation and CamScanner filter applied.
     */
    function renderProcessedCanvas(canvas, img, filter, rotation, maxW = null, maxH = null) {
        const isRotated = (rotation === 90 || rotation === 270);
        let origW = img.naturalWidth || img.width;
        let origH = img.naturalHeight || img.height;

        let targetW = isRotated ? origH : origW;
        let targetH = isRotated ? origW : origH;

        // Downscale for thumbnail preview if max dimensions specified
        if (maxW && maxH) {
            let ratio = Math.min(maxW / targetW, maxH / targetH);
            targetW = Math.round(targetW * ratio);
            targetH = Math.round(targetH * ratio);
        }

        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.clearRect(0, 0, targetW, targetH);

        // Apply Rotation transformation
        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        
        const drawW = isRotated ? targetH : targetW;
        const drawH = isRotated ? targetW : targetH;
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Apply Image Filters via Pixel Manipulation
        if (filter !== 'original') {
            applyDocumentFilter(ctx, targetW, targetH, filter);
        }
    }

    /**
     * Applies CamScanner pixel-level algorithms (Magic Color, B&W Clean, Sharp, Grayscale)
     */
    function applyDocumentFilter(ctx, width, height, filter) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const len = data.length;

        if (filter === 'magic') {
            // CamScanner Magic Color Algorithm:
            // 1. Whitens grayish/yellowish paper background
            // 2. Deepens text/pen ink contrast
            // 3. Boosts saturation so colored inks (blue/red signatures) stay vibrant
            for (let i = 0; i < len; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Calculate luminance
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                // Paper Background Whitening Curve
                if (lum > 155) {
                    // Bright pixels get mapped cleanly towards pure white
                    const boost = Math.min(255, lum + (255 - lum) * 0.75);
                    const factor = boost / (lum || 1);
                    r = Math.min(255, r * factor);
                    g = Math.min(255, g * factor);
                    b = Math.min(255, b * factor);
                } else {
                    // Dark text/ink pixels are deepened for razor-sharp legibility
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
            // High-Contrast Document B&W Scan (Photocopy / Clear Scanner Look)
            // Removes all shadow gradients and paper wrinkles
            for (let i = 0; i < len; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const lum = 0.299 * r + 0.587 * g + 0.114 * b;

                // Adaptive S-curve binary enhancement
                let val;
                if (lum > 140) {
                    val = 255; // Pure white background
                } else if (lum < 90) {
                    val = Math.max(0, lum * 0.4); // Deep crisp black ink
                } else {
                    // Smooth transition for font anti-aliasing
                    val = ((lum - 90) / 50) * 255;
                }

                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
            }
            ctx.putImageData(imageData, 0, 0);

        } else if (filter === 'gray') {
            // Smooth Grayscale Document Scan (256 Tones with Contrast Stretch)
            for (let i = 0; i < len; i += 4) {
                const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                // Contrast stretch + brightness bump
                const val = Math.max(0, Math.min(255, (lum - 128) * 1.3 + 140));
                data[i] = val;
                data[i + 1] = val;
                data[i + 2] = val;
            }
            ctx.putImageData(imageData, 0, 0);

        } else if (filter === 'sharp') {
            // Detail Sharpening + Color Contrast Boost
            for (let i = 0; i < len; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Moderate contrast boost (1.2x) + brightness (+15)
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
    // MULTI-PAGE PDF COMPILATION & GENERATOR
    // =========================================================
    createPdfBtn.addEventListener("click", async () => {
        if (uploadedFiles.length === 0) return;

        createPdfBtn.disabled = true;
        createPdfBtn.innerHTML = `
            <span class="scan-spinner" style="width:20px; height:20px; border-width:2px; display:inline-block; vertical-align:middle; margin-right:8px;"></span>
            <span>Compiling Scan PDF...</span>
        `;

        // Small timeout to allow UI spinner to render
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

                // Create offscreen full-resolution canvas
                const offscreenCanvas = document.createElement("canvas");
                
                // Maximum canvas render dimensions (HD Print = up to 2400px, Standard = up to 1600px)
                const maxDim = isHighQuality ? 2400 : 1600;
                renderProcessedCanvas(offscreenCanvas, file.imgElement, file.filter, file.rotation, maxDim, maxDim);

                const canvasW = offscreenCanvas.width;
                const canvasH = offscreenCanvas.height;

                // Determine Page Dimensions (in mm)
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
                    // Auto fit exact image aspect ratio in mm
                    finalPageW = canvasW * 0.264583;
                    finalPageH = canvasH * 0.264583;
                    pageOrientation = finalPageW > finalPageH ? 'l' : 'p';
                }

                // Initialize or Add Page to PDF
                if (i === 0) {
                    pdf = new jsPDF({
                        orientation: pageOrientation,
                        unit: 'mm',
                        format: pageSize === 'fit' ? [finalPageW, finalPageH] : pageSize
                    });
                } else {
                    pdf.addPage(pageSize === 'fit' ? [finalPageW, finalPageH] : pageSize, pageOrientation);
                }

                // Calculate image placement within margins
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

                // Export filtered canvas as high-quality JPEG
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
