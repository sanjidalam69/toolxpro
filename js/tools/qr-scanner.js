// ToolX Pro - QR Code Scanner Javascript
document.addEventListener("DOMContentLoaded", () => {
    const tabCameraBtn = document.getElementById("tab-camera-btn");
    const tabFileBtn = document.getElementById("tab-file-btn");
    
    const cameraScannerArea = document.getElementById("camera-scanner-area");
    const fileScannerArea = document.getElementById("file-scanner-area");
    
    const startCameraBtn = document.getElementById("start-camera-btn");
    const stopCameraBtn = document.getElementById("stop-camera-btn");
    
    const dropArea = document.getElementById("drop-area");
    const qrFileUpload = document.getElementById("qr-file-upload");
    
    const resultsCard = document.getElementById("results");
    const resultsContent = document.getElementById("results-content");

    let html5QrCode = null;
    let cameraActive = false;

    tabCameraBtn.addEventListener("click", () => {
        tabCameraBtn.classList.add("active");
        tabCameraBtn.style.background = "var(--primary-glow)";
        tabCameraBtn.style.color = "var(--primary)";
        
        tabFileBtn.classList.remove("active");
        tabFileBtn.style.background = "";
        tabFileBtn.style.color = "";

        cameraScannerArea.style.display = "block";
        fileScannerArea.style.display = "none";
        
        resultsCard.style.display = "none";
    });

    tabFileBtn.addEventListener("click", () => {
        tabFileBtn.classList.add("active");
        tabFileBtn.style.background = "var(--primary-glow)";
        tabFileBtn.style.color = "var(--primary)";
        
        tabCameraBtn.classList.remove("active");
        tabCameraBtn.style.background = "";
        tabCameraBtn.style.color = "";

        cameraScannerArea.style.display = "none";
        fileScannerArea.style.display = "block";
        
        resultsCard.style.display = "none";
        stopCamera();
    });

    startCameraBtn.addEventListener("click", () => {
        resultsCard.style.display = "none";
        html5QrCode = new Html5Qrcode("reader");
        
        const config = { 
            fps: 10, 
            qrbox: (width, height) => {
                const size = Math.min(width, height) * 0.65;
                return { width: size, height: size };
            }
        };

        html5QrCode.start(
            { facingMode: "environment" }, 
            config, 
            onScanSuccess,
            onScanFailure
        ).then(() => {
            cameraActive = true;
            startCameraBtn.style.display = "none";
            stopCameraBtn.style.display = "inline-block";
        }).catch(err => {
            console.error(err);
            alert("Unable to access camera. Please check your camera permissions.");
        });
    });

    stopCameraBtn.addEventListener("click", stopCamera);

    function stopCamera() {
        if (html5QrCode && cameraActive) {
            html5QrCode.stop().then(() => {
                cameraActive = false;
                startCameraBtn.style.display = "inline-block";
                stopCameraBtn.style.display = "none";
            }).catch(err => {
                console.error("Failed to stop scanner", err);
            });
        }
    }

    function onScanSuccess(decodedText) {
        stopCamera();
        
        const isUrl = /^(https?:\/\/[^\s]+)$/i.test(decodedText);
        let contentHtml = "";

        if (isUrl) {
            contentHtml = `
                <div style="text-align:center; padding:10px 0;">
                    <p style="font-size:1.1rem; margin-bottom:10px; color:var(--success); font-weight:600;">🔗 Website Link Found:</p>
                    <a href="${decodedText}" target="_blank" class="form-control" style="color:var(--primary); font-family:var(--font-en); text-decoration:none; display:inline-block; word-break:break-all; background:var(--bg-secondary); border:1px solid var(--border-color); padding:12px; font-weight:bold;">
                        ${decodedText}
                    </a>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin-top:8px;">Click on the link to visit the site.</p>
                </div>
            `;
        } else {
            contentHtml = `
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <p style="font-weight:600; color:var(--primary);">📋 QR Code Contents:</p>
                    <textarea id="scan-result-textarea" class="form-control" rows="4" readonly style="font-family:var(--font-en); font-size:1rem; font-weight:500;">${decodedText}</textarea>
                    <button id="copy-result-btn" class="btn btn-primary" style="width:auto; align-self:flex-start;">📋 Copy Text</button>
                </div>
            `;
        }

        resultsContent.innerHTML = contentHtml;
        resultsCard.style.display = "block";
        resultsCard.scrollIntoView({ behavior: 'smooth' });

        const copyBtn = document.getElementById("copy-result-btn");
        if (copyBtn) {
            copyBtn.addEventListener("click", () => {
                navigator.clipboard.writeText(decodedText).then(() => {
                    copyBtn.innerText = "✅ Copied!";
                    setTimeout(() => copyBtn.innerText = "📋 Copy Text", 1500);
                });
            });
        }
    }

    function onScanFailure(error) {
        // Quietly fail as scanner searches
    }

    dropArea.addEventListener("click", () => qrFileUpload.click());

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
        if (e.dataTransfer.files.length > 0) {
            handleImageFile(e.dataTransfer.files[0]);
        }
    });

    qrFileUpload.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleImageFile(e.target.files[0]);
        }
    });

    function handleImageFile(file) {
        resultsCard.style.display = "none";
        const fileScanner = new Html5Qrcode("reader");
        
        fileScanner.scanFile(file, true)
            .then(decodedText => {
                onScanSuccess(decodedText);
            })
            .catch(err => {
                console.error(err);
                alert("No QR Code found in this image. Please upload a clear QR code image.");
            });
    }
});
