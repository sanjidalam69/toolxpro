// ToolX Pro - Passport Photo Maker Javascript
document.addEventListener("DOMContentLoaded", () => {
    const photoUpload = document.getElementById("photo-upload");
    const editorControls = document.getElementById("editor-controls");
    const sizePreset = document.getElementById("size-preset");
    const bgColor = document.getElementById("bg-color");
    const gridCopies = document.getElementById("grid-copies");
    const generateBtn = document.getElementById("generate-btn");
    const resultsCard = document.getElementById("results");
    const outputCanvas = document.getElementById("output-canvas");
    const downloadBtn = document.getElementById("download-btn");

    let loadedImage = null;

    photoUpload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                loadedImage = img;
                editorControls.style.display = "flex";
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    generateBtn.addEventListener("click", () => {
        if (!loadedImage) return;

        const copies = parseInt(gridCopies.value);
        const preset = sizePreset.value;
        const color = bgColor.value;

        // Pixel dimensions (300 DPI)
        let singleW = 413; // 35mm
        let singleH = 531; // 45mm

        if (preset === "passport-us") {
            singleW = 600; // 2 in
            singleH = 600; // 2 in
        } else if (preset === "stamp") {
            singleW = 295; // 25mm
            singleH = 354; // 30mm
        }

        const ctx = outputCanvas.getContext("2d");

        if (copies === 1) {
            outputCanvas.width = singleW;
            outputCanvas.height = singleH;

            // Fill Background
            if (color !== "keep") {
                ctx.fillStyle = color;
                ctx.fillRect(0, 0, singleW, singleH);
            }

            // Draw image cropped & centered
            const scale = Math.max(singleW / loadedImage.width, singleH / loadedImage.height);
            const x = (singleW - loadedImage.width * scale) / 2;
            const y = (singleH - loadedImage.height * scale) / 2;
            ctx.drawImage(loadedImage, x, y, loadedImage.width * scale, loadedImage.height * scale);

            // Thin border
            ctx.strokeStyle = "#cbd5e1";
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, singleW, singleH);

        } else {
            // A4 Canvas (2480 x 3508 at 300 DPI)
            const sheetW = 2480;
            const sheetH = 3508;
            outputCanvas.width = sheetW;
            outputCanvas.height = sheetH;

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, sheetW, sheetH);

            const cols = 4;
            const paddingX = 120;
            const paddingY = 160;
            const gapX = 80;
            const gapY = 80;

            for (let i = 0; i < copies; i++) {
                const row = Math.floor(i / cols);
                const col = i % cols;

                const startX = paddingX + col * (singleW + gapX);
                const startY = paddingY + row * (singleH + gapY);

                // Draw background for single photo
                if (color !== "keep") {
                    ctx.fillStyle = color;
                    ctx.fillRect(startX, startY, singleW, singleH);
                }

                // Draw image inside photo box
                const scale = Math.max(singleW / loadedImage.width, singleH / loadedImage.height);
                const x = startX + (singleW - loadedImage.width * scale) / 2;
                const y = startY + (singleH - loadedImage.height * scale) / 2;

                ctx.save();
                ctx.beginPath();
                ctx.rect(startX, startY, singleW, singleH);
                ctx.clip();
                ctx.drawImage(loadedImage, x, y, loadedImage.width * scale, loadedImage.height * scale);
                ctx.restore();

                // Cut border line
                ctx.strokeStyle = "#94a3b8";
                ctx.lineWidth = 3;
                ctx.strokeRect(startX, startY, singleW, singleH);
            }
        }

        downloadBtn.href = outputCanvas.toDataURL("image/png");
        resultsCard.style.display = "block";
        resultsCard.scrollIntoView({ behavior: "smooth" });
    });
});
