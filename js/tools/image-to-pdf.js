// ToolX Pro - Image to PDF Javascript
document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    const imageUpload = document.getElementById("image-upload");
    const settingsArea = document.getElementById("settings-area");
    const imagesList = document.getElementById("images-list");
    const createPdfBtn = document.getElementById("create-pdf-btn");
    const resultsCard = document.getElementById("results");
    const resultsContent = document.getElementById("results-content");

    const pageSizeSelect = document.getElementById("pdf-page-size");
    const orientationSelect = document.getElementById("pdf-orientation");
    const marginSelect = document.getElementById("pdf-margin");

    let uploadedFiles = [];

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
            handleFilesSelect(e.dataTransfer.files);
        }
    });

    imageUpload.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFilesSelect(e.target.files);
        }
    });

    function handleFilesSelect(files) {
        Array.from(files).forEach(file => {
            if (file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedFiles.push({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        src: e.target.result
                    });
                    renderImagesList();
                };
                reader.readAsDataURL(file);
            }
        });

        settingsArea.style.display = "block";
        resultsCard.style.display = "none";
    }

    function renderImagesList() {
        imagesList.innerHTML = '';
        
        if (uploadedFiles.length === 0) {
            settingsArea.style.display = "none";
            return;
        }

        uploadedFiles.forEach((file, index) => {
            const item = document.createElement("div");
            item.className = "file-item";
            item.style.gap = "15px";
            
            const sizeKb = (file.size / 1024).toFixed(1);

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                    <img src="${file.src}" style="width:40px; height:40px; border-radius:4px; object-fit:cover; border:1px solid var(--border-color);">
                    <div style="min-width:0; flex:1;">
                        <p style="font-weight:600; font-size:0.9rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${file.name}</p>
                        <p style="font-size:0.75rem; color:var(--text-secondary);">${sizeKb} KB</p>
                    </div>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <button class="btn-order" onclick="moveItem(${index}, -1)" ${index === 0 ? 'disabled' : ''} style="padding:4px 8px; border:1px solid var(--border-color); background:var(--bg-secondary); border-radius:4px; cursor:pointer;" title="Move Up">⬆️</button>
                    <button class="btn-order" onclick="moveItem(${index}, 1)" ${index === uploadedFiles.length - 1 ? 'disabled' : ''} style="padding:4px 8px; border:1px solid var(--border-color); background:var(--bg-secondary); border-radius:4px; cursor:pointer;" title="Move Down">⬇️</button>
                    <button class="file-remove" onclick="removeImage(${index})" title="Remove">❌</button>
                </div>
            `;
            imagesList.appendChild(item);
        });
    }

    window.removeImage = (index) => {
        uploadedFiles.splice(index, 1);
        renderImagesList();
    };

    window.moveItem = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex >= 0 && targetIndex < uploadedFiles.length) {
            const temp = uploadedFiles[index];
            uploadedFiles[index] = uploadedFiles[targetIndex];
            uploadedFiles[targetIndex] = temp;
            renderImagesList();
        }
    };

    createPdfBtn.addEventListener("click", async () => {
        if (uploadedFiles.length === 0) return;

        const { jsPDF } = window.jspdf;
        
        const pageSize = pageSizeSelect.value;
        const orientation = orientationSelect.value;
        const margin = parseInt(marginSelect.value);

        let pageWidth = 210;
        let pageHeight = 297;
        
        if (pageSize === "letter") {
            pageWidth = 216;
            pageHeight = 279;
        }

        if (orientation === "l" && pageSize !== "fit") {
            const temp = pageWidth;
            pageWidth = pageHeight;
            pageHeight = temp;
        }

        let pdf = null;

        for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];
            
            const img = new Image();
            img.src = file.src;
            
            await new Promise((resolve) => {
                img.onload = () => {
                    const imgWidth = img.naturalWidth;
                    const imgHeight = img.naturalHeight;
                    
                    let finalPageWidth = pageWidth;
                    let finalPageHeight = pageHeight;
                    let finalOrientation = orientation;
                    
                    if (pageSize === "fit") {
                        finalPageWidth = imgWidth * 0.264583;
                        finalPageHeight = imgHeight * 0.264583;
                        finalOrientation = finalPageWidth > finalPageHeight ? 'l' : 'p';
                    }

                    if (i === 0) {
                        pdf = new jsPDF({
                            orientation: finalOrientation,
                            unit: 'mm',
                            format: pageSize === 'fit' ? [finalPageWidth, finalPageHeight] : pageSize
                        });
                    } else {
                        pdf.addPage(pageSize === 'fit' ? [finalPageWidth, finalPageHeight] : pageSize, finalOrientation);
                    }

                    const netPageWidth = finalPageWidth - (margin * 2);
                    const netPageHeight = finalPageHeight - (margin * 2);

                    let drawWidth = netPageWidth;
                    let drawHeight = (imgHeight / imgWidth) * drawWidth;

                    if (drawHeight > netPageHeight) {
                        drawHeight = netPageHeight;
                        drawWidth = (imgWidth / imgHeight) * drawHeight;
                    }

                    const x = margin + ((netPageWidth - drawWidth) / 2);
                    const y = margin + ((netPageHeight - drawHeight) / 2);

                    const format = file.type === 'image/png' ? 'PNG' : 'JPEG';
                    pdf.addImage(file.src, format, x, y, drawWidth, drawHeight);
                    resolve();
                };
            });
        }

        if (pdf) {
            const pdfBlob = pdf.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            const numPages = pdf.getNumberOfPages();

            resultsContent.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:15px; align-items:center;">
                    <div style="background:var(--bg-secondary); padding:10px 15px; border-radius:8px; border:1px solid var(--border-color); text-align:center; display:flex; gap:15px;">
                        <div>
                            <p style="font-size:0.85rem; color:var(--text-secondary);">Total Images:</p>
                            <b>${uploadedFiles.length}</b>
                        </div>
                        <div style="border-left:1px solid var(--border-color); padding-left:15px;">
                            <p style="font-size:0.85rem; color:var(--text-secondary);">Total Pages:</p>
                            <b>${numPages}</b>
                        </div>
                    </div>
                    
                    <a href="${pdfUrl}" target="_blank" class="btn btn-secondary" style="width:auto; min-width:200px; text-decoration:none;">
                        👀 Preview PDF Document
                    </a>

                    <a href="${pdfUrl}" download="ToolX Pro_images.pdf" class="btn btn-primary" style="width:auto; min-width:200px; text-decoration:none;">
                        📥 Download PDF File
                    </a>
                </div>
            `;

            resultsCard.style.display = "block";
            resultsCard.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
