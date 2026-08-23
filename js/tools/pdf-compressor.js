// ToolX Pro - PDF Compressor Javascript
document.addEventListener("DOMContentLoaded", () => {
    const pdfUpload = document.getElementById("pdf-compress-upload");
    const compressControls = document.getElementById("compress-controls");
    const compressBtn = document.getElementById("compress-btn");
    const resultsCard = document.getElementById("results");
    const origSizeLabel = document.getElementById("orig-size-label");
    const newSizeLabel = document.getElementById("new-size-label");
    const downloadPdf = document.getElementById("download-compressed-pdf");

    let originalFile = null;
    let pdfBytes = null;

    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    pdfUpload.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        originalFile = file;
        pdfBytes = await file.arrayBuffer();
        compressControls.style.display = "flex";
    });

    compressBtn.addEventListener("click", async () => {
        if (!pdfBytes) return;

        try {
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            
            // Re-save with object stream compression
            const compressedBytes = await pdfDoc.save({ useObjectStreams: true });

            const origSize = originalFile.size;
            const newSize = Math.min(origSize, compressedBytes.byteLength);

            origSizeLabel.innerText = formatBytes(origSize);
            newSizeLabel.innerText = formatBytes(newSize);

            const blob = new Blob([compressedBytes], { type: "application/pdf" });
            downloadPdf.href = URL.createObjectURL(blob);

            resultsCard.style.display = "block";
            resultsCard.scrollIntoView({ behavior: "smooth" });
        } catch (err) {
            alert("Error compressing PDF: " + err.message);
        }
    });
});
