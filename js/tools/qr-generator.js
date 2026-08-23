// ToolX Pro - QR Code Generator Javascript
document.addEventListener("DOMContentLoaded", () => {
    const generateBtn = document.getElementById("generate-btn");
    const qrTextInput = document.getElementById("qr-text");
    const qrSizeSelect = document.getElementById("qr-size");
    const qrColorInput = document.getElementById("qr-color");
    const resultsCard = document.getElementById("results");
    const qrCanvas = document.getElementById("qr-canvas");
    const downloadBtn = document.getElementById("download-btn");

    generateBtn.addEventListener("click", () => {
        const text = qrTextInput.value.trim();
        const size = parseInt(qrSizeSelect.value);
        const color = qrColorInput.value;

        if (!text) {
            alert("Please enter a link or text to generate a QR code.");
            return;
        }

        const qr = new QRious({
            element: qrCanvas,
            value: text,
            size: size,
            foreground: color,
            background: "#ffffff",
            level: 'H'
        });

        resultsCard.style.display = "block";
        resultsCard.scrollIntoView({ behavior: 'smooth' });
    });

    downloadBtn.addEventListener("click", () => {
        const dataUrl = qrCanvas.toDataURL("image/png");
        
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "ToolX Pro_qrcode.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
