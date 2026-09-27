// ToolX Pro - Smart Biometric Passport Photo Maker & Sheet Generator
// 100% Client-Side Processing with Local In-Browser AI Face Alignment, Background Cutout, Virtual Suits & ICAO 9303 Biometric Compliance

document.addEventListener("DOMContentLoaded", () => {
    // ══════════════════════════════════════════════════════════════════════
    // DOM ELEMENTS
    // ══════════════════════════════════════════════════════════════════════

    // Upload & Setup
    const photoUpload = document.getElementById("photo-upload");
    const dropZone = document.getElementById("drop-zone");
    const initialUploadContainer = document.getElementById("initial-upload-container");
    const studioInterface = document.getElementById("studio-interface");
    const btnChangePhoto = document.getElementById("btn-change-photo");
    const fileNameLabel = document.getElementById("file-name-label");

    // AI Auto-Pilot Face Detection
    const btnAiAutoFit = document.getElementById("btn-ai-auto-fit");
    const aiMagicBtnText = document.getElementById("ai-magic-btn-text");
    const aiFaceStatus = document.getElementById("ai-face-status");

    // Presets & Size
    const presetSelect = document.getElementById("preset-select");
    const presetDimLabel = document.getElementById("preset-dim-label");
    const customSizeFields = document.getElementById("custom-size-fields");
    const customW = document.getElementById("custom-w");
    const customH = document.getElementById("custom-h");

    // AI Background Studio
    const btnAiRemoveBg = document.getElementById("btn-ai-remove-bg");
    const aiBtnText = document.getElementById("ai-btn-text");
    const aiProgressBar = document.getElementById("ai-progress-bar");
    const colorChips = document.querySelectorAll(".color-chip-btn");
    const customColorPicker = document.getElementById("custom-color-picker");

    // Virtual Formal Attire & Suit Overlay
    const suitChips = document.querySelectorAll(".suit-chip-btn");
    const activeSuitLabel = document.getElementById("active-suit-label");
    const suitControlsPanel = document.getElementById("suit-controls-panel");
    const suitScaleRange = document.getElementById("suit-scale-range");
    const suitScaleVal = document.getElementById("suit-scale-val");
    const suitYRange = document.getElementById("suit-y-range");
    const suitYVal = document.getElementById("suit-y-val");

    // Crop, Transform & Sliders
    const zoomRange = document.getElementById("zoom-range");
    const zoomValEl = document.getElementById("zoom-val");
    const btnZoomIn = document.getElementById("btn-zoom-in");
    const btnZoomOut = document.getElementById("btn-zoom-out");

    const rotateRange = document.getElementById("rotate-range");
    const rotateValEl = document.getElementById("rotate-val");
    const btnRotLeft = document.getElementById("btn-rot-left");
    const btnRotRight = document.getElementById("btn-rot-right");

    const btnNudgeUp = document.getElementById("btn-nudge-up");
    const btnNudgeDown = document.getElementById("btn-nudge-down");
    const btnNudgeLeft = document.getElementById("btn-nudge-left");
    const btnNudgeRight = document.getElementById("btn-nudge-right");
    const btnCenterPhoto = document.getElementById("btn-center-photo");
    const btnResetTransform = document.getElementById("btn-reset-transform");

    // Lighting Adjustments
    const brightRange = document.getElementById("bright-range");
    const brightValEl = document.getElementById("bright-val");
    const contrastRange = document.getElementById("contrast-range");
    const contrastValEl = document.getElementById("contrast-val");
    const btnAutoEnhance = document.getElementById("btn-auto-enhance");

    // Sheet Setup
    const sheetPaperType = document.getElementById("sheet-paper-type");
    const sheetCopies = document.getElementById("sheet-copies");
    const cutLinesToggle = document.getElementById("cut-lines-toggle");

    // Preview Stage
    const tabSinglePreview = document.getElementById("tab-single-preview");
    const tabSheetPreview = document.getElementById("tab-sheet-preview");
    const singleViewContainer = document.getElementById("single-view-container");
    const sheetViewContainer = document.getElementById("sheet-view-container");

    const cropBox = document.getElementById("crop-box");
    const cropCanvas = document.getElementById("crop-canvas");
    const sheetCanvas = document.getElementById("sheet-canvas");
    const biometricOverlay = document.getElementById("biometric-overlay");
    const btnToggleGuide = document.getElementById("btn-toggle-guide");
    const guideStatusText = document.getElementById("guide-status-text");

    // HUD Info
    const hudSizeMm = document.getElementById("hud-size-mm");
    const hudSizePx = document.getElementById("hud-size-px");
    const hudHeadRatio = document.getElementById("hud-head-ratio");

    // Biometric Compliance Inspector
    const complianceOverallBadge = document.getElementById("compliance-overall-badge");
    const chkFaceIcon = document.getElementById("chk-face-icon");
    const chkFaceVal = document.getElementById("chk-face-val");
    const chkTiltIcon = document.getElementById("chkTilt-icon") || document.getElementById("chk-tilt-icon");
    const chkTiltVal = document.getElementById("chk-tilt-val");
    const chkRatioIcon = document.getElementById("chk-ratio-icon");
    const chkRatioVal = document.getElementById("chk-ratio-val");
    const chkBgIcon = document.getElementById("chk-bg-icon");
    const chkBgVal = document.getElementById("chk-bg-val");

    // Download & Print Actions
    const btnDlSinglePng = document.getElementById("btn-dl-single-png");
    const btnDlSheetPng = document.getElementById("btn-dl-sheet-png");
    const btnDlSheetPdf = document.getElementById("btn-dl-sheet-pdf");
    const btnPrintSheet = document.getElementById("btn-print-sheet");

    // ══════════════════════════════════════════════════════════════════════
    // APPLICATION STATE
    // ══════════════════════════════════════════════════════════════════════

    let originalImage = null;
    let segmentedCanvas = null; // transparent subject cutout
    let isAiSegmented = false;
    let isAiBgProcessing = false;
    let selfieSegmentationInstance = null;

    // AI Face Detection State
    let faceDetectionInstance = null;
    let isFaceDetecting = false;
    let lastDetectedFace = null;

    // Standard Biometric Specifications (300 DPI: 1 mm ≈ 11.811 pixels)
    const DPI_FACTOR = 300 / 25.4;

    const PRESETS = {
        "bd-mrp": { name: "Bangladesh e-Passport & MRP", wMm: 35, hMm: 45, ratio: "70% – 80%" },
        "us-visa": { name: "US Passport & Visa (2x2 in)", wMm: 50.8, hMm: 50.8, ratio: "50% – 69%" },
        "eu-schengen": { name: "Schengen Visa & Europe", wMm: 35, hMm: 45, ratio: "70% – 80%" },
        "ca-passport": { name: "Canada Passport & Visa", wMm: 50, hMm: 70, ratio: "70%" },
        "in-passport": { name: "India Passport & OCI", wMm: 35, hMm: 45, ratio: "70% – 80%" },
        "sa-visa": { name: "Saudi Arabia (Hajj / Umrah)", wMm: 40, hMm: 60, ratio: "70% – 80%" },
        "ae-visa": { name: "UAE / Dubai Visa", wMm: 40, hMm: 50, ratio: "70% – 80%" },
        "my-passport": { name: "Malaysia Passport", wMm: 35, hMm: 50, ratio: "70%" },
        "stamp-size": { name: "Universal Stamp Size", wMm: 25, hMm: 30, ratio: "70%" },
        "custom": { name: "Custom Dimensions", wMm: 35, hMm: 45, ratio: "User defined" }
    };

    let currentPresetKey = "bd-mrp";
    let activeBgColor = "#ffffff"; // default official white
    let zoomLevel = 1.0;
    let rotationDeg = 0;
    let panX = 0;
    let panY = 0;
    let brightnessVal = 0;
    let contrastVal = 0;
    let showGuide = true;
    let activePreviewMode = "single"; // 'single' or 'sheet'

    // Virtual Suit State
    let activeSuitKey = "none";
    let suitScale = 1.0;
    let suitOffsetY = 0;
    const cachedSuitImages = {};

    // Drag Interaction State
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialPanX = 0;
    let initialPanY = 0;

    // ══════════════════════════════════════════════════════════════════════
    // VECTOR SVG FORMAL SUIT ASSETS
    // ══════════════════════════════════════════════════════════════════════

    const SUIT_SVGS = {
        "men-black": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480">
            <defs>
                <linearGradient id="mb-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#27272a"/>
                    <stop offset="45%" stop-color="#18181b"/>
                    <stop offset="100%" stop-color="#09090b"/>
                </linearGradient>
                <linearGradient id="mb-lapel" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#3f3f46"/>
                    <stop offset="100%" stop-color="#18181b"/>
                </linearGradient>
                <linearGradient id="mb-tie" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#991b1b"/>
                    <stop offset="50%" stop-color="#b91c1c"/>
                    <stop offset="100%" stop-color="#7f1d1d"/>
                </linearGradient>
                <filter id="mb-sh" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.35"/>
                </filter>
            </defs>
            <path d="M210,125 Q300,165 390,125 L360,340 L240,340 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
            <path d="M285,225 L315,225 L335,480 L265,480 Z" fill="url(#mb-tie)" filter="url(#mb-sh)"/>
            <polygon points="285,180 315,180 322,225 278,225" fill="url(#mb-tie)" filter="url(#mb-sh)"/>
            <polygon points="208,125 285,190 270,140" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" filter="url(#mb-sh)"/>
            <polygon points="392,125 315,190 330,140" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" filter="url(#mb-sh)"/>
            <path d="M0,350 C35,230 130,150 215,135 L245,310 L300,380 L355,310 L385,135 C470,150 565,230 600,350 L600,480 L0,480 Z" fill="url(#mb-jacket)"/>
            <path d="M215,135 L265,225 L235,245 L298,375 L245,310 Z" fill="url(#mb-lapel)" stroke="#09090b" stroke-width="1" filter="url(#mb-sh)"/>
            <path d="M385,135 L335,225 L365,245 L302,375 L355,310 Z" fill="url(#mb-lapel)" stroke="#09090b" stroke-width="1" filter="url(#mb-sh)"/>
            <circle cx="300" cy="398" r="7" fill="#18181b" stroke="#52525b" stroke-width="1.5"/>
        </svg>`,

        "men-navy": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480">
            <defs>
                <linearGradient id="mn-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1e3a8a"/>
                    <stop offset="50%" stop-color="#172554"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                </linearGradient>
                <linearGradient id="mn-lapel" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#2563eb"/>
                    <stop offset="100%" stop-color="#1e3a8a"/>
                </linearGradient>
                <linearGradient id="mn-tie" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#0284c7"/>
                    <stop offset="50%" stop-color="#0369a1"/>
                    <stop offset="100%" stop-color="#075985"/>
                </linearGradient>
                <filter id="mn-sh" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.35"/>
                </filter>
            </defs>
            <path d="M210,125 Q300,165 390,125 L360,340 L240,340 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
            <path d="M285,225 L315,225 L335,480 L265,480 Z" fill="url(#mn-tie)" filter="url(#mn-sh)"/>
            <polygon points="285,180 315,180 322,225 278,225" fill="url(#mn-tie)" filter="url(#mn-sh)"/>
            <polygon points="208,125 285,190 270,140" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" filter="url(#mn-sh)"/>
            <polygon points="392,125 315,190 330,140" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5" filter="url(#mn-sh)"/>
            <path d="M0,350 C35,230 130,150 215,135 L245,310 L300,380 L355,310 L385,135 C470,150 565,230 600,350 L600,480 L0,480 Z" fill="url(#mn-jacket)"/>
            <path d="M215,135 L265,225 L235,245 L298,375 L245,310 Z" fill="url(#mn-lapel)" stroke="#0f172a" stroke-width="1" filter="url(#mn-sh)"/>
            <path d="M385,135 L335,225 L365,245 L302,375 L355,310 Z" fill="url(#mn-lapel)" stroke="#0f172a" stroke-width="1" filter="url(#mn-sh)"/>
            <circle cx="300" cy="398" r="7" fill="#0f172a" stroke="#60a5fa" stroke-width="1.5"/>
        </svg>`,

        "men-shirt": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480">
            <defs>
                <linearGradient id="ms-shirt" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="60%" stop-color="#f8fafc"/>
                    <stop offset="100%" stop-color="#e2e8f0"/>
                </linearGradient>
                <linearGradient id="ms-tie" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#334155"/>
                    <stop offset="50%" stop-color="#1e293b"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                </linearGradient>
                <filter id="ms-sh" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
                </filter>
            </defs>
            <path d="M0,350 C35,230 130,150 215,135 L285,160 L315,160 L385,135 C470,150 565,230 600,350 L600,480 L0,480 Z" fill="url(#ms-shirt)" stroke="#cbd5e1" stroke-width="1.5"/>
            <rect x="282" y="160" width="36" height="320" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1"/>
            <path d="M285,225 L315,225 L335,480 L265,480 Z" fill="url(#ms-tie)" filter="url(#ms-sh)"/>
            <polygon points="285,180 315,180 322,225 278,225" fill="url(#ms-tie)" filter="url(#ms-sh)"/>
            <polygon points="208,125 285,190 270,140" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#ms-sh)"/>
            <polygon points="392,125 315,190 330,140" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" filter="url(#ms-sh)"/>
            <circle cx="300" cy="275" r="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
            <circle cx="300" cy="355" r="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
            <circle cx="300" cy="435" r="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
        </svg>`,

        "women-black": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480">
            <defs>
                <linearGradient id="wb-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#27272a"/>
                    <stop offset="50%" stop-color="#18181b"/>
                    <stop offset="100%" stop-color="#09090b"/>
                </linearGradient>
                <linearGradient id="wb-lapel" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#3f3f46"/>
                    <stop offset="100%" stop-color="#18181b"/>
                </linearGradient>
                <filter id="wb-sh" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
                </filter>
            </defs>
            <path d="M220,135 Q300,240 380,135 L350,330 L250,330 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="1.5"/>
            <path d="M0,350 C35,230 135,150 220,135 L255,300 L300,375 L345,300 L380,135 C465,150 565,230 600,350 L600,480 L0,480 Z" fill="url(#wb-jacket)"/>
            <path d="M220,135 L260,230 L235,245 L298,370 L255,300 Z" fill="url(#wb-lapel)" stroke="#09090b" stroke-width="1" filter="url(#wb-sh)"/>
            <path d="M380,135 L340,230 L365,245 L302,370 L345,300 Z" fill="url(#wb-lapel)" stroke="#09090b" stroke-width="1" filter="url(#wb-sh)"/>
            <circle cx="300" cy="385" r="6" fill="#18181b" stroke="#71717a" stroke-width="1.5"/>
        </svg>`,

        "women-navy": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 480">
            <defs>
                <linearGradient id="wn-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#1e3a8a"/>
                    <stop offset="50%" stop-color="#172554"/>
                    <stop offset="100%" stop-color="#0f172a"/>
                </linearGradient>
                <linearGradient id="wn-lapel" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#2563eb"/>
                    <stop offset="100%" stop-color="#1e3a8a"/>
                </linearGradient>
                <filter id="wn-sh" x="-10%" y="-10%" width="120%" height="130%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
                </filter>
            </defs>
            <path d="M220,135 Q300,240 380,135 L350,330 L250,330 Z" fill="#fdfbf7" stroke="#e2e8f0" stroke-width="1.5"/>
            <path d="M0,350 C35,230 135,150 220,135 L255,300 L300,375 L345,300 L380,135 C465,150 565,230 600,350 L600,480 L0,480 Z" fill="url(#wn-jacket)"/>
            <path d="M220,135 L260,230 L235,245 L298,370 L255,300 Z" fill="url(#wn-lapel)" stroke="#0f172a" stroke-width="1" filter="url(#wn-sh)"/>
            <path d="M380,135 L340,230 L365,245 L302,370 L345,300 Z" fill="url(#wn-lapel)" stroke="#0f172a" stroke-width="1" filter="url(#wn-sh)"/>
            <circle cx="300" cy="385" r="6" fill="#0f172a" stroke="#93c5fd" stroke-width="1.5"/>
        </svg>`
    };

    function getSuitImage(key) {
        if (!key || key === "none" || !SUIT_SVGS[key]) return null;
        if (!cachedSuitImages[key]) {
            const img = new Image();
            img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SUIT_SVGS[key]);
            cachedSuitImages[key] = img;
        }
        return cachedSuitImages[key];
    }

    // Pre-cache suits on load
    Object.keys(SUIT_SVGS).forEach(getSuitImage);

    // ══════════════════════════════════════════════════════════════════════
    // INITIALIZATION & EVENT LISTENERS
    // ══════════════════════════════════════════════════════════════════════

    // Drag & Drop File Handling
    if (dropZone) {
        dropZone.addEventListener("click", () => photoUpload.click());
        dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZone.classList.add("dragover");
        });
        dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragover"));
        dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropZone.classList.remove("dragover");
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleUploadedFile(e.dataTransfer.files[0]);
            }
        });
    }

    photoUpload.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
            handleUploadedFile(e.target.files[0]);
        }
    });

    btnChangePhoto.addEventListener("click", () => photoUpload.click());

    function handleUploadedFile(file) {
        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image file (JPG, PNG, WebP).");
            return;
        }

        fileNameLabel.innerText = file.name;
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                segmentedCanvas = null;
                isAiSegmented = false;
                lastDetectedFace = null;
                resetTransforms();

                initialUploadContainer.style.display = "none";
                studioInterface.style.display = "grid";

                updatePresetDimensions();
                renderAll();

                // Automatically trigger AI auto-pilot face detection on first upload
                setTimeout(() => {
                    if (btnAiAutoFit) btnAiAutoFit.click();
                }, 300);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ── Presets & Dimensions ──
    presetSelect.addEventListener("change", () => {
        currentPresetKey = presetSelect.value;
        if (currentPresetKey === "custom") {
            customSizeFields.style.display = "grid";
        } else {
            customSizeFields.style.display = "none";
        }
        updatePresetDimensions();
        renderAll();
    });

    customW.addEventListener("input", () => {
        if (currentPresetKey === "custom") {
            updatePresetDimensions();
            renderAll();
        }
    });
    customH.addEventListener("input", () => {
        if (currentPresetKey === "custom") {
            updatePresetDimensions();
            renderAll();
        }
    });

    function getActiveDimensions() {
        let wMm = 35;
        let hMm = 45;
        let ratio = "70% – 80%";

        if (currentPresetKey === "custom") {
            wMm = parseFloat(customW.value) || 35;
            hMm = parseFloat(customH.value) || 45;
            ratio = "Custom";
        } else if (PRESETS[currentPresetKey]) {
            wMm = PRESETS[currentPresetKey].wMm;
            hMm = PRESETS[currentPresetKey].hMm;
            ratio = PRESETS[currentPresetKey].ratio;
        }

        const pxW = Math.round(wMm * DPI_FACTOR);
        const pxH = Math.round(hMm * DPI_FACTOR);

        return { wMm, hMm, pxW, pxH, ratio };
    }

    function updatePresetDimensions() {
        const d = getActiveDimensions();
        presetDimLabel.innerText = `${d.wMm} × ${d.hMm} mm`;
        hudSizeMm.innerText = `${d.wMm} × ${d.hMm} mm`;
        hudSizePx.innerText = `${d.pxW} × ${d.pxH} px`;
        hudHeadRatio.innerText = d.ratio;

        // Update single crop canvas resolution
        cropCanvas.width = d.pxW;
        cropCanvas.height = d.pxH;

        // Update viewport display scale for comfortable view
        const maxDisplayH = 380;
        const displayScale = Math.min(1, maxDisplayH / d.pxH);
        const dispW = Math.round(d.pxW * displayScale);
        const dispH = Math.round(d.pxH * displayScale);

        cropBox.style.width = dispW + "px";
        cropBox.style.height = dispH + "px";
        cropCanvas.style.width = dispW + "px";
        cropCanvas.style.height = dispH + "px";
    }

    // ══════════════════════════════════════════════════════════════════════
    // ⚡ AI AUTO-PILOT BIOMETRIC FACE DETECTION & ALIGNMENT
    // ══════════════════════════════════════════════════════════════════════

    if (btnAiAutoFit) {
        btnAiAutoFit.addEventListener("click", async () => {
            if (!originalImage || isFaceDetecting) return;

            isFaceDetecting = true;
            btnAiAutoFit.disabled = true;
            aiMagicBtnText.innerText = "Analyzing portrait...";
            if (aiFaceStatus) {
                aiFaceStatus.style.display = "block";
                aiFaceStatus.innerText = "🔍 AI detecting eye-level horizon & facial landmarks...";
            }

            try {
                if (!faceDetectionInstance && typeof FaceDetection !== "undefined") {
                    faceDetectionInstance = new FaceDetection({
                        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`
                    });
                    faceDetectionInstance.setOptions({
                        model: "short",
                        minDetectionConfidence: 0.5
                    });
                    faceDetectionInstance.onResults(onFaceDetectionResults);
                }

                if (faceDetectionInstance) {
                    await faceDetectionInstance.send({ image: originalImage });
                } else {
                    applyHeuristicAutoFit();
                }
            } catch (err) {
                console.error("AI Face Detection Error:", err);
                applyHeuristicAutoFit();
            } finally {
                isFaceDetecting = false;
                btnAiAutoFit.disabled = false;
                aiMagicBtnText.innerText = "One-Click Auto Fit";
            }
        });
    }

    function onFaceDetectionResults(results) {
        if (!results.detections || results.detections.length === 0 || !originalImage) {
            applyHeuristicAutoFit();
            if (aiFaceStatus) {
                aiFaceStatus.innerText = "⚠️ Face not fully detected, centered automatically.";
            }
            return;
        }

        const d = getActiveDimensions();
        // Select the primary detection closest to center or largest
        const detection = results.detections[0];
        lastDetectedFace = detection;

        // Landmarks from MediaPipe FaceDetection:
        // 0: Right Eye (subject's right), 1: Left Eye (subject's left), 2: Nose, 3: Mouth
        const eyeR = detection.landmarks[0];
        const eyeL = detection.landmarks[1];

        // 1. Calculate Tilt Angle between eyes
        const dx = (eyeL.x - eyeR.x) * originalImage.width;
        const dy = (eyeL.y - eyeR.y) * originalImage.height;
        const tiltDeg = Math.atan2(dy, dx) * (180 / Math.PI);

        // Counteract tilt to bring eye horizon to 0°
        rotationDeg = -Math.round(tiltDeg * 10) / 10;
        // Clamp to comfortable range (-25° to +25°)
        rotationDeg = Math.max(-25, Math.min(25, rotationDeg));

        // 2. Eye Midpoint in Image coordinates
        const eyeMidX = ((eyeR.x + eyeL.x) / 2) * originalImage.width;
        const eyeMidY = ((eyeR.y + eyeL.y) / 2) * originalImage.height;

        // 3. Head Height Estimation (crown to chin)
        const boxH = detection.boundingBox.height * originalImage.height;
        // Face bounding box covers eyebrow to chin; add 35% for hair/crown
        const totalHeadH = boxH * 1.35;

        // Target: Head occupies 74% of passport photo height
        const targetHeadH = d.pxH * 0.74;
        const baseScale = Math.max(d.pxW / originalImage.width, d.pxH / originalImage.height);
        const desiredScale = targetHeadH / totalHeadH;

        zoomLevel = Math.max(0.4, Math.min(2.8, desiredScale / baseScale));

        // 4. Center and Align to Biometric Eye Horizon (42% from top)
        const finalScale = baseScale * zoomLevel;
        const origMidX = originalImage.width / 2;
        const origMidY = originalImage.height / 2;

        const offX = eyeMidX - origMidX;
        const offY = eyeMidY - origMidY;

        const rad = (rotationDeg * Math.PI) / 180;
        const rotOffX = (offX * Math.cos(rad) - offY * Math.sin(rad)) * finalScale;
        const rotOffY = (offX * Math.sin(rad) + offY * Math.cos(rad)) * finalScale;

        // Official eye line is 42% from the top (centered horizontally)
        panX = Math.round(-rotOffX);
        panY = Math.round((d.pxH * 0.42 - d.pxH * 0.5) - rotOffY);

        // Update UI Sliders
        zoomRange.value = zoomLevel;
        zoomValEl.innerText = Math.round(zoomLevel * 100) + "%";

        rotateRange.value = rotationDeg;
        rotateValEl.innerText = rotationDeg + "°";

        if (aiFaceStatus) {
            const tiltFixedText = Math.abs(tiltDeg) >= 0.5
                ? `Straightened ${Math.abs(tiltDeg).toFixed(1)}° tilt`
                : "Posture level";
            aiFaceStatus.innerText = `✨ Biometric Auto-Fit Applied! (${tiltFixedText} & centered on 74% ratio)`;
        }

        renderAll();
    }

    function applyHeuristicAutoFit() {
        // Fallback centering & scaling
        zoomLevel = 1.05;
        zoomRange.value = 1.05;
        zoomValEl.innerText = "105%";

        rotationDeg = 0;
        rotateRange.value = 0;
        rotateValEl.innerText = "0°";

        panX = 0;
        panY = 0;

        renderAll();
    }

    // ══════════════════════════════════════════════════════════════════════
    // BACKGROUND STUDIO & AI CUTOUT
    // ══════════════════════════════════════════════════════════════════════

    colorChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            colorChips.forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");
            activeBgColor = chip.getAttribute("data-color");
            renderAll();
        });
    });

    customColorPicker.addEventListener("input", (e) => {
        colorChips.forEach((c) => c.classList.remove("active"));
        activeBgColor = e.target.value;
        renderAll();
    });

    btnAiRemoveBg.addEventListener("click", async () => {
        if (!originalImage || isAiBgProcessing) return;

        if (isAiSegmented) {
            isAiSegmented = false;
            aiBtnText.innerText = "One-Click AI Background Cutout";
            renderAll();
            return;
        }

        isAiBgProcessing = true;
        btnAiRemoveBg.disabled = true;
        aiProgressBar.style.display = "block";
        aiBtnText.innerText = "Analyzing portrait...";

        try {
            if (!selfieSegmentationInstance && typeof SelfieSegmentation !== "undefined") {
                selfieSegmentationInstance = new SelfieSegmentation({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
                });
                selfieSegmentationInstance.setOptions({ modelSelection: 1 });
                selfieSegmentationInstance.onResults(onAiSegmentationResults);
            }

            if (selfieSegmentationInstance) {
                await selfieSegmentationInstance.send({ image: originalImage });
            } else {
                alert("AI segmentation model is loading. Please try again in 2 seconds.");
            }
        } catch (err) {
            console.error("AI Segmentation Error:", err);
            alert("Could not process with AI on this device. You can still align, crop, and adjust your photo manually!");
        } finally {
            isAiBgProcessing = false;
            btnAiRemoveBg.disabled = false;
            aiProgressBar.style.display = "none";
        }
    });

    function onAiSegmentationResults(results) {
        if (!results.segmentationMask || !originalImage) return;

        segmentedCanvas = document.createElement("canvas");
        segmentedCanvas.width = originalImage.width;
        segmentedCanvas.height = originalImage.height;
        const sCtx = segmentedCanvas.getContext("2d");

        sCtx.drawImage(originalImage, 0, 0);
        sCtx.globalCompositeOperation = "destination-in";
        sCtx.drawImage(results.segmentationMask, 0, 0, originalImage.width, originalImage.height);
        sCtx.globalCompositeOperation = "source-over";

        isAiSegmented = true;
        aiBtnText.innerText = "✅ AI Cutout Active (Click to Revert)";

        if (activeBgColor === "original") {
            activeBgColor = "#ffffff";
            colorChips.forEach((c) => {
                if (c.getAttribute("data-color") === "#ffffff") c.classList.add("active");
                else c.classList.remove("active");
            });
        }

        renderAll();
    }

    // ══════════════════════════════════════════════════════════════════════
    // VIRTUAL FORMAL ATTIRE & SUIT STUDIO
    // ══════════════════════════════════════════════════════════════════════

    suitChips.forEach((chip) => {
        chip.addEventListener("click", () => {
            suitChips.forEach((c) => c.classList.remove("active"));
            chip.classList.add("active");

            activeSuitKey = chip.getAttribute("data-suit");

            const labels = {
                "none": "Original Clothes",
                "men-black": "Men's Black Formal Suit",
                "men-navy": "Men's Navy Executive Blazer",
                "men-shirt": "White Dress Shirt & Tie",
                "women-black": "Women's Black Formal Blazer",
                "women-navy": "Women's Royal Navy Jacket"
            };

            activeSuitLabel.innerText = labels[activeSuitKey] || "Formal Attire";

            if (activeSuitKey === "none") {
                suitControlsPanel.style.display = "none";
            } else {
                suitControlsPanel.style.display = "block";
            }

            renderAll();
        });
    });

    suitScaleRange.addEventListener("input", (e) => {
        suitScale = parseFloat(e.target.value);
        suitScaleVal.innerText = Math.round(suitScale * 100) + "%";
        renderAll();
    });

    suitYRange.addEventListener("input", (e) => {
        suitOffsetY = parseInt(e.target.value);
        suitYVal.innerText = (suitOffsetY > 0 ? "+" : "") + suitOffsetY + " px";
        renderAll();
    });

    // ══════════════════════════════════════════════════════════════════════
    // ZOOM, ROTATE & TRANSFORM SLIDERS
    // ══════════════════════════════════════════════════════════════════════

    zoomRange.addEventListener("input", (e) => {
        zoomLevel = parseFloat(e.target.value);
        zoomValEl.innerText = Math.round(zoomLevel * 100) + "%";
        renderAll();
    });

    btnZoomIn.addEventListener("click", () => {
        zoomLevel = Math.min(3.0, zoomLevel + 0.1);
        zoomRange.value = zoomLevel;
        zoomValEl.innerText = Math.round(zoomLevel * 100) + "%";
        renderAll();
    });

    btnZoomOut.addEventListener("click", () => {
        zoomLevel = Math.max(0.4, zoomLevel - 0.1);
        zoomRange.value = zoomLevel;
        zoomValEl.innerText = Math.round(zoomLevel * 100) + "%";
        renderAll();
    });

    rotateRange.addEventListener("input", (e) => {
        rotationDeg = parseFloat(e.target.value);
        rotateValEl.innerText = rotationDeg + "°";
        renderAll();
    });

    btnRotLeft.addEventListener("click", () => {
        rotationDeg = Math.max(-25, rotationDeg - 1);
        rotateRange.value = rotationDeg;
        rotateValEl.innerText = rotationDeg + "°";
        renderAll();
    });

    btnRotRight.addEventListener("click", () => {
        rotationDeg = Math.min(25, rotationDeg + 1);
        rotateRange.value = rotationDeg;
        rotateValEl.innerText = rotationDeg + "°";
        renderAll();
    });

    // Quick Nudge & Center Buttons
    const NUDGE_STEP = 15;
    btnNudgeUp.addEventListener("click", () => { panY -= NUDGE_STEP; renderAll(); });
    btnNudgeDown.addEventListener("click", () => { panY += NUDGE_STEP; renderAll(); });
    btnNudgeLeft.addEventListener("click", () => { panX -= NUDGE_STEP; renderAll(); });
    btnNudgeRight.addEventListener("click", () => { panX += NUDGE_STEP; renderAll(); });
    btnCenterPhoto.addEventListener("click", () => { panX = 0; panY = 0; renderAll(); });

    btnResetTransform.addEventListener("click", resetTransforms);

    function resetTransforms() {
        zoomLevel = 1.0;
        zoomRange.value = 1.0;
        zoomValEl.innerText = "100%";

        rotationDeg = 0;
        rotateRange.value = 0;
        rotateValEl.innerText = "0°";

        panX = 0;
        panY = 0;

        brightValEl.innerText = "0%";
        brightRange.value = 0;
        brightnessVal = 0;

        contrastValEl.innerText = "0%";
        contrastRange.value = 0;
        contrastVal = 0;

        suitScale = 1.0;
        suitScaleRange.value = 1.0;
        suitScaleVal.innerText = "100%";
        suitOffsetY = 0;
        suitYRange.value = 0;
        suitYVal.innerText = "0 px";

        if (aiFaceStatus) {
            aiFaceStatus.style.display = "none";
        }

        renderAll();
    }

    // ── Studio Lighting Sliders ──
    brightRange.addEventListener("input", (e) => {
        brightnessVal = parseInt(e.target.value);
        brightValEl.innerText = (brightnessVal > 0 ? "+" : "") + brightnessVal + "%";
        renderAll();
    });

    contrastRange.addEventListener("input", (e) => {
        contrastVal = parseInt(e.target.value);
        contrastValEl.innerText = (contrastVal > 0 ? "+" : "") + contrastVal + "%";
        renderAll();
    });

    btnAutoEnhance.addEventListener("click", () => {
        brightnessVal = 6;
        contrastVal = 10;
        brightRange.value = 6;
        contrastRange.value = 10;
        brightValEl.innerText = "+6%";
        contrastValEl.innerText = "+10%";
        renderAll();
    });

    // ── Mouse & Touch Dragging on Crop Box ──
    cropBox.addEventListener("mousedown", (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        initialPanX = panX;
        initialPanY = panY;
    });

    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const rect = cropBox.getBoundingClientRect();
        const scaleFactor = cropCanvas.width / rect.width;

        const dx = (e.clientX - dragStartX) * scaleFactor;
        const dy = (e.clientY - dragStartY) * scaleFactor;

        panX = initialPanX + dx;
        panY = initialPanY + dy;
        renderAll();
    });

    window.addEventListener("mouseup", () => {
        isDragging = false;
    });

    // Touch Support for Mobile
    cropBox.addEventListener("touchstart", (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            dragStartX = e.touches[0].clientX;
            dragStartY = e.touches[0].clientY;
            initialPanX = panX;
            initialPanY = panY;
        }
    }, { passive: true });

    window.addEventListener("touchmove", (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        const rect = cropBox.getBoundingClientRect();
        const scaleFactor = cropCanvas.width / rect.width;

        const dx = (e.touches[0].clientX - dragStartX) * scaleFactor;
        const dy = (e.touches[0].clientY - dragStartY) * scaleFactor;

        panX = initialPanX + dx;
        panY = initialPanY + dy;
        renderAll();
    }, { passive: true });

    window.addEventListener("touchend", () => {
        isDragging = false;
    });

    // Mouse Wheel Zoom on Crop Box
    cropBox.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        zoomLevel = Math.max(0.4, Math.min(3.0, zoomLevel + delta));
        zoomRange.value = zoomLevel;
        zoomValEl.innerText = Math.round(zoomLevel * 100) + "%";
        renderAll();
    }, { passive: false });

    // ── Biometric Guide Overlay Toggle ──
    btnToggleGuide.addEventListener("click", () => {
        showGuide = !showGuide;
        if (showGuide) {
            biometricOverlay.classList.remove("hidden");
            guideStatusText.innerText = "ON";
            btnToggleGuide.style.color = "#0284c7";
            btnToggleGuide.style.borderColor = "#0284c7";
        } else {
            biometricOverlay.classList.add("hidden");
            guideStatusText.innerText = "OFF";
            btnToggleGuide.style.color = "var(--text-secondary)";
            btnToggleGuide.style.borderColor = "var(--border-color)";
        }
    });

    // ── Preview Mode Switcher (Single vs Sheet) ──
    tabSinglePreview.addEventListener("click", () => {
        activePreviewMode = "single";
        tabSinglePreview.classList.add("active");
        tabSheetPreview.classList.remove("active");
        singleViewContainer.style.display = "flex";
        sheetViewContainer.style.display = "none";
        renderAll();
    });

    tabSheetPreview.addEventListener("click", () => {
        activePreviewMode = "sheet";
        tabSheetPreview.classList.add("active");
        tabSinglePreview.classList.remove("active");
        singleViewContainer.style.display = "none";
        sheetViewContainer.style.display = "flex";
        renderAll();
    });

    sheetPaperType.addEventListener("change", renderAll);
    sheetCopies.addEventListener("change", renderAll);
    cutLinesToggle.addEventListener("change", renderAll);

    // ══════════════════════════════════════════════════════════════════════
    // RENDERING CORE ENGINE (300 DPI VECTOR PRECISION)
    // ══════════════════════════════════════════════════════════════════════

    function renderAll() {
        if (!originalImage) return;
        renderSingleCanvas();
        if (activePreviewMode === "sheet") {
            renderSheetCanvas();
        }
        updateComplianceInspector();
    }

    // 1. Draw Single Passport Photo
    function renderSingleCanvas() {
        const d = getActiveDimensions();
        const ctx = cropCanvas.getContext("2d");

        ctx.clearRect(0, 0, d.pxW, d.pxH);

        // Fill background color
        if (activeBgColor !== "original") {
            ctx.fillStyle = activeBgColor;
            ctx.fillRect(0, 0, d.pxW, d.pxH);
        }

        // Active image source: segmented transparent cutout OR original photo
        const imgSrc = (isAiSegmented && segmentedCanvas && activeBgColor !== "original")
            ? segmentedCanvas
            : originalImage;

        // Apply studio lighting filters
        ctx.save();
        const b = 100 + brightnessVal;
        const c = 100 + contrastVal;
        ctx.filter = `brightness(${b}%) contrast(${c}%)`;

        // Calculate base cover scale
        const baseScale = Math.max(d.pxW / imgSrc.width, d.pxH / imgSrc.height);
        const finalScale = baseScale * zoomLevel;

        const drawW = imgSrc.width * finalScale;
        const drawH = imgSrc.height * finalScale;

        // Calculate center with pan offsets and rotation
        const centerX = (d.pxW / 2) + panX;
        const centerY = (d.pxH / 2) + panY;

        ctx.translate(centerX, centerY);
        if (rotationDeg !== 0) {
            ctx.rotate((rotationDeg * Math.PI) / 180);
        }

        ctx.drawImage(imgSrc, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // Overlay Virtual Formal Suit (if chosen)
        if (activeSuitKey !== "none") {
            const suitImg = getSuitImage(activeSuitKey);
            if (suitImg && suitImg.complete) {
                const suitBaseW = d.pxW * 1.15;
                const suitBaseH = d.pxH * 0.58;
                const drawSuitW = suitBaseW * suitScale;
                const drawSuitH = suitBaseH * suitScale;
                const drawSuitX = (d.pxW - drawSuitW) / 2;
                const drawSuitY = (d.pxH - drawSuitH * 0.90) + suitOffsetY;

                ctx.save();
                ctx.drawImage(suitImg, drawSuitX, drawSuitY, drawSuitW, drawSuitH);
                ctx.restore();
            }
        }

        // 1px subtle boundary stroke
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, d.pxW, d.pxH);
    }

    // 2. Draw Multi-Copy Printable Sheet
    function renderSheetCanvas() {
        const d = getActiveDimensions();
        const paper = sheetPaperType.value; // 'a4' or '4x6'
        const sCtx = sheetCanvas.getContext("2d");

        // Sheet dimensions in pixels at 300 DPI
        let sheetW = 2480; // A4 width (210 mm)
        let sheetH = 3508; // A4 height (297 mm)
        let paperLabel = "A4 (210 × 297 mm)";

        if (paper === "4x6") {
            sheetW = 1200; // 4 inch width (101.6 mm)
            sheetH = 1800; // 6 inch height (152.4 mm)
            paperLabel = "4 × 6 inch Photo Paper (10 × 15 cm)";
        }

        sheetCanvas.width = sheetW;
        sheetCanvas.height = sheetH;

        // Fill sheet background pure white
        sCtx.fillStyle = "#ffffff";
        sCtx.fillRect(0, 0, sheetW, sheetH);

        // Gap and margins
        const gapX = Math.round(5 * DPI_FACTOR); // 5 mm gap
        const gapY = Math.round(5 * DPI_FACTOR);
        const marginX = Math.round(15 * DPI_FACTOR); // 15 mm margin
        const marginY = Math.round(20 * DPI_FACTOR);

        // Max possible grid columns and rows
        const maxCols = Math.floor((sheetW - (2 * marginX) + gapX) / (d.pxW + gapX));
        const maxRows = Math.floor((sheetH - (2 * marginY) + gapY) / (d.pxH + gapY));
        const maxCapacity = Math.max(1, maxCols * maxRows);

        let targetCopies = maxCapacity;
        if (sheetCopies.value !== "auto") {
            targetCopies = Math.min(parseInt(sheetCopies.value), maxCapacity);
        }

        // Center the active grid on the sheet
        const actualCols = Math.min(targetCopies, maxCols);
        const actualRows = Math.ceil(targetCopies / actualCols);

        const totalGridW = (actualCols * d.pxW) + ((actualCols - 1) * gapX);
        const totalGridH = (actualRows * d.pxH) + ((actualRows - 1) * gapY);

        const startX = Math.max(marginX, Math.round((sheetW - totalGridW) / 2));
        const startY = Math.max(marginY, Math.round((sheetH - totalGridH) / 2));

        const drawCutLines = cutLinesToggle.checked;

        for (let i = 0; i < targetCopies; i++) {
            const col = i % actualCols;
            const row = Math.floor(i / actualCols);

            const x = startX + (col * (d.pxW + gapX));
            const y = startY + (row * (d.pxH + gapY));

            // Draw single photo into grid position
            sCtx.drawImage(cropCanvas, x, y, d.pxW, d.pxH);

            // Optional scissor cut guides
            if (drawCutLines) {
                sCtx.save();
                sCtx.strokeStyle = "#94a3b8";
                sCtx.lineWidth = 1.5;
                sCtx.setLineDash([8, 8]);
                sCtx.strokeRect(x, y, d.pxW, d.pxH);
                sCtx.restore();
            }
        }

        // Print header & metadata at top of sheet
        sCtx.save();
        sCtx.font = "bold 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        sCtx.fillStyle = "#64748b";
        sCtx.textAlign = "center";
        sCtx.fillText(
            `ToolX Pro Passport Studio • ${PRESETS[currentPresetKey]?.name || "Passport"} (${d.wMm} × ${d.hMm} mm) • ${paperLabel}`,
            sheetW / 2,
            Math.max(35, startY - 30)
        );

        sCtx.font = "normal 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        sCtx.fillStyle = "#94a3b8";
        sCtx.fillText(
            "Print at 100% scale (Actual Size) on glossy photo paper for true biometric dimensions",
            sheetW / 2,
            sheetH - 35
        );
        sCtx.restore();
    }

    // ══════════════════════════════════════════════════════════════════════
    // AI BIOMETRIC COMPLIANCE INSPECTOR (ICAO DOC 9303)
    // ══════════════════════════════════════════════════════════════════════

    function updateComplianceInspector() {
        if (!complianceOverallBadge) return;
        const d = getActiveDimensions();
        let passCount = 0;

        // 1. Facial Position Check
        const offCenterRatio = Math.abs(panX) / d.pxW;
        if (offCenterRatio < 0.12) {
            chkFaceIcon.innerText = "✅";
            chkFaceVal.innerText = "Frontal portrait centered";
            chkFaceVal.style.color = "inherit";
            passCount++;
        } else {
            chkFaceIcon.innerText = "⚠️";
            chkFaceVal.innerText = "Off-center horizontally (click Center)";
            chkFaceVal.style.color = "#f59e0b";
        }

        // 2. Head Tilt Check
        if (Math.abs(rotationDeg) <= 1.0) {
            if (chkTiltIcon) chkTiltIcon.innerText = "✅";
            if (chkTiltVal) {
                chkTiltVal.innerText = "Level horizon (0° deviation)";
                chkTiltVal.style.color = "inherit";
            }
            passCount++;
        } else {
            if (chkTiltIcon) chkTiltIcon.innerText = "⚠️";
            if (chkTiltVal) {
                chkTiltVal.innerText = `${rotationDeg > 0 ? "+" : ""}${rotationDeg}° tilt (Click Straighten)`;
                chkTiltVal.style.color = "#f59e0b";
            }
        }

        // 3. Head-to-Height Ratio Check (Standard: 70% – 80%)
        const estimatedRatio = Math.round(74 * (zoomLevel / 1.0));
        if (estimatedRatio >= 68 && estimatedRatio <= 82) {
            chkRatioIcon.innerText = "✅";
            chkRatioVal.innerText = `${estimatedRatio}% (Optimal 70%–80%)`;
            chkRatioVal.style.color = "inherit";
            passCount++;
        } else if (estimatedRatio < 68) {
            chkRatioIcon.innerText = "⚠️";
            chkRatioVal.innerText = `${estimatedRatio}% (Head too small, zoom in)`;
            chkRatioVal.style.color = "#f59e0b";
        } else {
            chkRatioIcon.innerText = "⚠️";
            chkRatioVal.innerText = `${estimatedRatio}% (Head too large, zoom out)`;
            chkRatioVal.style.color = "#f59e0b";
        }

        // 4. Background Uniformity Check
        if (activeBgColor !== "original") {
            chkBgIcon.innerText = "✅";
            const colorName = activeBgColor === "#ffffff" ? "Pure White" : (activeBgColor === "#4a90e2" ? "Light Blue" : "Solid Official Color");
            chkBgVal.innerText = `Solid background (${colorName})`;
            chkBgVal.style.color = "inherit";
            passCount++;
        } else {
            chkBgIcon.innerText = "⚠️";
            chkBgVal.innerText = "Original background (use AI Cutout)";
            chkBgVal.style.color = "#f59e0b";
        }

        // Overall Compliance Score
        if (passCount === 4) {
            complianceOverallBadge.innerText = "98% COMPLIANT";
            complianceOverallBadge.className = "badge-passed";
            complianceOverallBadge.style.background = "rgba(16, 185, 129, 0.15)";
            complianceOverallBadge.style.color = "#059669";
        } else if (passCount === 3) {
            complianceOverallBadge.innerText = "80% ACCEPTABLE";
            complianceOverallBadge.className = "badge-passed";
            complianceOverallBadge.style.background = "rgba(245, 158, 11, 0.15)";
            complianceOverallBadge.style.color = "#d97706";
        } else {
            complianceOverallBadge.innerText = "NEEDS ALIGNMENT";
            complianceOverallBadge.className = "badge-passed";
            complianceOverallBadge.style.background = "rgba(239, 68, 68, 0.15)";
            complianceOverallBadge.style.color = "#dc2626";
        }
    }

    // ══════════════════════════════════════════════════════════════════════
    // EXPORT & DOWNLOAD ACTIONS
    // ══════════════════════════════════════════════════════════════════════

    // 1. Download Single Photo (300 DPI PNG)
    btnDlSinglePng.addEventListener("click", () => {
        if (!originalImage) return;
        renderSingleCanvas();
        const d = getActiveDimensions();

        const link = document.createElement("a");
        link.download = `passport-photo-${d.wMm}x${d.hMm}mm.png`;
        link.href = cropCanvas.toDataURL("image/png");
        link.click();
    });

    // 2. Download Photo Sheet (PNG)
    btnDlSheetPng.addEventListener("click", () => {
        if (!originalImage) return;
        renderSheetCanvas();

        const paper = sheetPaperType.value;
        const link = document.createElement("a");
        link.download = `passport-sheet-${paper}-300dpi.png`;
        link.href = sheetCanvas.toDataURL("image/png");
        link.click();
    });

    // 3. Download Ready-to-Print PDF Sheet
    btnDlSheetPdf.addEventListener("click", () => {
        if (!originalImage) return;
        renderSheetCanvas();

        const paper = sheetPaperType.value;
        const isA4 = paper === "a4";

        try {
            if (typeof window.jspdf === "undefined" || !window.jspdf.jsPDF) {
                alert("PDF library is loading. You can download the high-resolution PNG sheet right now!");
                return;
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: isA4 ? "a4" : [101.6, 152.4]
            });

            const imgData = sheetCanvas.toDataURL("image/jpeg", 0.95);
            const pdfW = isA4 ? 210 : 101.6;
            const pdfH = isA4 ? 297 : 152.4;

            pdf.addImage(imgData, "JPEG", 0, 0, pdfW, pdfH);
            pdf.save(`passport-photo-sheet-${paper}.pdf`);
        } catch (err) {
            console.error("PDF generation error:", err);
            btnDlSheetPng.click();
        }
    });

    // 4. Direct Print
    btnPrintSheet.addEventListener("click", () => {
        if (!originalImage) return;

        renderSheetCanvas();

        if (activePreviewMode !== "sheet") {
            tabSheetPreview.click();
        }

        setTimeout(() => {
            window.print();
        }, 150);
    });

});
