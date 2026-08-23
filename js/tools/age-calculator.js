// ToolX Pro - Age Calculator Javascript
document.addEventListener("DOMContentLoaded", () => {
    // Set default target date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("target-date").value = today;

    const calculateBtn = document.getElementById("calculate-btn");
    const birthDateInput = document.getElementById("birth-date");
    const targetDateInput = document.getElementById("target-date");
    const birthPreview = document.getElementById("birth-date-preview");
    const targetPreview = document.getElementById("target-date-preview");
    const resultsCard = document.getElementById("results");
    const resultsContent = document.getElementById("results-content");

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    function updatePreview(input, previewEl) {
        if (!input || !input.value || !previewEl) return;
        const [y, m, d] = input.value.split('-').map(Number);
        if (y && m && d && m >= 1 && m <= 12) {
            previewEl.innerText = `🗓️ Selected: ${d} ${monthNames[m - 1]} ${y}`;
        } else {
            previewEl.innerText = "";
        }
    }

    birthDateInput.addEventListener("input", () => updatePreview(birthDateInput, birthPreview));
    targetDateInput.addEventListener("input", () => updatePreview(targetDateInput, targetPreview));
    
    updatePreview(targetDateInput, targetPreview);

    calculateBtn.addEventListener("click", () => {
        const birthDateVal = birthDateInput.value;
        const targetDateVal = targetDateInput.value;

        if (!birthDateVal || !targetDateVal) {
            alert("Please select both dates.");
            return;
        }

        const [bY, bM, bD] = birthDateVal.split('-').map(Number);
        const [tY, tM, tD] = targetDateVal.split('-').map(Number);

        const birthDate = new Date(bY, bM - 1, bD);
        const targetDate = new Date(tY, tM - 1, tD);

        if (birthDate > targetDate) {
            alert("Date of birth cannot be later than the calculation date!");
            return;
        }

        // Calculate Age Difference
        let years = tY - bY;
        let months = tM - bM;
        let days = tD - bD;

        if (days < 0) {
            months--;
            const prevMonthDate = new Date(tY, tM - 1, 0);
            days += prevMonthDate.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        // Calculate Next Birthday (Exact)
        let nextBirthday = new Date(tY, bM - 1, bD);
        if (nextBirthday < targetDate) {
            nextBirthday.setFullYear(tY + 1);
        }

        const daysToNextBirthday = Math.round((nextBirthday - targetDate) / (1000 * 60 * 60 * 24));
        let monthsToNextBirthday = nextBirthday.getMonth() - targetDate.getMonth() + (12 * (nextBirthday.getFullYear() - targetDate.getFullYear()));
        let remainingDaysToNextBirthday = nextBirthday.getDate() - targetDate.getDate();

        if (remainingDaysToNextBirthday < 0) {
            monthsToNextBirthday--;
            const prevMonthDate = new Date(nextBirthday.getFullYear(), nextBirthday.getMonth(), 0);
            remainingDaysToNextBirthday += prevMonthDate.getDate();
        }

        // Lifetime Stats
        const totalMs = targetDate - birthDate;
        const totalDays = Math.round(totalMs / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.floor(totalDays / 7);
        const totalMonths = (years * 12) + months;
        const totalHours = totalDays * 24;
        const totalMinutes = totalHours * 60;
        const totalSeconds = totalMinutes * 60;

        const formatUnit = (val, singular, plural) => `${val} ${val === 1 ? singular : plural}`;

        // Render HTML Results
        resultsContent.innerHTML = `
            <div style="margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem;">
                <p style="font-size:1.4rem; font-weight:600; color:var(--primary);">
                    Current Age: 
                    <span style="color:var(--text-primary);">
                        ${formatUnit(years, 'year', 'years')}, ${formatUnit(months, 'month', 'months')}, and ${formatUnit(days, 'day', 'days')}
                    </span>
                </p>
            </div>
            
            <div style="margin-bottom:1.5rem; padding-bottom:1rem; border-bottom:1px solid var(--border-color);">
                <h3 style="font-size:1.1rem; font-weight:600; margin-bottom:8px;">🎂 Next Birthday:</h3>
                <p>Time remaining to next birthday: <b>${formatUnit(monthsToNextBirthday, 'month', 'months')} and ${formatUnit(remainingDaysToNextBirthday, 'day', 'days')}</b> (total ${formatUnit(daysToNextBirthday, 'day', 'days')})</p>
            </div>

            <div>
                <h3 style="font-size:1.1rem; font-weight:600; margin-bottom:10px;">📊 Your Lifetime Stats:</h3>
                <ul style="list-style:none; padding-left:0; display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:10px;">
                    <li style="background:var(--bg-secondary); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); font-size:0.95rem;">
                        🗓️ Total Years: <b>${formatUnit(years, 'year', 'years')}</b>
                    </li>
                    <li style="background:var(--bg-secondary); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); font-size:0.95rem;">
                        📅 Total Months: <b>${formatUnit(totalMonths, 'month', 'months')}</b>
                    </li>
                    <li style="background:var(--bg-secondary); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); font-size:0.95rem;">
                        📆 Total Weeks: <b>${formatUnit(totalWeeks, 'week', 'weeks')}</b>
                    </li>
                    <li style="background:var(--bg-secondary); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); font-size:0.95rem;">
                        ☀️ Total Days: <b>${formatUnit(totalDays, 'day', 'days')}</b>
                    </li>
                    <li style="background:var(--bg-secondary); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); font-size:0.95rem;">
                        ⏰ Total Hours: <b>${totalHours.toLocaleString()} hours</b>
                    </li>
                    <li style="background:var(--bg-secondary); padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); font-size:0.95rem;">
                        ⏱️ Total Minutes: <b>${totalMinutes.toLocaleString()} minutes</b>
                    </li>
                </ul>
            </div>
        `;

        resultsCard.style.display = "block";
        resultsCard.scrollIntoView({ behavior: 'smooth' });
    });
});
