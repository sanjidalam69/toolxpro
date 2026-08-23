// ToolX Pro - BD University CGPA & GPA Calculator Engine (UGC Standard 4.00 Scale)
document.addEventListener("DOMContentLoaded", () => {
    const cgpaModeSelect = document.getElementById("cgpa-mode");
    const universityPresetSelect = document.getElementById("university-preset");
    const entriesContainer = document.getElementById("entries-container");
    const addEntryBtn = document.getElementById("add-entry-btn");
    const calculateBtn = document.getElementById("calculate-btn");
    const resetBtn = document.getElementById("reset-btn");
    const resultsCard = document.getElementById("results");
    const resultsContent = document.getElementById("results-content");
    const colHeaderName = document.getElementById("col-header-name");
    const colHeaderGrade = document.getElementById("col-header-grade");

    // UGC Standard Grade Scale
    const UGC_GRADES = [
        { grade: "A+", gp: 4.00, desc: "80% & above" },
        { grade: "A", gp: 3.75, desc: "75% to <80%" },
        { grade: "A-", gp: 3.50, desc: "70% to <75%" },
        { grade: "B+", gp: 3.25, desc: "65% to <70%" },
        { grade: "B", gp: 3.00, desc: "60% to <65%" },
        { grade: "B-", gp: 2.75, desc: "55% to <60%" },
        { grade: "C+", gp: 2.50, desc: "50% to <55%" },
        { grade: "C", gp: 2.25, desc: "45% to <50%" },
        { grade: "D", gp: 2.00, desc: "40% to <45%" },
        { grade: "F", gp: 0.00, desc: "Less than 40%" }
    ];

    function renderEntries() {
        const mode = cgpaModeSelect.value;
        entriesContainer.innerHTML = '';
        const defaultCount = mode === "semester" ? 8 : 5;
        
        if (mode === "semester") {
            colHeaderName.innerText = "Semester Title";
            colHeaderGrade.innerText = "Semester GPA";
        } else {
            colHeaderName.innerText = "Course / Subject Name";
            colHeaderGrade.innerText = "Letter Grade";
        }

        for (let i = 0; i < defaultCount; i++) {
            createEntryRow(i);
        }
    }

    function createEntryRow(index) {
        const mode = cgpaModeSelect.value;
        const preset = universityPresetSelect.value;
        const row = document.createElement("div");
        row.className = "entry-row";
        
        const labelText = mode === "semester" ? `Semester ${index + 1}` : `Course ${index + 1}`;
        const defaultCredits = mode === "semester" ? "15" : "3.0";

        let gradeInputHtml = '';
        if (mode === "semester" || preset === "custom-scale") {
            gradeInputHtml = `
                <input type="number" class="form-control entry-gpa" placeholder="GPA (0.00 - 4.00)" min="0.0" max="4.0" step="0.01" value="${mode === 'semester' ? '3.75' : '4.00'}">
            `;
        } else {
            let optionsHtml = '';
            UGC_GRADES.forEach(g => {
                optionsHtml += `<option value="${g.gp}" ${g.grade === 'A' ? 'selected' : ''}>${g.grade} (${g.gp.toFixed(2)}) - ${g.desc}</option>`;
            });
            gradeInputHtml = `
                <select class="form-control entry-grade-select">
                    ${optionsHtml}
                </select>
            `;
        }

        row.innerHTML = `
            <div style="flex: 2.2; min-width: 140px;">
                <input type="text" class="form-control entry-name" value="${labelText}" placeholder="Title">
            </div>
            <div style="flex: 1.2; min-width: 100px;">
                <input type="number" class="form-control entry-credits" placeholder="Credits" min="0.5" max="30" step="0.5" value="${defaultCredits}" required>
            </div>
            <div style="flex: 1.8; min-width: 140px;">
                ${gradeInputHtml}
            </div>
            <div style="flex: 0.3; text-align: right;">
                <button class="btn-remove-entry" style="background:none; border:none; color:var(--danger); font-weight:bold; cursor:pointer; font-size:1.1rem;" title="Remove Row">❌</button>
            </div>
        `;
        
        entriesContainer.appendChild(row);
        
        row.querySelector(".btn-remove-entry").addEventListener("click", () => {
            row.remove();
        });
    }

    cgpaModeSelect.addEventListener("change", renderEntries);
    universityPresetSelect.addEventListener("change", renderEntries);

    addEntryBtn.addEventListener("click", () => {
        const currentCount = entriesContainer.querySelectorAll(".entry-row").length;
        createEntryRow(currentCount);
    });

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            renderEntries();
            resultsCard.style.display = "none";
        });
    }

    calculateBtn.addEventListener("click", () => {
        const rows = entriesContainer.querySelectorAll(".entry-row");
        const mode = cgpaModeSelect.value;
        const preset = universityPresetSelect.value;

        let totalCredits = 0;
        let weightedPointsSum = 0;
        let hasError = false;
        let breakDownListHtml = '';

        rows.forEach(row => {
            const name = row.querySelector(".entry-name").value.trim() || "Item";
            const creditsVal = row.querySelector(".entry-credits").value;
            let gp = 0;

            if (mode === "semester" || preset === "custom-scale") {
                const gpaInput = row.querySelector(".entry-gpa");
                gp = parseFloat(gpaInput ? gpaInput.value : 0);
            } else {
                const gradeSelect = row.querySelector(".entry-grade-select");
                gp = parseFloat(gradeSelect ? gradeSelect.value : 0);
            }

            const credits = parseFloat(creditsVal);

            if (isNaN(credits) || isNaN(gp) || credits <= 0 || gp < 0 || gp > 4.00) {
                hasError = true;
                return;
            }

            const qualityPoints = gp * credits;
            totalCredits += credits;
            weightedPointsSum += qualityPoints;

            // Find letter grade name if available
            let gradeLabel = gp.toFixed(2);
            const foundGrade = UGC_GRADES.find(g => Math.abs(g.gp - gp) < 0.01);
            if (foundGrade) {
                gradeLabel = `${foundGrade.grade} (${gp.toFixed(2)})`;
            }

            breakDownListHtml += `
                <li style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-color); font-size:0.92rem;">
                    <span><b>${name}</b> (${credits} Credits)</span>
                    <span>Grade: <b>${gradeLabel}</b> $\\rightarrow$ <span style="color:var(--accent); font-weight:700;">${qualityPoints.toFixed(2)} QP</span></span>
                </li>
            `;
        });

        if (hasError) {
            alert("Please ensure all credits (> 0) and GPA/GP values (0.00 to 4.00) are valid.");
            return;
        }

        if (totalCredits === 0) {
            alert("Please add at least one course/semester row.");
            return;
        }

        const finalScore = weightedPointsSum / totalCredits;
        
        let divisionClass = "";
        let color = "";
        let badgeText = "";

        if (finalScore >= 3.75) {
            divisionClass = "First Class with Distinction (Outstanding)";
            badgeText = "A+ / Outstanding";
            color = "var(--success)";
        } else if (finalScore >= 3.00) {
            divisionClass = "First Class Equivalent (CGPA ≥ 3.00)";
            badgeText = "First Class";
            color = "var(--accent)";
        } else if (finalScore >= 2.25) {
            divisionClass = "Second Class Equivalent (CGPA 2.25 – 2.99)";
            badgeText = "Second Class";
            color = "var(--text-primary)";
        } else if (finalScore >= 2.00) {
            divisionClass = "Third Class / Pass (CGPA 2.00 – 2.24)";
            badgeText = "Third Class / Pass";
            color = "var(--warning)";
        } else {
            divisionClass = "Fail / Below Passing Standard (Academic Probation)";
            badgeText = "Fail (F)";
            color = "var(--danger)";
        }

        resultsContent.innerHTML = `
            <div style="text-align:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1.2rem;">
                <span style="font-size:0.95rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">
                    ${mode === "semester" ? "Cumulative CGPA Result (4.00 Scale)" : "Semester GPA Result (4.00 Scale)"}
                </span>
                <div style="display:flex; align-items:center; justify-content:center; gap:15px; margin:8px 0;">
                    <h3 style="font-size:3.2rem; font-weight:800; color:${color}; line-height:1; font-family:var(--font-header);">
                        ${finalScore.toFixed(2)}
                    </h3>
                </div>
                <span style="background:${color}; color:#fff; padding:4px 16px; border-radius:20px; font-weight:700; font-size:0.95rem; display:inline-block; margin-top:4px;">
                    ${divisionClass}
                </span>
            </div>

            <!-- Stats Grid -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-bottom:1.5rem; background:var(--bg-secondary); padding:14px; border-radius:10px; border:1px solid var(--border-color); font-size:0.92rem;">
                <div>
                    <span style="color:var(--text-secondary); display:block;">Total Credits:</span>
                    <strong>${totalCredits.toFixed(1)} Credits</strong>
                </div>
                <div>
                    <span style="color:var(--text-secondary); display:block;">Total Quality Points (QP):</span>
                    <strong>${weightedPointsSum.toFixed(2)} pts</strong>
                </div>
                <div>
                    <span style="color:var(--text-secondary); display:block;">UGC Class Standing:</span>
                    <strong style="color:${color};">${badgeText}</strong>
                </div>
                <div>
                    <span style="color:var(--text-secondary); display:block;">Calculated Weighted Formula:</span>
                    <code>${weightedPointsSum.toFixed(2)} / ${totalCredits.toFixed(1)}</code>
                </div>
            </div>

            <div>
                <h4 style="font-size:1rem; font-weight:700; border-bottom:1px solid var(--border-color); padding-bottom:6px; margin-bottom:10px; color:var(--text-primary);">
                    📋 Course / Term Breakdown:
                </h4>
                <ul style="list-style:none; padding-left:0;">
                    ${breakDownListHtml}
                </ul>
            </div>

            <div style="margin-top:1.5rem; background:var(--primary-glow); border-left:4px solid var(--accent); padding:12px 14px; border-radius:8px; font-size:0.88rem; color:var(--text-primary); line-height:1.5;">
                💡 <strong>UGC Weighted CGPA Formula:</strong> <code>CGPA = Σ(Course Credit × Grade Point) / Total Credits Completed</code>. Quality points are calculated by multiplying each course's credit hours by the grade point earned.
            </div>
        `;

        resultsCard.style.display = "block";
        resultsCard.scrollIntoView({ behavior: 'smooth' });
    });

    renderEntries();
});
