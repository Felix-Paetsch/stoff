let current_step = 0;

function setSliderCallback() {
    const slider = document.getElementById("slider");
    if (!slider) return;

    const max = document.querySelectorAll(".render-step").length - 1;
    slider.max = max;
    slider.value = Math.min(max, current_step);

    activateRenderStep(current_step);
    slider.addEventListener("input", () => {
        activateRenderStep(slider.value);
    });
}

function activateRenderStep(n) {
    const renderSteps = document.querySelectorAll(".render-step");
    renderSteps.forEach((step) => {
        step.classList.add("hidden");
    });

    const max = renderSteps.length;
    current_step = Math.min(max, n);
    renderSteps[current_step].classList.remove("hidden");

    const sliderDisplay = document.getElementById("sliderDisplay");
    if (renderSteps[current_step].dataset.type) {
        sliderDisplay.innerHTML = `Step: [${renderSteps[current_step].dataset.type}] | ${current_step}/${max - 1}`;
    } else {
        sliderDisplay.innerHTML = `Step: ${current_step}/${max - 1}`;
    }

    current_step = n;
}
