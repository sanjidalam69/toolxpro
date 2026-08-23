// ToolX Pro - BMI Calculator Javascript
document.addEventListener("DOMContentLoaded", () => {
    const unitKgFt = document.getElementById("unit-kg-ft");
    const unitMetric = document.getElementById("unit-metric");
    const unitImperial = document.getElementById("unit-imperial");

    const kgFtInputs = document.getElementById("kg-ft-inputs");
    const metricInputs = document.getElementById("metric-inputs");
    const imperialInputs = document.getElementById("imperial-inputs");

    const calculateBtn = document.getElementById("calculate-btn");
    const resultsCard = document.getElementById("results");
    const resultsContent = document.getElementById("results-content");

    // Radio Toggle Handler
    function updateRadioVisibility() {
        if (unitKgFt && unitKgFt.checked) {
            kgFtInputs.style.display = "block";
            metricInputs.style.display = "none";
            imperialInputs.style.display = "none";
        } else if (unitMetric && unitMetric.checked) {
            kgFtInputs.style.display = "none";
            metricInputs.style.display = "block";
            imperialInputs.style.display = "none";
        } else if (unitImperial && unitImperial.checked) {
            kgFtInputs.style.display = "none";
            metricInputs.style.display = "none";
            imperialInputs.style.display = "block";
        }
    }

    if (unitKgFt) unitKgFt.addEventListener("change", updateRadioVisibility);
    if (unitMetric) unitMetric.addEventListener("change", updateRadioVisibility);
    if (unitImperial) unitImperial.addEventListener("change", updateRadioVisibility);

    calculateBtn.addEventListener("click", () => {
        let heightM = 0;
        let weightKg = 0;
        let bmi = 0;
        let weightUnit = "kg";

        if (unitKgFt && unitKgFt.checked) {
            weightKg = parseFloat(document.getElementById("weight-kg-ft").value);
            const feet = parseFloat(document.getElementById("height-feet-kg").value) || 0;
            const inches = parseFloat(document.getElementById("height-inches-kg").value) || 0;

            if (!weightKg || weightKg <= 0 || (feet === 0 && inches === 0)) {
                alert("Please enter valid weight (kg) and height (feet & inches).");
                return;
            }

            const totalInches = (feet * 12) + inches;
            heightM = (totalInches * 2.54) / 100;
            bmi = weightKg / (heightM * heightM);
            weightUnit = "kg";

        } else if (unitMetric && unitMetric.checked) {
            weightKg = parseFloat(document.getElementById("weight-metric").value);
            const heightCm = parseFloat(document.getElementById("height-metric").value);

            if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
                alert("Please enter valid weight (kg) and height (cm).");
                return;
            }

            heightM = heightCm / 100;
            bmi = weightKg / (heightM * heightM);
            weightUnit = "kg";

        } else {
            const weightLbs = parseFloat(document.getElementById("weight-imperial").value);
            const feet = parseFloat(document.getElementById("height-feet").value) || 0;
            const inches = parseFloat(document.getElementById("height-inches").value) || 0;

            if (!weightLbs || weightLbs <= 0 || (feet === 0 && inches === 0)) {
                alert("Please enter valid weight (lbs) and height (feet & inches).");
                return;
            }

            const totalInches = (feet * 12) + inches;
            heightM = (totalInches * 2.54) / 100;
            bmi = (weightLbs / (totalInches * totalInches)) * 703;
            weightUnit = "lbs";
        }

        // WHO Standard BMI Categories
        let category = "";
        let color = "";
        let advice = "";

        if (bmi < 18.5) {
            category = "Underweight";
            color = "var(--warning)";
            advice = "Your weight is lower than normal. Focus on a balanced, nutrient-dense diet to reach a healthy weight.";
        } else if (bmi < 25.0) {
            category = "Normal Weight";
            color = "var(--success)";
            advice = "Congratulations! Your Body Mass Index is in a healthy range. Maintain your current diet and activity levels.";
        } else if (bmi < 30.0) {
            category = "Overweight";
            color = "var(--warning)";
            advice = "Your weight is slightly higher than recommended. Try incorporating regular physical exercises and mindful eating habits.";
        } else {
            category = "Obesity";
            color = "var(--danger)";
            advice = "Your BMI indicates obesity, which can pose health risks. We advise consulting a health provider for guidance on nutrition and fitness plans.";
        }

        // Ideal weight range for height
        let idealMinWeight = 18.5 * (heightM * heightM);
        let idealMaxWeight = 24.9 * (heightM * heightM);

        if (weightUnit === "lbs") {
            idealMinWeight *= 2.20462;
            idealMaxWeight *= 2.20462;
        }

        resultsContent.innerHTML = `
            <div style="margin-bottom:1.5rem; border-bottom:1px solid var(--border-color); padding-bottom:1rem; text-align:center;">
                <p style="font-size:1.1rem; margin-bottom:5px;">Your BMI Score:</p>
                <h3 style="font-size:2.5rem; font-weight:700; color:${color}; margin-bottom:10px;">
                    ${bmi.toFixed(1)}
                </h3>
                <span style="background:${color}; color:white; padding:4px 12px; border-radius:20px; font-weight:600; font-size:1rem; display:inline-block;">
                    ${category}
                </span>
            </div>
            
            <div style="margin-bottom:1.2rem; background:var(--bg-secondary); padding:1rem; border-radius:8px; border-left:4px solid ${color};">
                <p style="font-size:0.95rem; line-height:1.5;">💡 <b>Advice:</b> ${advice}</p>
            </div>

            <div style="font-size:0.95rem;">
                <p>📍 Ideal weight range for your height: 
                    <b>${idealMinWeight.toFixed(1)} ${weightUnit}</b> to 
                    <b>${idealMaxWeight.toFixed(1)} ${weightUnit}</b>.
                </p>
            </div>
        `;

        resultsCard.style.display = "block";
        resultsCard.scrollIntoView({ behavior: 'smooth' });
    });
});
