// ToolX Pro - Image Converter Javascript
document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    const imageUpload = document.getElementById("image-upload");
    const settingsArea = document.getElementById("settings-area");
    const imagePreview = document.getElementById("image-preview");
    const fileNameEl = document.getElementById("file-name");
    const fileDetailsEl = document.getElementById("file-details");
    const formatSelect = document.getElementById("format-select");
    const convertBtn = document.getElementById("convert-btn");
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
            
            const type = file.type.split('/')[1].toUpperCase();
            fileDetailsEl.innerText = `Format: ${type} | Size: ${(file.size / 1024).toFixed(1)} KB`;
            
            settingsArea.style.display = "block";
            resultsCard.style.display = "none";
            
            if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                formatSelect.value = 'image/png';
            } else {
                formatSelect.value = 'image/jpeg';
            }

            settingsArea.scrollIntoView({ behavior: 'smooth' });
        };
        reader.readAsDataURL(file);
    }

    convertBtn.addEventListener("click", () => {
        if (!originalFile || !originalImageSrc) return;

        const img = new Image();
        img.src = originalImageSrc;
        
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            const targetFormat = formatSelect.value;

            if (targetFormat === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const dataURL = canvas.toDataURL(targetFormat, 0.95);
            
            let ext = '';
            if (targetFormat === 'image/jpeg') ext = 'jpg';
            else if (targetFormat === 'image/png') ext = 'png';
            else if (targetFormat === 'image/webp') ext = 'webp';

            const nameParts = originalFile.name.split('.');
            nameParts.pop();
            const outputName = `${nameParts.join('.')}_converted.${ext}`;

            resultsContent.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:15px; align-items:center;">
                    <div style="background:var(--bg-secondary); padding:10px 15px; border-radius:8px; border:1px solid var(--border-color); text-align:center;">
                        <p style="font-size:0.9rem; color:var(--text-secondary);">New Format:</p>
                        <b style="font-size:1.1rem; color:var(--primary);">${ext.toUpperCase()}</b>
                    </div>

                    <img src="${dataURL}" style="max-width:100%; max-height:300px; border-radius:8px; border:1px solid var(--border-color); box-shadow:var(--card-shadow);">
                    
                    <a href="${dataURL}" download="${outputName}" class="btn btn-primary" style="width:auto; min-width:200px; text-decoration:none;">
                        📥 Download Converted Image
                    </a>
                </div>
            `;

            resultsCard.style.display = "block";
            resultsCard.scrollIntoView({ behavior: 'smooth' });
        };
    });
});
