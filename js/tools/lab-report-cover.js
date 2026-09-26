document.addEventListener("DOMContentLoaded", () => {

    // ── Input DOM Elements ─────────────────────────────────────────────
    const inpColor          = document.getElementById("inp-color");
    const inpFont           = document.getElementById("inp-font");
    const presetUni         = document.getElementById("preset-uni");
    const inpUniName        = document.getElementById("inp-uni-name");
    const inpDeptName       = document.getElementById("inp-dept-name");
    const inpLogoFile       = document.getElementById("inp-logo-file");
    const btnResetLogo      = document.getElementById("btn-reset-logo");

    const inpCourseTitle    = document.getElementById("inp-course-title");
    const inpCourseCode     = document.getElementById("inp-course-code");
    const inpExpNo          = document.getElementById("inp-exp-no");
    const inpExpName        = document.getElementById("inp-exp-name");
    const inpDatePerform    = document.getElementById("inp-date-perform");
    const inpDateSubmit     = document.getElementById("inp-date-submit");

    const inpStudentName    = document.getElementById("inp-student-name");
    const inpStudentId      = document.getElementById("inp-student-id");
    const inpStudentSection = document.getElementById("inp-student-section");
    const inpStudentBatch   = document.getElementById("inp-student-batch");
    const inpStudentGroup   = document.getElementById("inp-student-group");

    const inpTeacherName    = document.getElementById("inp-teacher-name");
    const inpTeacherDesig   = document.getElementById("inp-teacher-desig");
    const inpTeacherDept    = document.getElementById("inp-teacher-dept");

    const toggleEvalBox     = document.getElementById("toggle-eval-box");

    const previewContainer  = document.getElementById("a4-preview");
    const previewOuter      = document.getElementById("preview-outer-container");

    const btnDlPdf          = document.getElementById("btn-download-pdf");
    const btnDlPng          = document.getElementById("btn-download-png");
    const btnDirectPrint    = document.getElementById("btn-direct-print");

    // Mobile Navigation Switchers
    const generatorGrid     = document.getElementById("generator-grid");
    const tabBtnEdit        = document.getElementById("tab-btn-edit");
    const tabBtnPreview     = document.getElementById("tab-btn-preview");

    // Zoom Buttons
    const zoomBtns          = document.querySelectorAll(".zoom-btn");

    let currentTemplate = "eng-border";
    let currentScale = "auto";

    // Default SVG Crest Logo
    const defaultLogo = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='46' fill='%231e3a8a'/%3E%3Ccircle cx='50' cy='50' r='40' fill='%23ffffff'/%3E%3Cpath d='M50 20 L65 42 L35 42 Z' fill='%231e3a8a'/%3E%3Crect x='44' y='42' width='12' height='26' fill='%231e3a8a'/%3E%3Cpath d='M30 68 L70 68 L64 76 L36 76 Z' fill='%231e3a8a'/%3E%3Ctext x='50' y='92' font-size='8' font-weight='bold' text-anchor='middle' fill='%231e3a8a' font-family='serif'%3EEXCELLENCE%3C/text%3E%3C/svg%3E";

    let activeLogo = defaultLogo;

    // University Presets Database
    const UNI_PRESETS = {
        custom: {
            name: "SOUTHEAST UNIVERSITY",
            dept: "Department of Computer Science & Engineering",
            color: "#1e3a8a",
            logo: defaultLogo
        },
        seu: {
            name: "SOUTHEAST UNIVERSITY",
            dept: "Department of Computer Science & Engineering",
            color: "#1e3a8a",
            logo: defaultLogo
        },
        buet: {
            name: "BANGLADESH UNIVERSITY OF ENGINEERING AND TECHNOLOGY",
            dept: "Department of Computer Science and Engineering",
            color: "#991b1b",
            logo: defaultLogo
        },
        du: {
            name: "UNIVERSITY OF DHAKA",
            dept: "Department of Computer Science & Engineering",
            color: "#1e3a8a",
            logo: defaultLogo
        },
        nu: {
            name: "NATIONAL UNIVERSITY, BANGLADESH",
            dept: "Department of Computer Science",
            color: "#059669",
            logo: defaultLogo
        },
        nsu: {
            name: "NORTH SOUTH UNIVERSITY",
            dept: "Department of Electrical & Computer Engineering",
            color: "#1e3a8a",
            logo: defaultLogo
        },
        brac: {
            name: "BRAC UNIVERSITY",
            dept: "Department of Computer Science and Engineering",
            color: "#0284c7",
            logo: defaultLogo
        },
        aiub: {
            name: "AMERICAN INTERNATIONAL UNIVERSITY-BANGLADESH",
            dept: "Faculty of Science & Information Technology",
            color: "#1e3a8a",
            logo: defaultLogo
        },
        aust: {
            name: "AHSANULLAH UNIVERSITY OF SCIENCE AND TECHNOLOGY",
            dept: "Department of Computer Science and Engineering",
            color: "#991b1b",
            logo: defaultLogo
        },
        diu: {
            name: "DAFFODIL INTERNATIONAL UNIVERSITY",
            dept: "Department of Software Engineering",
            color: "#059669",
            logo: defaultLogo
        }
    };

    // ── University Preset Change Handler ───────────────────────────────
    if (presetUni) {
        presetUni.addEventListener("change", () => {
            const val = presetUni.value;
            if (UNI_PRESETS[val]) {
                const p = UNI_PRESETS[val];
                if (inpUniName) inpUniName.value = p.name;
                if (inpDeptName) inpDeptName.value = p.dept;
                if (inpTeacherDept) inpTeacherDept.value = p.dept;
                if (inpColor && p.color) inpColor.value = p.color;
                activeLogo = p.logo;
                renderPreview();
            }
        });
    }

    // ── Logo File Upload Handler ───────────────────────────────────────
    if (inpLogoFile) {
        inpLogoFile.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    activeLogo = event.target.result;
                    renderPreview();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (btnResetLogo) {
        btnResetLogo.addEventListener("click", () => {
            activeLogo = defaultLogo;
            if (inpLogoFile) inpLogoFile.value = "";
            renderPreview();
        });
    }

    // ── Template Picker Handlers ───────────────────────────────────────
    const tplBtns = document.querySelectorAll(".tpl-btn");
    tplBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tplBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTemplate = btn.getAttribute("data-tpl");
            renderPreview();
        });
    });

    // ── Real-time Input Listeners ──────────────────────────────────────
    const allInputs = [
        inpColor, inpFont, inpUniName, inpDeptName,
        inpCourseTitle, inpCourseCode, inpExpNo, inpExpName,
        inpDatePerform, inpDateSubmit,
        inpStudentName, inpStudentId, inpStudentSection, inpStudentBatch, inpStudentGroup,
        inpTeacherName, inpTeacherDesig, inpTeacherDept,
        toggleEvalBox
    ];

    allInputs.forEach(input => {
        if (input) {
            input.addEventListener("input", renderPreview);
            input.addEventListener("change", renderPreview);
        }
    });

    // ── Zoom Control Handlers ──────────────────────────────────────────
    zoomBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            zoomBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentScale = btn.getAttribute("data-scale");
            updatePreviewScale();
        });
    });

    // ── Mobile Tab Switchers ───────────────────────────────────────────
    if (tabBtnEdit && tabBtnPreview && generatorGrid) {
        tabBtnEdit.addEventListener("click", () => {
            tabBtnEdit.classList.add("active");
            tabBtnPreview.classList.remove("active");
            generatorGrid.classList.remove("view-preview");
            generatorGrid.classList.add("view-edit");
        });

        tabBtnPreview.addEventListener("click", () => {
            tabBtnPreview.classList.add("active");
            tabBtnEdit.classList.remove("active");
            generatorGrid.classList.remove("view-edit");
            generatorGrid.classList.add("view-preview");
            updatePreviewScale();
        });
    }

    // ── Responsive Scale Calculation ───────────────────────────────────
    function updatePreviewScale() {
        if (!previewContainer || !previewOuter) return;

        let scale = 1;
        if (currentScale === "auto") {
            const containerWidth = previewOuter.clientWidth - 48; // padding offset
            scale = Math.min(1, Math.max(0.35, containerWidth / 794));
        } else {
            scale = parseFloat(currentScale) || 1;
        }

        previewContainer.style.transform = `scale(${scale})`;
        
        // Adjust outer container height to prevent overflow clipping
        const renderedHeight = 1123 * scale;
        previewOuter.style.minHeight = `${renderedHeight + 40}px`;
    }

    window.addEventListener("resize", updatePreviewScale);

    // ── Render Template HTML ───────────────────────────────────────────
    function renderPreview() {
        if (!previewContainer) return;

        const color = inpColor ? inpColor.value : "#1e3a8a";
        const font = inpFont ? inpFont.value : "'Times New Roman', Times, serif";

        const uni = (inpUniName ? inpUniName.value.trim() : "") || "UNIVERSITY NAME";
        const dept = (inpDeptName ? inpDeptName.value.trim() : "") || "Department of Computer Science & Engineering";

        const courseTitle = (inpCourseTitle ? inpCourseTitle.value.trim() : "") || "Laboratory Course Title";
        const courseCode = (inpCourseCode ? inpCourseCode.value.trim() : "") || "CSE 2102";
        const expNo = (inpExpNo ? inpExpNo.value.trim() : "") || "01";
        const expName = (inpExpName ? inpExpName.value.trim() : "") || "Title / Name of the Experiment";
        const datePerform = (inpDatePerform ? inpDatePerform.value.trim() : "") || "DD Month, YYYY";
        const dateSubmit = (inpDateSubmit ? inpDateSubmit.value.trim() : "") || "DD Month, YYYY";

        const sName = (inpStudentName ? inpStudentName.value.trim() : "") || "Student Name";
        const sId = (inpStudentId ? inpStudentId.value.trim() : "") || "2022000000001";
        const sSec = (inpStudentSection ? inpStudentSection.value.trim() : "") || "01 (A)";
        const sBatch = (inpStudentBatch ? inpStudentBatch.value.trim() : "") || "56th Batch";
        const sGroup = inpStudentGroup ? inpStudentGroup.value.trim() : "";

        const tName = (inpTeacherName ? inpTeacherName.value.trim() : "") || "Faculty Name";
        const tDesig = (inpTeacherDesig ? inpTeacherDesig.value.trim() : "") || "Assistant Professor";
        const tDept = (inpTeacherDept ? inpTeacherDept.value.trim() : "") || dept;

        const showEval = toggleEvalBox ? toggleEvalBox.checked : true;

        previewContainer.style.setProperty("--t-color", color);
        previewContainer.style.fontFamily = font;
        previewContainer.className = `tpl-${currentTemplate}`;

        // Build HTML according to selected template
        let html = "";

        // Standard Evaluation Box Component
        const evalBoxHtml = showEval ? `
            <div style="margin-top: 15px; border: 1.5px solid ${color}; border-radius: 6px; overflow: hidden; font-size: 12px; background: rgba(0,0,0,0.01);">
                <div style="background: ${color}; color: #ffffff; padding: 5px 12px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
                    Faculty Evaluation & Grading Rubric
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 0; border-bottom: 1px solid ${color};">
                    <div style="padding: 6px 10px; border-right: 1px solid ${color};">
                        <strong>Lab Performance:</strong> [ &nbsp; &nbsp; / 05 ]
                    </div>
                    <div style="padding: 6px 10px; border-right: 1px solid ${color};">
                        <strong>Report Quality:</strong> [ &nbsp; &nbsp; / 05 ]
                    </div>
                    <div style="padding: 6px 10px; background: rgba(0,0,0,0.03);">
                        <strong>Total Marks:</strong> [ &nbsp; &nbsp; / 10 ]
                    </div>
                </div>
                <div style="padding: 8px 12px; display: flex; justify-content: space-between; align-items: flex-end;">
                    <div><strong>Remarks:</strong> ____________________________</div>
                    <div><strong>Signature & Date:</strong> ____________________________</div>
                </div>
            </div>
        ` : "";

        // Common Student Info Rows
        const studentInfoHtml = `
            <div class="lab-field-row"><span class="f-label">Name</span><span class="f-colon">:</span><span class="f-val"><strong>${sName}</strong></span></div>
            <div class="lab-field-row"><span class="f-label">Student ID</span><span class="f-colon">:</span><span class="f-val"><strong>${sId}</strong></span></div>
            <div class="lab-field-row"><span class="f-label">Section</span><span class="f-colon">:</span><span class="f-val">${sSec}</span></div>
            <div class="lab-field-row"><span class="f-label">Batch / Sem</span><span class="f-colon">:</span><span class="f-val">${sBatch}</span></div>
            ${sGroup ? `<div class="lab-field-row"><span class="f-label">Group/Roll</span><span class="f-colon">:</span><span class="f-val">${sGroup}</span></div>` : ""}
        `;

        // Common Teacher Info Rows
        const teacherInfoHtml = `
            <div class="lab-field-row"><span class="f-label">Instructor</span><span class="f-colon">:</span><span class="f-val"><strong>${tName}</strong></span></div>
            <div class="lab-field-row"><span class="f-label">Designation</span><span class="f-colon">:</span><span class="f-val">${tDesig}</span></div>
            <div class="lab-field-row"><span class="f-label">Department</span><span class="f-colon">:</span><span class="f-val">${tDept}</span></div>
            <div class="lab-field-row"><span class="f-label">Institution</span><span class="f-colon">:</span><span class="f-val">${uni}</span></div>
        `;

        // Render Templates
        if (currentTemplate === "eng-border") {
            html = `
                <div class="inner-border"></div>
                <div style="text-align: center; margin-top: 10px;">
                    <img src="${activeLogo}" style="max-height: 80px; max-width: 90px; object-fit: contain; margin-bottom: 10px;" alt="Logo">
                    <h1 style="font-size: 22px; font-weight: 900; color: ${color}; text-transform: uppercase; margin: 0 0 4px 0; letter-spacing: 0.5px;">${uni}</h1>
                    <h2 style="font-size: 14px; font-weight: 700; color: #475569; margin: 0; text-transform: uppercase;">${dept}</h2>
                </div>

                <div style="text-align: center; margin: 15px 0;">
                    <div style="display: inline-block; background: ${color}; color: #ffffff; padding: 6px 36px; border-radius: 4px; font-size: 16px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                        LABORATORY REPORT
                    </div>
                </div>

                <!-- Experiment Meta Card -->
                <div style="border: 2px solid ${color}; border-radius: 8px; padding: 16px 20px; background: rgba(0,0,0,0.015); margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; border-bottom: 1.5px solid rgba(0,0,0,0.1); padding-bottom: 8px; margin-bottom: 10px;">
                        <div><strong style="color:${color};">Course Title:</strong> ${courseTitle}</div>
                        <div><strong style="color:${color};">Course Code:</strong> ${courseCode}</div>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span style="display: inline-block; background: ${color}; color: #fff; padding: 2px 8px; border-radius: 3px; font-size: 12px; font-weight: 800;">EXPERIMENT NO. ${expNo}</span>
                    </div>
                    <div style="font-size: 16px; font-weight: 800; color: #0f172a; line-height: 1.4; margin-bottom: 12px;">
                        ${expName}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; background: #ffffff; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px;">
                        <div><strong>Date of Performance:</strong> ${datePerform}</div>
                        <div><strong>Date of Submission:</strong> ${dateSubmit}</div>
                    </div>
                </div>

                <!-- Two-Column Submission Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div style="border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 14px 16px; background: #fafafa;">
                        <div style="font-size: 13px; font-weight: 800; color: ${color}; border-bottom: 1.5px solid ${color}; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase;">
                            Submitted By:
                        </div>
                        ${studentInfoHtml}
                    </div>
                    <div style="border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 14px 16px; background: #fafafa;">
                        <div style="font-size: 13px; font-weight: 800; color: ${color}; border-bottom: 1.5px solid ${color}; padding-bottom: 4px; margin-bottom: 10px; text-transform: uppercase;">
                            Submitted To:
                        </div>
                        ${teacherInfoHtml}
                    </div>
                </div>

                ${evalBoxHtml}
            `;
        } else if (currentTemplate === "modern-tech") {
            html = `
                <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid ${color}; padding-bottom: 16px;">
                    <div>
                        <h1 style="font-size: 24px; font-weight: 900; color: ${color}; margin: 0 0 4px 0;">${uni}</h1>
                        <h2 style="font-size: 14px; font-weight: 600; color: #64748b; margin: 0;">${dept}</h2>
                    </div>
                    <img src="${activeLogo}" style="max-height: 75px; max-width: 90px; object-fit: contain;" alt="Logo">
                </div>

                <div style="margin: 24px 0 10px 0;">
                    <span style="color: ${color}; font-size: 12px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">LABORATORY EXPERIMENT REPORT</span>
                    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 4px 0 0 0;">${courseTitle} (${courseCode})</h2>
                </div>

                <div style="background: #f8fafc; border-left: 6px solid ${color}; padding: 18px 22px; border-radius: 0 8px 8px 0; margin-bottom: 20px; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-size: 13px; font-weight: 800; color: ${color}; margin-bottom: 4px;">EXPERIMENT NO: ${expNo}</div>
                    <div style="font-size: 17px; font-weight: 800; color: #1e293b; line-height: 1.4; margin-bottom: 12px;">${expName}</div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 13px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                        <div>📅 <strong>Performance:</strong> ${datePerform}</div>
                        <div>🚀 <strong>Submission:</strong> ${dateSubmit}</div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <div>
                        <div style="font-size: 13px; font-weight: 800; color: ${color}; border-bottom: 2px solid ${color}; padding-bottom: 4px; margin-bottom: 12px; text-transform: uppercase;">
                            👤 Student Information
                        </div>
                        ${studentInfoHtml}
                    </div>
                    <div>
                        <div style="font-size: 13px; font-weight: 800; color: ${color}; border-bottom: 2px solid ${color}; padding-bottom: 4px; margin-bottom: 12px; text-transform: uppercase;">
                            👨‍🏫 Course Instructor
                        </div>
                        ${teacherInfoHtml}
                    </div>
                </div>

                ${evalBoxHtml}
            `;
        } else if (currentTemplate === "executive-navy") {
            html = `
                <div style="background: ${color}; color: #ffffff; padding: 28px 45px; text-align: center;">
                    <img src="${activeLogo}" style="max-height: 70px; max-width: 90px; object-fit: contain; margin-bottom: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));" alt="Logo">
                    <h1 style="font-size: 22px; font-weight: 900; margin: 0 0 4px 0; letter-spacing: 0.5px;">${uni}</h1>
                    <h2 style="font-size: 13px; font-weight: 600; opacity: 0.9; margin: 0;">${dept}</h2>
                </div>

                <div style="padding: 24px 45px; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                    
                    <div style="text-align: center;">
                        <span style="border: 2px solid ${color}; color: ${color}; padding: 4px 20px; font-size: 13px; font-weight: 800; border-radius: 20px; letter-spacing: 1px; text-transform: uppercase;">
                            OFFICIAL LAB REPORT
                        </span>
                        <h3 style="font-size: 16px; font-weight: 700; color: #334155; margin: 12px 0 4px 0;">${courseTitle} (${courseCode})</h3>
                    </div>

                    <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px 20px; background: #f8fafc;">
                        <div style="font-size: 13px; font-weight: 800; color: ${color};">EXPERIMENT NO: ${expNo}</div>
                        <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 6px 0 10px 0;">${expName}</div>
                        <div style="display: flex; justify-content: space-between; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
                            <div><strong>Performance Date:</strong> ${datePerform}</div>
                            <div><strong>Submission Date:</strong> ${dateSubmit}</div>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px;">
                            <div style="font-weight: 800; color: ${color}; margin-bottom: 8px; font-size: 13px; border-bottom: 1px solid ${color}; padding-bottom: 3px;">SUBMITTED BY</div>
                            ${studentInfoHtml}
                        </div>
                        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px;">
                            <div style="font-weight: 800; color: ${color}; margin-bottom: 8px; font-size: 13px; border-bottom: 1px solid ${color}; padding-bottom: 3px;">SUBMITTED TO</div>
                            ${teacherInfoHtml}
                        </div>
                    </div>

                    ${evalBoxHtml}
                </div>

                <div style="background: ${color}; height: 16px; width: 100%;"></div>
            `;
        } else {
            // Default General Clean Academic Frame (lab-matrix, formal-crest, emerald-bio, monochrome-print, circuit-dark, evaluation-focus, minimalist-sharp)
            html = `
                <div style="text-align: center; margin-bottom: 15px;">
                    <img src="${activeLogo}" style="max-height: 80px; max-width: 90px; object-fit: contain; margin-bottom: 8px;" alt="Logo">
                    <h1 style="font-size: 22px; font-weight: 900; color: ${color}; margin: 0 0 4px 0; text-transform: uppercase;">${uni}</h1>
                    <h2 style="font-size: 14px; font-weight: 700; color: #475569; margin: 0;">${dept}</h2>
                </div>

                <div style="text-align: center; margin: 10px 0 16px 0;">
                    <div style="border-top: 2px solid ${color}; border-bottom: 2px solid ${color}; padding: 6px 0;">
                        <span style="font-size: 16px; font-weight: 800; color: ${color}; letter-spacing: 2px; text-transform: uppercase;">LABORATORY REPORT</span>
                        <div style="font-size: 15px; font-weight: 700; color: #1e293b; margin-top: 2px;">${courseTitle} (${courseCode})</div>
                    </div>
                </div>

                <!-- Experiment Details Box -->
                <div style="border: 2px solid ${color}; border-radius: 6px; padding: 14px 18px; margin-bottom: 16px; background: rgba(0,0,0,0.015);">
                    <div style="font-size: 13px; font-weight: 800; color: ${color};">EXPERIMENT NO: ${expNo}</div>
                    <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 4px 0 10px 0; line-height: 1.35;">${expName}</div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; border-top: 1px solid rgba(0,0,0,0.1); padding-top: 6px;">
                        <div><strong>Date of Performance:</strong> ${datePerform}</div>
                        <div><strong>Date of Submission:</strong> ${dateSubmit}</div>
                    </div>
                </div>

                <!-- Two-Column Submission Matrix -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 10px;">
                    <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; background: #fafafa;">
                        <div style="font-size: 13px; font-weight: 800; color: ${color}; border-bottom: 1.5px solid ${color}; padding-bottom: 3px; margin-bottom: 8px;">
                            SUBMITTED BY:
                        </div>
                        ${studentInfoHtml}
                    </div>
                    <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; background: #fafafa;">
                        <div style="font-size: 13px; font-weight: 800; color: ${color}; border-bottom: 1.5px solid ${color}; padding-bottom: 3px; margin-bottom: 8px;">
                            SUBMITTED TO:
                        </div>
                        ${teacherInfoHtml}
                    </div>
                </div>

                ${evalBoxHtml}
            `;
        }

        previewContainer.innerHTML = html;
        updatePreviewScale();
    }

    // ── Export: PDF Generation ─────────────────────────────────────────
    if (btnDlPdf) {
        btnDlPdf.addEventListener("click", async () => {
            const origTransform = previewContainer.style.transform;
            btnDlPdf.disabled = true;
            btnDlPdf.innerHTML = `<span>⏳</span> Generating PDF...`;

            try {
                // Reset transform for 1:1 render capture
                previewContainer.style.transform = "none";

                const canvas = await html2canvas(previewContainer, {
                    scale: 2.5, // 2.5x high DPI resolution
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#ffffff"
                });

                const imgData = canvas.toDataURL("image/jpeg", 0.98);
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4"
                });

                pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
                const expClean = (inpExpNo ? inpExpNo.value.trim() : "01").replace(/[^a-zA-Z0-9]/g, "_");
                pdf.save(`Lab_Report_Exp_${expClean}_Cover.pdf`);

                if (window.showToast) {
                    window.showToast("Lab Report PDF downloaded successfully!", "success");
                }
            } catch (err) {
                console.error("PDF generation failed:", err);
                alert("Failed to generate PDF. Please try again or use direct print.");
            } finally {
                previewContainer.style.transform = origTransform;
                btnDlPdf.disabled = false;
                btnDlPdf.innerHTML = `<span>📄</span> Download A4 PDF`;
            }
        });
    }

    // ── Export: HD PNG Image ───────────────────────────────────────────
    if (btnDlPng) {
        btnDlPng.addEventListener("click", async () => {
            const origTransform = previewContainer.style.transform;
            btnDlPng.disabled = true;
            btnDlPng.innerHTML = `<span>⏳</span> Capturing Image...`;

            try {
                previewContainer.style.transform = "none";
                const canvas = await html2canvas(previewContainer, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: "#ffffff"
                });

                const link = document.createElement("a");
                const expClean = (inpExpNo ? inpExpNo.value.trim() : "01").replace(/[^a-zA-Z0-9]/g, "_");
                link.download = `Lab_Report_Exp_${expClean}_Cover.png`;
                link.href = canvas.toDataURL("image/png");
                link.click();

                if (window.showToast) {
                    window.showToast("HD PNG cover image downloaded!", "success");
                }
            } catch (err) {
                console.error("PNG capture failed:", err);
            } finally {
                previewContainer.style.transform = origTransform;
                btnDlPng.disabled = false;
                btnDlPng.innerHTML = `<span>🖼️</span> Download HD PNG`;
            }
        });
    }

    // ── Export: Native Direct Print ────────────────────────────────────
    if (btnDirectPrint) {
        btnDirectPrint.addEventListener("click", () => {
            window.print();
        });
    }

    // Initial Render
    renderPreview();
});
