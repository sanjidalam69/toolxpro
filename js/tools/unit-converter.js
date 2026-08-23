// ToolX Pro - Unit Converter Javascript
document.addEventListener("DOMContentLoaded", () => {
    const categorySelect = document.getElementById("converter-category");
    const inputVal = document.getElementById("input-val");
    const outputVal = document.getElementById("output-val");
    const fromUnitSelect = document.getElementById("from-unit");
    const toUnitSelect = document.getElementById("to-unit");

    const units = {
        length: {
            name: "Length",
            list: [
                { id: "m", name: "Meter (m)", factor: 1 },
                { id: "cm", name: "Centimeter (cm)", factor: 0.01 },
                { id: "mm", name: "Millimeter (mm)", factor: 0.001 },
                { id: "km", name: "Kilometer (km)", factor: 1000 },
                { id: "in", name: "Inch (in)", factor: 0.0254 },
                { id: "ft", name: "Foot (ft)", factor: 0.3048 },
                { id: "yd", name: "Yard (yd)", factor: 0.9144 },
                { id: "mi", name: "Mile (mi)", factor: 1609.34 }
            ]
        },
        weight: {
            name: "Weight",
            list: [
                { id: "kg", name: "Kilogram (kg)", factor: 1000 },
                { id: "g", name: "Gram (g)", factor: 1 },
                { id: "lb", name: "Pound (lb)", factor: 453.592 },
                { id: "oz", name: "Ounce (oz)", factor: 28.3495 },
                { id: "ton", name: "Metric Ton (t)", factor: 1000000 }
            ]
        },
        temp: {
            name: "Temperature",
            list: [
                { id: "c", name: "Celsius (°C)" },
                { id: "f", name: "Fahrenheit (°F)" },
                { id: "k", name: "Kelvin (K)" }
            ]
        }
    };

    function populateUnits() {
        const cat = categorySelect.value;
        const list = units[cat].list;
        
        fromUnitSelect.innerHTML = '';
        toUnitSelect.innerHTML = '';

        list.forEach((unit, idx) => {
            const opt1 = document.createElement("option");
            opt1.value = unit.id;
            opt1.innerText = unit.name;
            fromUnitSelect.appendChild(opt1);

            const opt2 = document.createElement("option");
            opt2.value = unit.id;
            opt2.innerText = unit.name;
            if (idx === 1 || list.length === 1) {
                opt2.selected = true;
            }
            toUnitSelect.appendChild(opt2);
        });

        calculate();
    }

    function calculate() {
        const value = parseFloat(inputVal.value);
        if (isNaN(value)) {
            outputVal.value = "";
            return;
        }

        const cat = categorySelect.value;
        const fromUnit = fromUnitSelect.value;
        const toUnit = toUnitSelect.value;

        if (fromUnit === toUnit) {
            outputVal.value = value.toString();
            return;
        }

        let result = 0;

        if (cat === "temp") {
            let tempInCelsius = 0;

            if (fromUnit === "c") tempInCelsius = value;
            else if (fromUnit === "f") tempInCelsius = (value - 32) * 5 / 9;
            else if (fromUnit === "k") tempInCelsius = value - 273.15;

            if (toUnit === "c") result = tempInCelsius;
            else if (toUnit === "f") result = (tempInCelsius * 9 / 5) + 32;
            else if (toUnit === "k") result = tempInCelsius + 273.15;
            
        } else {
            const list = units[cat].list;
            const fromFactor = list.find(u => u.id === fromUnit).factor;
            const toFactor = list.find(u => u.id === toUnit).factor;

            const baseValue = value * fromFactor;
            result = baseValue / toFactor;
        }

        let formattedResult = "";
        if (Math.abs(result) > 0 && Math.abs(result) < 0.00001) {
            formattedResult = result.toExponential(6);
        } else {
            formattedResult = parseFloat(result.toPrecision(8)).toString();
        }
        outputVal.value = formattedResult;
    }

    categorySelect.addEventListener("change", populateUnits);
    inputVal.addEventListener("input", calculate);
    fromUnitSelect.addEventListener("change", calculate);
    toUnitSelect.addEventListener("change", calculate);

    populateUnits();
});
