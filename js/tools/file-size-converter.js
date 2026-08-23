// ToolX Pro - File Size Converter Javascript
document.addEventListener("DOMContentLoaded", () => {
    const inputSize = document.getElementById("input-size");
    const fromSizeUnit = document.getElementById("from-size-unit");
    const sizeResultsList = document.getElementById("size-results-list");

    const sizeFactors = {
        B: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
        TB: 1024 * 1024 * 1024 * 1024,
        PB: 1024 * 1024 * 1024 * 1024 * 1024
    };

    const unitLabels = {
        B: "Bytes",
        KB: "Kilobytes",
        MB: "Megabytes",
        GB: "Gigabytes",
        TB: "Terabytes",
        PB: "Petabytes"
    };

    function calculate() {
        const size = parseFloat(inputSize.value);
        if (isNaN(size) || size < 0) {
            sizeResultsList.innerHTML = '';
            return;
        }

        const fromUnit = fromSizeUnit.value;
        const sizeInBytes = size * sizeFactors[fromUnit];

        let listHtml = "";

        for (let unit in sizeFactors) {
            const result = sizeInBytes / sizeFactors[unit];
            
            let formattedResult = "";
            if (result === 0) {
                formattedResult = "0";
            } else if (result >= 1) {
                formattedResult = result.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 4
                });
            } else {
                formattedResult = parseFloat(result.toFixed(8)).toString();
            }

            const isActive = unit === fromUnit ? "border-left: 4px solid var(--primary); background: var(--primary-glow);" : "";

            listHtml += `
                <li style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-secondary); padding:10px 15px; border-radius:8px; border:1px solid var(--border-color); ${isActive}">
                    <span>💾 ${unitLabels[unit]} (${unit})</span>
                    <b style="font-family:var(--font-en); font-size:1.05rem;">${formattedResult} ${unit}</b>
                </li>
            `;
        }

        sizeResultsList.innerHTML = listHtml;
    }

    inputSize.addEventListener("input", calculate);
    fromSizeUnit.addEventListener("change", calculate);

    calculate();
});
