// ToolX Pro - Official Bangladesh Board GPA Calculator Engine (5.00 Scale)
document.addEventListener("DOMContentLoaded", () => {
    const examTypeSelect = document.getElementById("exam-type");
    const inputModeSelect = document.getElementById("input-mode");
    const subjectsContainer = document.getElementById("subjects-container");
    const addSubjectBtn = document.getElementById("add-subject-btn");
    const calculateBtn = document.getElementById("calculate-btn");
    const resetBtn = document.getElementById("reset-btn");
    const resultsCard = document.getElementById("results");
    const resultsContent = document.getElementById("results-content");

    // Bangladeshi Board Exam Subject Databases
    const EXAM_PRESETS = {
        "ssc-science": [
            { name: "Bangla (1st & 2nd)", isOptional: false },
            { name: "English (1st & 2nd)", isOptional: false },
            { name: "Mathematics", isOptional: false },
            { name: "Physics", isOptional: false },
            { name: "Chemistry", isOptional: false },
            { name: "Biology", isOptional: false },
            { name: "Bangladesh & Global Studies (BGS)", isOptional: false },
            { name: "Religion & Moral Education", isOptional: false },
            { name: "ICT", isOptional: false },
            { name: "Higher Mathematics / Optional (4th Subject)", isOptional: true }
        ],
        "ssc-commerce": [
            { name: "Bangla (1st & 2nd)", isOptional: false },
            { name: "English (1st & 2nd)", isOptional: false },
            { name: "Mathematics", isOptional: false },
            { name: "Accounting", isOptional: false },
            { name: "Finance & Banking", isOptional: false },
            { name: "Business Entrepreneurship", isOptional: false },
            { name: "General Science", isOptional: false },
            { name: "Religion & Moral Education", isOptional: false },
            { name: "ICT", isOptional: false },
            { name: "Agriculture / Optional (4th Subject)", isOptional: true }
        ],
        "ssc-humanities": [
            { name: "Bangla (1st & 2nd)", isOptional: false },
            { name: "English (1st & 2nd)", isOptional: false },
            { name: "Mathematics", isOptional: false },
            { name: "History of Bangladesh & World Civ.", isOptional: false },
            { name: "Geography & Environment", isOptional: false },
            { name: "Civics & Citizenship", isOptional: false },
            { name: "General Science", isOptional: false },
            { name: "Religion & Moral Education", isOptional: false },
            { name: "ICT", isOptional: false },
            { name: "Economics / Agriculture (4th Subject)", isOptional: true }
        ],
        "dakhil": [
            { name: "Quran Mazid & Tajwid", isOptional: false },
            { name: "Hadith Sharif", isOptional: false },
            { name: "Arabic (1st & 2nd)", isOptional: false },
            { name: "Fiqh & Usul", isOptional: false },
            { name: "Bangla", isOptional: false },
            { name: "English", isOptional: false },
            { name: "Mathematics", isOptional: false },
            { name: "General Science / BGS", isOptional: false },
            { name: "ICT", isOptional: false },
            { name: "Optional (4th Subject)", isOptional: true }
        ],
        "hsc-science": [
            { name: "Bangla (1st & 2nd)", isOptional: false },
            { name: "English (1st & 2nd)", isOptional: false },
            { name: "Information & Comm. Technology (ICT)", isOptional: false },
            { name: "Physics (1st & 2nd)", isOptional: false },
            { name: "Chemistry (1st & 2nd)", isOptional: false },
            { name: "Higher Mathematics (1st & 2nd)", isOptional: false },
            { name: "Biology / Optional (4th Subject)", isOptional: true }
        ],
        "hsc-commerce": [
            { name: "Bangla (1st & 2nd)", isOptional: false },
            { name: "English (1st & 2nd)", isOptional: false },
            { name: "Information & Comm. Technology (ICT)", isOptional: false },
            { name: "Accounting (1st & 2nd)", isOptional: false },
            { name: "Business Organization & Mgt. (1st & 2nd)", isOptional: false },
            { name: "Finance, Banking & Insurance / Marketing", isOptional: false },
            { name: "Economics / Optional (4th Subject)", isOptional: true }
        ],
        "hsc-humanities": [
            { name: "Bangla (1st & 2nd)", isOptional: false },
            { name: "English (1st & 2nd)", isOptional: false },
            { name: "Information & Comm. Technology (ICT)", isOptional: false },
            { name: "Civics & Good Governance / Economics", isOptional: false },
            { name: "Social Work / Sociology", isOptional: false },
            { name: "Islamic History / History / Logic", isOptional: false },
            { name: "Geography / Optional (4th Subject)", isOptional: true }
        ],
        "alim": [
            { name: "Quran Mazid", isOptional: false },
            { name: "Hadith & Usul-ul-Hadith", isOptional: false },
            { name: "Al-Fiqh", isOptional: false },
            { name: "Arabic", isOptional: false },
            { name: "Bangla", isOptional: false },
            { name: "English", isOptional: false },
            { name: "ICT", isOptional: false },
            { name: "Optional (4th Subject)", isOptional: true }
        ]
    };

    const GRADE_POINTS = {
        "A+": 5.0, "A": 4.0, "A-": 3.5,
        "B": 3.0, "C": 2.0, "D": 1.0, "F": 0.0
    };

    function marksToGrade(marks) {
        if (marks >= 80) return "A+";
        if (marks >= 70) return "A";
        if (marks >= 60) return "A-";
        if (marks >= 50) return "B";
        if (marks >= 40) return "C";
        if (marks >= 33) return "D";
        return "F";
    }

    function renderSubjects() {
        const examType = examTypeSelect.value;
        const inputMode = inputModeSelect.value;
        subjectsContainer.innerHTML = '';
        
        if (examType === "custom") {
            addSubjectBtn.style.display = "inline-block";
            for (let i = 0; i < 6; i++) {
                createSubjectRow(`Subject ${i + 1}`, i === 5, i, true, inputMode);
            }
        } else {
            addSubjectBtn.style.display = "none";
            const currentList = EXAM_PRESETS[examType] || EXAM_PRESETS["ssc-science"];
            
            currentList.forEach((sub, index) => {
                createSubjectRow(sub.name, sub.isOptional, index, false, inputMode);
            });
        }
        syncOptionalHighlight();
    }

    function createSubjectRow(name, isOptional, id, isCustom, inputMode) {
        const row = document.createElement("div");
        row.className = `subject-row ${isOptional ? 'is-optional' : ''}`;
        
        const nameInputHtml = isCustom 
            ? `<input type="text" class="form-control sub-name" value="${name}" placeholder="Subject Name">`
            : `<span class="sub-name" style="font-weight:600; font-size:0.95rem; color:var(--text-primary);">${name}</span>`;

        let inputControlHtml = '';
        if (inputMode === 'marks') {
            inputControlHtml = `
                <div style="display:flex; align-items:center; gap:8px;">
                    <input type="number" class="form-control sub-marks" placeholder="Marks (0-100)" min="0" max="100" value="85" style="max-width:140px;">
                    <span class="sub-grade-badge" style="font-weight:700; color:var(--accent); font-size:0.95rem; min-width:45px;">(A+)</span>
                </div>
            `;
        } else {
            inputControlHtml = `
                <select class="form-control sub-grade" style="max-width:160px;">
                    <option value="A+" selected>A+ (5.0)</option>
                    <option value="A">A (4.0)</option>
                    <option value="A-">A- (3.5)</option>
                    <option value="B">B (3.0)</option>
                    <option value="C">C (2.0)</option>
                    <option value="D">D (1.0)</option>
                    <option value="F">F (0.0)</option>
                </select>
            `;
        }

        row.innerHTML = `
            <div style="flex: 2.2; min-width: 170px;">
                ${nameInputHtml}
            </div>
            <div style="flex: 1.5; min-width: 140px;">
                ${inputControlHtml}
            </div>
            <div style="flex: 1.1; text-align: center; display:flex; align-items:center; justify-content:flex-end;">
                <label class="radio-badge">
                    <input type="radio" name="fourth-sub-selector" class="sub-optional-radio" ${isOptional ? 'checked' : ''}>
                    <span>⭐ 4th Subject</span>
                </label>
            </div>
            ${isCustom ? `
            <div style="flex: 0.2; text-align: right;">
                <button class="btn-remove-sub" style="background:none; border:none; color:var(--danger); font-weight:bold; cursor:pointer; font-size:1.1rem;" title="Remove Subject">❌</button>
            </div>` : ''}
        `;
        
        subjectsContainer.appendChild(row);

        // Marks input live badge updater
        if (inputMode === 'marks') {
            const marksInput = row.querySelector(".sub-marks");
            const gradeBadge = row.querySelector(".sub-grade-badge");
            
            const updateBadge = () => {
                const val = parseFloat(marksInput.value) || 0;
                const g = marksToGrade(val);
                const p = GRADE_POINTS[g];
                gradeBadge.innerText = `(${g} - ${p.toFixed(1)})`;
                gradeBadge.style.color = g === "F" ? "var(--danger)" : (g === "A+" ? "var(--success)" : "var(--accent)");
            };
            marksInput.addEventListener("input", updateBadge);
            updateBadge();
        }

        // 4th subject radio click listener
        const radio = row.querySelector(".sub-optional-radio");
        radio.addEventListener("change", syncOptionalHighlight);
        
        if (isCustom) {
            row.querySelector(".btn-remove-sub").addEventListener("click", () => {
                row.remove();
                syncOptionalHighlight();
            });
        }
    }

    function syncOptionalHighlight() {
        const rows = subjectsContainer.querySelectorAll(".subject-row");
        rows.forEach(r => {
            const isOpt = r.querySelector(".sub-optional-radio").checked;
            if (isOpt) {
                r.classList.add("is-optional");
            } else {
                r.classList.remove("is-optional");
            }
        });
    }

    examTypeSelect.addEventListener("change", renderSubjects);
    inputModeSelect.addEventListener("change", renderSubjects);

    addSubjectBtn.addEventListener("click", () => {
        const count = subjectsContainer.querySelectorAll(".subject-row").length;
        createSubjectRow(`Subject ${count + 1}`, false, count, true, inputModeSelect.value);
    });

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            renderSubjects();
            resultsCard.style.display = "none";
        });
    }

    calculateBtn.addEventListener("click", () => {
        const rows = subjectsContainer.querySelectorAll(".subject-row");
        const inputMode = inputModeSelect.value;
        
        let compulsoryPointsSum = 0;
        let compulsoryCount = 0;
        let optionalPoints = 0;
        let optionalGrade = "F";
        let optionalName = "4th Subject";
        let hasFailedCompulsory = false;
        let failedSubjects = [];
        let resultsListHtml = '';

        const selectedOptionalRadio = subjectsContainer.querySelector("input[name='fourth-sub-selector']:checked");
        if (!selectedOptionalRadio && rows.length > 0) {
            alert("Please designate one subject as your 4th Subject (⭐).");
            return;
        }

        rows.forEach(row => {
            let name = "";
            const nameInput = row.querySelector("input.sub-name");
            if (nameInput) {
                name = nameInput.value.trim() || "Unnamed Subject";
            } else {
                name = row.querySelector("span.sub-name").innerText;
            }

            let grade = "F";
            let marksVal = null;

            if (inputMode === "marks") {
                const mInput = row.querySelector(".sub-marks");
                marksVal = parseFloat(mInput.value);
                if (isNaN(marksVal) || marksVal < 0) marksVal = 0;
                if (marksVal > 100) marksVal = 100;
                grade = marksToGrade(marksVal);
            } else {
                grade = row.querySelector(".sub-grade").value;
            }

            const points = GRADE_POINTS[grade];
            const isOptional = row.querySelector(".sub-optional-radio").checked;
            const marksDisplay = marksVal !== null ? `<span style="font-size:0.85rem; color:var(--text-secondary); margin-right:8px;">${marksVal}/100</span>` : '';

            if (isOptional) {
                optionalPoints = points;
                optionalGrade = grade;
                optionalName = name;
                resultsListHtml += `
                    <li style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--primary-glow); border-radius:6px; margin:4px 0; border:1px dashed var(--accent);">
                        <span>⭐ <b>${name}</b> (4th Subject)</span>
                        <div>${marksDisplay}<b style="color:var(--accent); font-size:1.05rem;">${grade} (${points.toFixed(2)})</b></div>
                    </li>
                `;
            } else {
                compulsoryPointsSum += points;
                compulsoryCount++;
                
                if (points === 0) {
                    hasFailedCompulsory = true;
                    failedSubjects.push(name);
                }

                resultsListHtml += `
                    <li style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-color);">
                        <span style="color:var(--text-primary);">${name}</span>
                        <div>${marksDisplay}<b style="color:${points === 0 ? 'var(--danger)' : (points === 5 ? 'var(--success)' : 'var(--text-primary)')}; font-size:1.02rem;">${grade} (${points.toFixed(2)})</b></div>
                    </li>
                `;
            }
        });

        if (compulsoryCount === 0) {
            alert("Please include at least one compulsory subject.");
            return;
        }

        let finalGpa = 0.0;
        let gradeLetter = "F";
        let statusText = "";
        let statusColor = "";
        let bonusPoints = Math.max(0, optionalPoints - 2.0);

        if (hasFailedCompulsory) {
            finalGpa = 0.0;
            gradeLetter = "F";
            statusText = `Failed (Failed in ${failedSubjects.join(", ")})`;
            statusColor = "var(--danger)";
        } else {
            const totalScore = compulsoryPointsSum + bonusPoints;
            finalGpa = totalScore / compulsoryCount;
            
            if (finalGpa >= 5.0) {
                finalGpa = 5.0;
                gradeLetter = "A+";
                statusText = "Golden / Passed A+ (GPA 5.00)";
                statusColor = "var(--success)";
            } else if (finalGpa >= 4.0) {
                gradeLetter = "A";
                statusText = "Passed with Grade A";
                statusColor = "var(--accent)";
            } else if (finalGpa >= 3.5) {
                gradeLetter = "A-";
                statusText = "Passed with Grade A-";
                statusColor = "var(--accent)";
            } else if (finalGpa >= 3.0) {
                gradeLetter = "B";
                statusText = "Passed with Grade B";
                statusColor = "var(--text-primary)";
            } else if (finalGpa >= 2.0) {
                gradeLetter = "C";
                statusText = "Passed with Grade C";
                statusColor = "var(--text-secondary)";
            } else if (finalGpa >= 1.0) {
                gradeLetter = "D";
                statusText = "Passed with Grade D";
                statusColor = "var(--warning)";
            } else {
                gradeLetter = "F";
                statusText = "Failed";
                statusColor = "var(--danger)";
            }
        }

        resultsContent.innerHTML = `
            <div style="text-align:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1.2rem;">
                <span style="font-size:0.95rem; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Official Bangladesh Board GPA</span>
                <div style="display:flex; align-items:center; justify-content:center; gap:15px; margin:8px 0;">
                    <h3 style="font-size:3rem; font-weight:800; color:${statusColor}; line-height:1; font-family:var(--font-header);">
                        ${finalGpa.toFixed(2)}
                    </h3>
                    <span style="font-size:1.8rem; font-weight:800; background:${statusColor}; color:#fff; padding:4px 16px; border-radius:12px; font-family:var(--font-header);">
                        ${gradeLetter}
                    </span>
                </div>
                <span style="color:${statusColor}; font-weight:700; font-size:1.05rem;">
                    ${statusText}
                </span>
            </div>

            <!-- Calculation Breakdown Grid -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:10px; margin-bottom:1.5rem; background:var(--bg-secondary); padding:14px; border-radius:10px; border:1px solid var(--border-color); font-size:0.92rem;">
                <div>
                    <span style="color:var(--text-secondary); display:block;">Compulsory Subjects:</span>
                    <strong>${compulsoryCount} Subjects</strong>
                </div>
                <div>
                    <span style="color:var(--text-secondary); display:block;">Compulsory GP Sum:</span>
                    <strong>${compulsoryPointsSum.toFixed(2)} pts</strong>
                </div>
                <div>
                    <span style="color:var(--text-secondary); display:block;">4th Subject Bonus:</span>
                    <strong style="color:var(--accent);">+${bonusPoints.toFixed(2)} pts</strong>
                </div>
                <div>
                    <span style="color:var(--text-secondary); display:block;">Total Effective Points:</span>
                    <strong>${(compulsoryPointsSum + bonusPoints).toFixed(2)} / ${compulsoryCount}</strong>
                </div>
            </div>

            <div>
                <h4 style="font-size:1rem; font-weight:700; border-bottom:1px solid var(--border-color); padding-bottom:6px; margin-bottom:10px; color:var(--text-primary);">
                    📋 Subject-wise Result Breakdown:
                </h4>
                <ul style="list-style:none; padding-left:0;">
                    ${resultsListHtml}
                </ul>
            </div>
            
            <div style="margin-top:1.5rem; background:var(--primary-glow); border-left:4px solid var(--accent); padding:12px 14px; border-radius:8px; font-size:0.88rem; color:var(--text-primary); line-height:1.5;">
                💡 <strong>How Bonus Was Calculated:</strong> 4th Subject (${optionalName}) earned Grade <b>${optionalGrade} (${optionalPoints.toFixed(2)})</b>. Points over 2.00: <code>Math.max(0, ${optionalPoints.toFixed(2)} - 2.00) = ${bonusPoints.toFixed(2)} bonus points</code> added to the total points.
            </div>
        `;

        resultsCard.style.display = "block";
        resultsCard.scrollIntoView({ behavior: 'smooth' });
    });

    renderSubjects();
});
