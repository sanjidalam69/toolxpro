// ToolX Pro - PDF Merge Javascript
document.addEventListener("DOMContentLoaded", () => {
    const dropArea = document.getElementById("drop-area");
    const pdfUpload = document.getElementById("pdf-upload");
    const settingsArea = document.getElementById("settings-area");
    const pdfsList = document.getElementById("pdfs-list");
    const mergePdfBtn = document.getElementById("merge-pdf-btn");
    const resultsCard = document.getElementById("results");
    const resultsContent = document.getElementById("results-content");

    let uploadedPdfs = [];

    dropArea.addEventListener("click", () => pdfUpload.click());

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

    pdfUpload.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFilesSelect(e.target.files);
        }
    });

    function formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const formatted = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
        return `${formatted} ${sizes[i]}`;
    }

    function handleFilesSelect(files) {
        Array.from(files).forEach(file => {
            if (file.type === "application/pdf") {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedPdfs.push({
                        name: file.name,
                        size: file.size,
                        buffer: e.target.result
                    });
                    renderPdfsList();
                };
                reader.readAsArrayBuffer(file);
            }
        });

        settingsArea.style.display = "block";
        resultsCard.style.display = "none";
    }

    function renderPdfsList() {
        pdfsList.innerHTML = '';
        
        if (uploadedPdfs.length === 0) {
            settingsArea.style.display = "none";
            return;
        }

        uploadedPdfs.forEach((file, index) => {
            const item = document.createElement("div");
            item.className = "file-item";
            item.style.gap = "15px";

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px; flex:1; min-width:0;">
                    <div style="width:40px; height:40px; border-radius:4px; background:#fee2e2; display:flex; align-items:center; justify-content:center; border:1px solid #fca5a5; font-size:1.1rem; color:#ef4444; flex-shrink:0;">
                        📄
                    </div>
                    <div style="min-width:0; flex:1;">
                        <p style="font-weight:600; font-size:0.9rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${file.name}</p>
                        <p style="font-size:0.75rem; color:var(--text-secondary);">${formatSize(file.size)}</p>
                    </div>
                </div>
                <div style="display:flex; gap:5px; align-items:center;">
                    <button class="btn-order" onclick="movePdf(${index}, -1)" ${index === 0 ? 'disabled' : ''} style="padding:4px 8px; border:1px solid var(--border-color); background:var(--bg-secondary); border-radius:4px; cursor:pointer;" title="Move Up">⬆️</button>
                    <button class="btn-order" onclick="movePdf(${index}, 1)" ${index === uploadedPdfs.length - 1 ? 'disabled' : ''} style="padding:4px 8px; border:1px solid var(--border-color); background:var(--bg-secondary); border-radius:4px; cursor:pointer;" title="Move Down">⬇️</button>
                    <button class="file-remove" onclick="removePdf(${index})" title="Remove">❌</button>
                </div>
            `;
            pdfsList.appendChild(item);
        });
    }

    window.removePdf = (index) => {
        uploadedPdfs.splice(index, 1);
        renderPdfsList();
    };

    window.movePdf = (index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex >= 0 && targetIndex < uploadedPdfs.length) {
            const temp = uploadedPdfs[index];
            uploadedPdfs[index] = uploadedPdfs[targetIndex];
            uploadedPdfs[targetIndex] = temp;
            renderPdfsList();
        }
    };

    mergePdfBtn.addEventListener("click", async () => {
        if (uploadedPdfs.length === 0) return;
        if (uploadedPdfs.length < 2) {
            alert("Please select at least 2 PDF files to merge.");
            return;
        }

        try {
            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();

            for (let i = 0; i < uploadedPdfs.length; i++) {
                const file = uploadedPdfs[i];
                const srcPdf = await PDFDocument.load(file.buffer);
                const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const pdfBlob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);

            resultsContent.innerHTML = `
                <div style="display:flex; flex-direction:column; gap:15px; align-items:center;">
                    <div style="background:var(--bg-secondary); padding:10px 15px; border-radius:8px; border:1px solid var(--border-color); text-align:center; display:flex; gap:15px;">
                        <div>
                            <p style="font-size:0.85rem; color:var(--text-secondary);">Merged Files:</p>
                            <b>${uploadedPdfs.length} PDFs</b>
                        </div>
                        <div style="border-left:1px solid var(--border-color); padding-left:15px;">
                            <p style="font-size:0.85rem; color:var(--text-secondary);">Total Size:</p>
                            <b>${formatSize(pdfBlob.size)}</b>
                        </div>
                    </div>
                    
                    <a href="${pdfUrl}" target="_blank" class="btn btn-secondary" style="width:auto; min-width:200px; text-decoration:none;">
                        👀 Preview Merged PDF
                    </a>

                    <a href="${pdfUrl}" download="ToolX Pro_merged.pdf" class="btn btn-primary" style="width:auto; min-width:200px; text-decoration:none;">
                        📥 Download Merged PDF
                    </a>
                </div>
            `;

            resultsCard.style.display = "block";
            resultsCard.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error(error);
            alert("Sorry, an error occurred while merging your PDF files. Please ensure they are valid and try again.");
        }
    });
});
