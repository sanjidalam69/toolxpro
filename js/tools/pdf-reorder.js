// ToolX Pro - PDF Reorder Javascript
document.addEventListener("DOMContentLoaded", () => {
    const pdfUpload = document.getElementById("pdf-upload");
    const pdfEditorPanel = document.getElementById("pdf-editor-panel");
    const pageOrderInput = document.getElementById("page-order-input");
    const totalPagesCount = document.getElementById("total-pages-count");
    const reorderBtn = document.getElementById("reorder-btn");
    const resultsCard = document.getElementById("results");
    const downloadPdf = document.getElementById("download-reordered-pdf");

    let pdfBytes = null;
    let loadedPdfDoc = null;

    pdfUpload.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        pdfBytes = await file.arrayBuffer();
        try {
            loadedPdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            const pageCount = loadedPdfDoc.getPageCount();
            totalPagesCount.innerText = pageCount;

            const defaultOrder = Array.from({ length: pageCount }, (_, i) => i + 1).join(", ");
            pageOrderInput.value = defaultOrder;

            pdfEditorPanel.style.display = "flex";
        } catch (err) {
            alert("Error reading PDF file. Please ensure it is a valid PDF.");
        }
    });

    reorderBtn.addEventListener("click", async () => {
        if (!loadedPdfDoc) return;

        const rawPages = pageOrderInput.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        const maxPages = loadedPdfDoc.getPageCount();

        const validIndexes = rawPages.filter(p => p >= 1 && p <= maxPages).map(p => p - 1);

        if (validIndexes.length === 0) {
            alert("Please enter valid page numbers.");
            return;
        }

        try {
            const newPdfDoc = await PDFLib.PDFDocument.create();
            const copiedPages = await newPdfDoc.copyPages(loadedPdfDoc, validIndexes);

            copiedPages.forEach(p => newPdfDoc.addPage(p));

            const newPdfBytes = await newPdfDoc.save();
            const blob = new Blob([newPdfBytes], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            downloadPdf.href = url;
            resultsCard.style.display = "block";
            resultsCard.scrollIntoView({ behavior: "smooth" });
        } catch (err) {
            alert("Error building new PDF: " + err.message);
        }
    });
});
