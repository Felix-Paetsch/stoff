let currently_display = ["base"];
let render_groups = new Map();

function add_svg_hover_events() {
    const old_hover_elements = document.querySelectorAll(".hover_data");
    old_hover_elements.forEach((e) => {
        e.remove();
    });

    const svg_children = document.querySelectorAll(".sketch_display svg > *");
    render_groups = new Map();

    for (const c of svg_children) {
        if (!c.hasAttribute("hover_stuff")) {
            c.style.pointerEvents = "none";
            continue;
        }

        const belongs_to_render_groups = JSON.parse(
            c.getAttribute("x-belongs_to_render_groups"),
        );
        const show_on_hover = JSON.parse(
            c.getAttribute("x-show_render_groups_on_hover"),
        );

        for (const belongs_to of belongs_to_render_groups) {
            add_element_to_map(c, render_groups, belongs_to);
        }

        if (!belongs_to_render_groups.includes("base")) {
            c.style.display = "none";
        }

        c.style.cursor = "crosshair";
        const tooltip = document.createElement("pre");
        tooltip.classList.add("hover_data");
        tooltip.innerHTML = calculateTooltipContent(
            JSON.parse(c.getAttribute("x-data")),
        );
        document.body.appendChild(tooltip);

        const hover_fun = (event) => {
            tooltip.style.top = event.clientY + "px";
            tooltip.style.left = `${event.clientX}px`;
            tooltip.style.opacity = 1;

            changeVisibility(show_on_hover);
        };

        c.addEventListener("mouseover", (event) => hover_fun(event));
        c.addEventListener("mousemove", (event) => hover_fun(event));

        c.addEventListener("mouseout", (event) => {
            changeVisibility(["base"]);
            tooltip.style.opacity = 0;
        });

        document.addEventListener("click", () => {
            tooltip.style.opacity = 0;
        });

        document.addEventListener("scroll", () => {
            tooltip.style.opacity = 0;
        });
    }

    changeVisibility(["base"]);
}

function calculateTooltipContent(data) {
    return JSON.stringify(data, true, 2)
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function add_element_to_map(el, map, key) {
    const obj = map.get(key);
    if (obj) {
        obj.push(el);
    } else {
        map.set(key, [el]);
    }
}

function get_map_elements(map, key) {
    const obj = map.get(key);
    if (obj) {
        return obj;
    } else {
        return [];
    }
}

function changeVisibility(new_current_render_group) {
    const old_render_thing = currently_display;

    for (let vanishing of old_render_thing) {
        if (
            new_current_render_group.includes(vanishing) ||
            vanishing === "base"
        ) {
            continue;
        }

        get_map_elements(render_groups, vanishing).forEach((e) => {
            e.style.display = "none";
        });
    }

    for (let visible of new_current_render_group) {
        get_map_elements(render_groups, visible).forEach((e) => {
            e.style.display = "block";
        });
    }

    currently_display = new_current_render_group;
}
