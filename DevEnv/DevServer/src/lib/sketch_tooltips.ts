let currently_display: string[] = ["base"]
const render_groups: Map<string, HTMLElement[]> = new Map()

let tooltipEl: HTMLPreElement | null = null
let currentHoveredEl: HTMLElement | null = null

let initialized = false
let observer: MutationObserver | null = null

/* ------------------------------------------------------------------ */
/* Tooltip                                                            */
/* ------------------------------------------------------------------ */

function ensureTooltip(): HTMLPreElement {
    if (tooltipEl && document.body.contains(tooltipEl)) {
        return tooltipEl
    }

    const tooltip = document.createElement("pre")
    tooltip.className = "hover_data"
    tooltip.style.position = "fixed"
    tooltip.style.pointerEvents = "none"
    tooltip.style.opacity = "0"
    tooltip.style.background = "rgba(0,0,0,0.85)"
    tooltip.style.color = "white"
    tooltip.style.padding = "8px 10px"
    tooltip.style.borderRadius = "4px"
    tooltip.style.fontSize = "12px"
    tooltip.style.maxWidth = "320px"
    tooltip.style.whiteSpace = "pre-wrap"
    tooltip.style.zIndex = "999999"
    tooltip.style.transitionDuration = "0s"

    document.body.appendChild(tooltip)
    tooltipEl = tooltip
    return tooltip
}

function hideTooltip() {
    if (!tooltipEl) return
    tooltipEl.style.opacity = "0"
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function getHoverableSvgElement(
    target: EventTarget | null,
): HTMLElement | null {
    if (!(target instanceof Element)) return null

    const el = target.closest(
        ".sketch_display svg > *",
    ) as HTMLElement | null

    if (!el) return null
    if (!el.hasAttribute("hover_stuff")) return null

    return el
}

function calculateTooltipContent(data: unknown) {
    return JSON.stringify(data, null, 2)
}

function add_element_to_map(
    el: HTMLElement,
    map: Map<string, HTMLElement[]>,
    key: string,
) {
    const arr = map.get(key)
    if (arr) arr.push(el)
    else map.set(key, [el])
}

function get_map_elements(
    map: Map<string, HTMLElement[]>,
    key: string,
) {
    return map.get(key) ?? []
}

/* ------------------------------------------------------------------ */
/* Visibility                                                         */
/* ------------------------------------------------------------------ */

function changeVisibility(new_groups: string[]) {
    for (const old of currently_display) {
        if (new_groups.includes(old) || old === "base") continue

        get_map_elements(render_groups, old).forEach(e => {
            e.style.display = "none"
        })
    }

    for (const visible of new_groups) {
        get_map_elements(render_groups, visible).forEach(e => {
            e.style.display = "block"
        })
    }

    currently_display = new_groups
}

/* ------------------------------------------------------------------ */
/* DOM scanning                                                       */
/* ------------------------------------------------------------------ */

function rebuildRenderGroups() {
    render_groups.clear()
    currently_display = ["base"]

    const svg_children = document.querySelectorAll(
        ".sketch_display svg > *",
    ) as NodeListOf<HTMLElement>

    for (const c of svg_children) {
        c.style.pointerEvents = "auto"

        if (!c.hasAttribute("hover_stuff")) {
            c.style.pointerEvents = "none"
            continue
        }

        const belongs_to_render_groups = JSON.parse(
            c.getAttribute("x-belongs_to_render_groups") ??
            "[]",
        ) as string[]

        for (const g of belongs_to_render_groups) {
            add_element_to_map(c, render_groups, g)
        }

        if (!belongs_to_render_groups.includes("base")) {
            c.style.display = "none"
        }

        c.style.cursor = "crosshair"
    }

    changeVisibility(["base"])
}

/* ------------------------------------------------------------------ */
/* Event delegation                                                   */
/* ------------------------------------------------------------------ */

function onMouseMove(event: MouseEvent) {
    const tooltip = ensureTooltip()
    const hovered = getHoverableSvgElement(event.target)

    if (!hovered) {
        if (currentHoveredEl) {
            currentHoveredEl = null
            hideTooltip()
            changeVisibility(["base"])
        }
        return
    }

    if (hovered === currentHoveredEl) {
        tooltip.style.top = `${event.clientY - 2}px`
        tooltip.style.left = `${event.clientX + 8}px`
        return
    }

    currentHoveredEl = hovered

    const show_on_hover = JSON.parse(
        hovered.getAttribute(
            "x-show_render_groups_on_hover",
        ) ?? "[]",
    ) as string[]

    const tooltipContent = calculateTooltipContent(
        JSON.parse(
            hovered.getAttribute("x-data") ?? "{}",
        ),
    )

    tooltip.textContent = tooltipContent
    tooltip.style.top = `${event.clientY - 2}px`
    tooltip.style.left = `${event.clientX + 8}px`
    tooltip.style.opacity = "1"

    changeVisibility(show_on_hover)
}

function onMouseLeave() {
    currentHoveredEl = null
    hideTooltip()
    changeVisibility(["base"])
}

/* ------------------------------------------------------------------ */
/* Initialization (ONCE)                                              */
/* ------------------------------------------------------------------ */

function init() {
    if (initialized) return
    initialized = true

    ensureTooltip()
    rebuildRenderGroups()

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseleave", onMouseLeave)

    document.addEventListener("click", () => {
        hideTooltip()
        changeVisibility(["base"])
    })

    document.addEventListener("scroll", () => {
        hideTooltip()
        changeVisibility(["base"])
    })

    observer = new MutationObserver(() => {
        rebuildRenderGroups()
    })

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    })
}

/* ------------------------------------------------------------------ */
/* Auto-init on import                                                */
/* ------------------------------------------------------------------ */

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
        once: true,
    })
} else {
    init()
}
