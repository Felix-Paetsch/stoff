function add_svg_hover_events(){
    const old_hover_elements = document.querySelectorAll('.hover_data');
    old_hover_elements.forEach(e => {
        e.remove();
    });

    const svg = document.querySelector("#sketch_display svg");
    const children = svg.children;
    for (const c of children) {
        if (!c.hasAttribute("hover_area")){
            c.style.pointerEvents = "none";
            continue;
        }

        c.style.cursor = "crosshair";
        const tooltip = document.createElement('pre');
        tooltip.classList.add('hover_data');
        tooltip.innerHTML = calculateTooltipContent(
            JSON.parse(
                c.getAttribute("x-data")
            )
        );
        document.body.appendChild(tooltip);
        
        c.addEventListener('mouseover', (event) => {
            tooltip.style.top = event.clientY + 'px';
            tooltip.style.left = `${event.clientX}px`;
            tooltip.style.opacity = 1;
        });

        c.addEventListener('mousemove', (event) => {
            tooltip.style.top = event.clientY + 'px';
            tooltip.style.left = `${event.clientX}px`;
            tooltip.style.opacity = 1;
        });

        c.addEventListener('mouseout', (event) => {
            tooltip.style.opacity = 0;
        });

        document.addEventListener("click", () => {
            tooltip.style.opacity = 0;
        });

        document.addEventListener("scroll", () => {
            tooltip.style.opacity = 0;
        });
    }
}

function calculateTooltipContent(data){
    console.log(data);
    return JSON.stringify(data, true, 2);
}