let currently_display: string[] = ["base"];
let render_groups: Map<string, HTMLElement[]> = new Map();

export function add_svg_hover_events(root: HTMLElement) {
    cleanup_svg_hover_events();

    const svg_children = root.querySelectorAll(
        ".sketch_display svg > *",
    ) as NodeListOf<HTMLElement>;

    render_groups = new Map();
    currently_display = ["base"];

    for (const c of svg_children) {
        // Force pointer events (CRITICAL)
        c.style.pointerEvents = "auto";

        if (!c.hasAttribute("hover_stuff")) {
            c.style.pointerEvents = "none";
            continue;
        }

        const belongs_to_render_groups = JSON.parse(
            c.getAttribute("x-belongs_to_render_groups") ?? "[]",
        );

        const show_on_hover = JSON.parse(
            c.getAttribute("x-show_render_groups_on_hover") ?? "[]",
        );

        for (const belongs_to of belongs_to_render_groups) {
            add_element_to_map(c, render_groups, belongs_to);
        }

        if (!belongs_to_render_groups.includes("base")) {
            c.style.display = "none";
        }

        c.style.cursor = "crosshair";

        /* ------------------------- Tooltip creation ------------------------- */

        const tooltip = document.createElement("pre");
        tooltip.className = "hover_data";
        tooltip.style.position = "fixed";
        tooltip.style.pointerEvents = "none";
        tooltip.style.opacity = "0";
        tooltip.style.background = "rgba(0,0,0,0.85)";
        tooltip.style.color = "white";
        tooltip.style.padding = "8px 10px";
        tooltip.style.borderRadius = "4px";
        tooltip.style.fontSize = "12px";
        tooltip.style.maxWidth = "320px";
        tooltip.style.whiteSpace = "pre-wrap";
        tooltip.style.zIndex = "999999";

        tooltip.innerHTML = calculateTooltipContent(
            JSON.parse(c.getAttribute("x-data") ?? "{}"),
        );

        document.body.appendChild(tooltip);

        const hover_fun = (event: MouseEvent) => {
            tooltip.style.top = `${event.clientY + 12}px`;
            tooltip.style.left = `${event.clientX + 12}px`;
            tooltip.style.opacity = "1";

            changeVisibility(show_on_hover);
        };

        const mouseOutFun = () => {
            changeVisibility(["base"]);
            tooltip.style.opacity = "0";
        };

        c.addEventListener("mouseover", hover_fun);
        c.addEventListener("mousemove", hover_fun);
        c.addEventListener("mouseout", mouseOutFun);

        document.addEventListener("click", mouseOutFun);
        document.addEventListener("scroll", mouseOutFun);
    }

    changeVisibility(["base"]);
}

export function cleanup_svg_hover_events() {
    document
        .querySelectorAll(".hover_data")
        .forEach((e) => e.remove());
}

function calculateTooltipContent(data: unknown) {
    return JSON.stringify(data, null, 2)
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function add_element_to_map(
    el: HTMLElement,
    map: Map<string, HTMLElement[]>,
    key: string,
) {
    const obj = map.get(key);
    if (obj) {
        obj.push(el);
    } else {
        map.set(key, [el]);
    }
}

function get_map_elements(
    map: Map<string, HTMLElement[]>,
    key: string,
) {
    return map.get(key) ?? [];
}

function changeVisibility(new_current_render_group: string[]) {
    const old_render_thing = currently_display;

    for (const vanishing of old_render_thing) {
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

    for (const visible of new_current_render_group) {
        get_map_elements(render_groups, visible).forEach((e) => {
            e.style.display = "block";
        });
    }

    currently_display = new_current_render_group;
}
