// ToolX Pro - Image Compressor Javascript
document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    const imageUpload = document.getElementById("image-upload");
    const settingsArea = document.getElementById("settings-area");
    const imagePreview = document.getElementById("image-preview");
    const fileNameEl = document.getElementById("file-name");
    const fileSizeEl = document.getElementById("file-size");
    const qualityRange = document.getElementById("quality-range");
    const qualityVal = document.getElementById("quality-val");
    const compressBtn = document.getElementById("compress-btn");
    const resultsCard = document.getElementById("results");
    const resultsContent = document.getElementById("results-content");

    let originalFile = null;
    let originalImageSrc = null;

    dropArea.addEventListener("click", () => imageUpload.click());

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
            handleImageSelect(e.dataTransfer.files[0]);
        }
    });

    imageUpload.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleImageSelect(e.target.files[0]);
        }
    });

    qualityRange.addEventListener("input", (e) => {
        qualityVal.innerText = `${e.target.value}%`;
    });

    function formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
        return `${formatted} ${sizes[i]}`;
    }

    function handleImageSelect(file) {
        if (!file.type.match('image.*')) {
            alert("Please select an image file (JPG, PNG, WebP).");
            return;
        }

        originalFile = file;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImageSrc = e.target.result;
            imagePreview.src = originalImageSrc;
            fileNameEl.innerText = file.name;
            fileSizeEl.innerText = `Original Size: ${formatSize(file.size)}`;
            
            settingsArea.style.display = "block";
            resultsCard.style.display = "none";
            
            settingsArea.scrollIntoView({ behavior: 'smooth' });
        };
        reader.readAsDataURL(file);
    }

    compressBtn.addEventListener("click", () => {
        if (!originalFile || !originalImageSrc) return;

        const img = new Image();
        img.src = originalImageSrc;
        
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const quality = parseFloat(qualityRange.value) / 100;
            
            let outputType = originalFile.type;
            if (outputType === 'image/png') {
                outputType = 'image/jpeg';
            }

            const dataURL = canvas.toDataURL(outputType, quality);
            
            const head = `data:${outputType};base64,`;
            const base64Len = dataURL.length - head.length;
            const compressedSizeBytes = Math.round(base64Len * 0.75);

            const sizeSaved = originalFile.size - compressedSizeBytes;
            const savedPercent = Math.max(0, ((sizeSaved / originalFile.size) * 100).toFixed(0));

            const nameParts = originalFile.name.split('.');
            nameParts.pop();
            const ext = outputType === 'image/jpeg' ? 'jpg' : 'webp';
            const outputName = `${nameParts.join('.')}_compressed.${ext}`;

            resultsContent.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:15px; align-items:center;">
                    <div style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center; width:100%;">
                        <div style="text-align:center; flex:1; min-width:140px; background:var(--bg-secondary); padding:10px; border-radius:8px; border:1px solid var(--border-color);">
                            <p style="font-size:0.85rem; color:var(--text-secondary);">Original Size:</p>
                            <b style="font-size:1.1rem;">${formatSize(originalFile.size)}</b>
                        </div>
                        <div style="text-align:center; flex:1; min-width:140px; background:var(--bg-secondary); padding:10px; border-radius:8px; border:1px solid var(--border-color); border-left:4px solid var(--success);">
                            <p style="font-size:0.85rem; color:var(--text-secondary);">Compressed Size:</p>
                            <b style="font-size:1.1rem; color:var(--success);">${formatSize(compressedSizeBytes)}</b>
                        </div>
                        <div style="text-align:center; flex:1; min-width:140px; background:var(--primary-glow); padding:10px; border-radius:8px; border:1px solid var(--primary);">
                            <p style="font-size:0.85rem; color:var(--primary);">Size Reduction:</p>
                            <b style="font-size:1.1rem; color:var(--primary);">${savedPercent}%</b>
                        </div>
                    </div>

                    <img src="${dataURL}" style="max-width:100%; max-height:300px; border-radius:8px; border:1px solid var(--border-color); box-shadow:var(--card-shadow);">
                    
                    <a href="${dataURL}" download="${outputName}" class="btn btn-primary" style="width:auto; min-width:200px; text-decoration:none;">
                        📥 Download Compressed Image
                    </a>
                </div>
            `;

            resultsCard.style.display = "block";
            resultsCard.scrollIntoView({ behavior: 'smooth' });
        };
    });
});
