// ToolX Pro - Advanced Digital Data & File Size Converter Engine
document.addEventListener("DOMContentLoaded", () => {
    const inputSize = document.getElementById("input-size");
    const fromSizeUnit = document.getElementById("from-size-unit");
    const standardType = document.getElementById("standard-type");
    const sizeResultsGrid = document.getElementById("size-results-grid");
    const speedInput = document.getElementById("speed-input");
    const speedUnit = document.getElementById("speed-unit");
    const downloadTimeResult = document.getElementById("download-time-result");

    // Standard definitions (Bits & Bytes)
    // Binary Standard (Base 2: 1024)
    const BINARY_UNITS = [
        { id: "b", name: "Bits", symbol: "b", factor: 0.125, isBit: true },
        { id: "B", name: "Bytes", symbol: "B", factor: 1, isBit: false },
        { id: "KB", name: "Kilobytes (KiB/KB)", symbol: "KB", factor: 1024, isBit: false },
        { id: "MB", name: "Megabytes (MiB/MB)", symbol: "MB", factor: 1024 ** 2, isBit: false },
        { id: "GB", name: "Gigabytes (GiB/GB)", symbol: "GB", factor: 1024 ** 3, isBit: false },
        { id: "TB", name: "Terabytes (TiB/TB)", symbol: "TB", factor: 1024 ** 4, isBit: false },
        { id: "PB", name: "Petabytes (PiB/PB)", symbol: "PB", factor: 1024 ** 5, isBit: false }
    ];

    // Decimal Standard (Base 10: 1000 - SI standard used by Storage Manufacturers)
    const DECIMAL_UNITS = [
        { id: "b", name: "Bits", symbol: "b", factor: 0.125, isBit: true },
        { id: "B", name: "Bytes", symbol: "B", factor: 1, isBit: false },
        { id: "KB", name: "Kilobytes (KB)", symbol: "KB", factor: 1000, isBit: false },
        { id: "MB", name: "Megabytes (MB)", symbol: "MB", factor: 1000 ** 2, isBit: false },
        { id: "GB", name: "Gigabytes (GB)", symbol: "GB", factor: 1000 ** 3, isBit: false },
        { id: "TB", name: "Terabytes (TB)", symbol: "TB", factor: 1000 ** 4, isBit: false },
        { id: "PB", name: "Petabytes (PB)", symbol: "PB", factor: 1000 ** 5, isBit: false }
    ];

    function formatNumber(num) {
        if (num === 0) return "0";
        if (num >= 1000000000) {
            return num.toExponential(4);
        }
        if (num >= 1) {
            return num.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 4
            });
        }
        if (num < 0.000001) {
            return num.toExponential(4);
        }
        return parseFloat(num.toFixed(6)).toString();
    }

    function calculate() {
        const val = parseFloat(inputSize.value);
        if (isNaN(val) || val < 0) {
            sizeResultsGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:1.5rem; color:var(--text-secondary);">Please enter a valid positive number.</div>';
            if (downloadTimeResult) downloadTimeResult.textContent = "--";
            return;
        }

        const isDecimal = standardType && standardType.value === "decimal";
        const units = isDecimal ? DECIMAL_UNITS : BINARY_UNITS;
        const fromKey = fromSizeUnit.value;
        const currentUnitObj = units.find(u => u.id === fromKey) || units[3]; // default MB

        // Convert input value to total bytes
        const totalBytes = val * currentUnitObj.factor;

        let cardsHtml = "";

        units.forEach(u => {
            const convertedVal = totalBytes / u.factor;
            const formatted = formatNumber(convertedVal);
            const isSelected = u.id === fromKey;
            const cardClass = isSelected ? "unit-card active" : "unit-card";

            cardsHtml += `
                <div class="${cardClass}">
                    <div class="unit-card-header">
                        <span class="unit-badge">${u.symbol}</span>
                        <span class="unit-name">${u.name}</span>
                    </div>
                    <div class="unit-value-row">
                        <span class="unit-val" title="${convertedVal}">${formatted}</span>
                        <button type="button" class="btn-copy-unit" data-copy="${convertedVal}" title="Copy Exact Value">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        });

        sizeResultsGrid.innerHTML = cardsHtml;

        // Attach copy events
        sizeResultsGrid.querySelectorAll(".btn-copy-unit").forEach(btn => {
            btn.addEventListener("click", () => {
                const textToCopy = btn.getAttribute("data-copy");
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalHtml = btn.innerHTML;
                    btn.innerHTML = '✓';
                    btn.style.color = 'var(--success)';
                    setTimeout(() => {
                        btn.innerHTML = originalHtml;
                        btn.style.color = '';
                    }, 1500);
                });
            });
        });

        // Calculate download time estimation
        updateDownloadTime(totalBytes);
    }

    function updateDownloadTime(bytes) {
        if (!speedInput || !speedUnit || !downloadTimeResult) return;
        const speed = parseFloat(speedInput.value);
        if (isNaN(speed) || speed <= 0) {
            downloadTimeResult.textContent = "--";
            return;
        }

        // Speed conversion to Bytes per second
        // 1 Mbps = 1,000,000 bits / 8 = 125,000 Bytes/sec
        // 1 MB/s = 1,000,000 Bytes/sec
        let bytesPerSec = 0;
        if (speedUnit.value === "mbps") {
            bytesPerSec = (speed * 1000000) / 8;
        } else if (speedUnit.value === "kbps") {
            bytesPerSec = (speed * 1000) / 8;
        } else if (speedUnit.value === "mb_s") {
            bytesPerSec = speed * 1024 * 1024;
        } else if (speedUnit.value === "gbps") {
            bytesPerSec = (speed * 1000000000) / 8;
        }

        if (bytesPerSec <= 0) {
            downloadTimeResult.textContent = "--";
            return;
        }

        const totalSeconds = bytes / bytesPerSec;

        if (totalSeconds < 1) {
            downloadTimeResult.textContent = "Instant (< 1 second) ⚡";
        } else if (totalSeconds < 60) {
            downloadTimeResult.textContent = `${Math.ceil(totalSeconds)} seconds`;
        } else if (totalSeconds < 3600) {
            const mins = Math.floor(totalSeconds / 60);
            const secs = Math.ceil(totalSeconds % 60);
            downloadTimeResult.textContent = `${mins} min ${secs} sec`;
        } else if (totalSeconds < 86400) {
            const hrs = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            downloadTimeResult.textContent = `${hrs} hr ${mins} min`;
        } else {
            const days = Math.floor(totalSeconds / 86400);
            const hrs = Math.floor((totalSeconds % 86400) / 3600);
            downloadTimeResult.textContent = `${days} days ${hrs} hr`;
        }
    }

    inputSize.addEventListener("input", calculate);
    fromSizeUnit.addEventListener("change", calculate);
    if (standardType) standardType.addEventListener("change", calculate);
    if (speedInput) speedInput.addEventListener("input", calculate);
    if (speedUnit) speedUnit.addEventListener("change", calculate);

    calculate();
});
