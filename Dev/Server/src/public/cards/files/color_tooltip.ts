type HTMLThing = any;
type RgbaPixel = [r: number, g: number, b: number, a: number];
type NullablePixel = RgbaPixel | null;

let tooltipEl: HTMLThing | null = null;

const imageCanvasCache = new WeakMap<
    HTMLImageElement,
    {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        width: number;
        height: number;
    }
>();

/* ------------------------------------------------------------------ */
/* Tooltip                                                            */
/* ------------------------------------------------------------------ */

function ensureTooltip(): HTMLThing {
    if (tooltipEl && document.body.contains(tooltipEl)) {
        return tooltipEl;
    }

    const tooltip = document.createElement("div");
    tooltip.className = "hover_data";
    tooltip.style.position = "fixed";
    tooltip.style.pointerEvents = "none";
    tooltip.style.opacity = "0";
    tooltip.style.background = "rgba(0,0,0,0.85)";
    tooltip.style.color = "white";
    tooltip.style.padding = "8px 10px";
    tooltip.style.borderRadius = "4px";
    tooltip.style.fontSize = "12px";
    tooltip.style.zIndex = "999999";
    tooltip.style.transitionDuration = "0s";
    tooltip.style.fontFamily =
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
    tooltip.style.whiteSpace = "pre";

    document.body.appendChild(tooltip);
    tooltipEl = tooltip;
    return tooltip;
}

function hideTooltip() {
    if (!tooltipEl) return;
    tooltipEl.style.opacity = "0";
}

/* ------------------------------------------------------------------ */
/* Image pixel reading                                                */
/* ------------------------------------------------------------------ */

function getImageCanvasData(img: HTMLImageElement): {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
} | null {
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    if (!naturalWidth || !naturalHeight) {
        return null;
    }

    const cached = imageCanvasCache.get(img);
    if (
        cached &&
        cached.width === naturalWidth &&
        cached.height === naturalHeight
    ) {
        return cached;
    }

    const canvas = document.createElement("canvas");
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return null;
    }

    ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);

    const data = {
        canvas,
        ctx,
        width: naturalWidth,
        height: naturalHeight,
    };

    imageCanvasCache.set(img, data);
    return data;
}

function getPixel(
    imageData: ImageData,
    x: number,
    y: number,
    width: number,
    height: number,
): NullablePixel {
    if (x < 0 || y < 0 || x >= width || y >= height) {
        return null;
    }

    const index = (y * width + x) * 4;
    const d = imageData.data;

    return [d[index], d[index + 1], d[index + 2], d[index + 3]];
}

function getPixelBox(
    img: HTMLImageElement,
    clientX: number,
    clientY: number,
): {
    pixels: NullablePixel[][];
} | null {
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        return null;
    }

    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    if (
        localX < 0 ||
        localY < 0 ||
        localX >= rect.width ||
        localY >= rect.height
    ) {
        return null;
    }

    const imageX = Math.floor((localX / rect.width) * img.naturalWidth);
    const imageY = Math.floor((localY / rect.height) * img.naturalHeight);

    const canvasData = getImageCanvasData(img);
    if (!canvasData) {
        return null;
    }

    let imageData: ImageData;
    try {
        imageData = canvasData.ctx.getImageData(
            0,
            0,
            canvasData.width,
            canvasData.height,
        );
    } catch {
        return null;
    }

    const pixels: NullablePixel[][] = [];

    for (let dy = -2; dy <= 2; dy++) {
        const row: NullablePixel[] = [];
        for (let dx = -2; dx <= 2; dx++) {
            row.push(
                getPixel(
                    imageData,
                    imageX + dx,
                    imageY + dy,
                    canvasData.width,
                    canvasData.height,
                ),
            );
        }
        pixels.push(row);
    }

    return { pixels };
}

/* ------------------------------------------------------------------ */
/* Color formatting                                                   */
/* ------------------------------------------------------------------ */

function rgbToHsl255(
    r: number,
    g: number,
    b: number,
): [number, number, number] {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;

    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;

    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));

        switch (max) {
            case rn:
                h = ((gn - bn) / delta) % 6;
                break;
            case gn:
                h = (bn - rn) / delta + 2;
                break;
            default:
                h = (rn - gn) / delta + 4;
                break;
        }

        h *= 60;
        if (h < 0) h += 360;
    }

    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

function pad3(n: number): string {
    return String(n).padStart(3, " ");
}

function formatTriplet(v: [number, number, number]): string {
    return `[${pad3(v[0])},${pad3(v[1])},${pad3(v[2])}]`;
}

/* ------------------------------------------------------------------ */
/* Tooltip rendering                                                  */
/* ------------------------------------------------------------------ */

function createPixelCell(
    pixel: NullablePixel,
    isCenter: boolean,
): HTMLDivElement {
    const cell = document.createElement("div");
    cell.style.width = "14px";
    cell.style.height = "14px";
    cell.style.boxSizing = "border-box";
    cell.style.border = isCenter
        ? "1px solid white"
        : "1px solid rgba(255,255,255,0.08)";

    if (pixel) {
        const [r, g, b, a] = pixel;
        cell.style.background = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    } else {
        cell.style.background = "rgba(255,255,255,0.06)";
    }

    return cell;
}

function renderTooltipContent(
    tooltip: HTMLElement,
    pixels: NullablePixel[][],
    centerPixel: NullablePixel,
) {
    tooltip.replaceChildren();

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(5, 14px)";
    grid.style.gridTemplateRows = "repeat(5, 14px)";
    grid.style.gap = "1px";
    grid.style.marginBottom = "8px";

    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            grid.appendChild(createPixelCell(pixels[y][x], x === 2 && y === 2));
        }
    }

    const text = document.createElement("div");
    text.style.lineHeight = "1.35";

    if (!centerPixel) {
        text.textContent = "rgb: [  -,  -,  -]\nhsl: [  -,  -,  -]";
    } else {
        const rgb: [number, number, number] = [
            centerPixel[0],
            centerPixel[1],
            centerPixel[2],
        ];
        const hsl = rgbToHsl255(rgb[0], rgb[1], rgb[2]);
        text.textContent = `rgb: ${formatTriplet(rgb)}\nhsl: ${formatTriplet(hsl)}`;
    }

    tooltip.appendChild(grid);
    tooltip.appendChild(text);
}

/* ------------------------------------------------------------------ */
/* Event handling                                                     */
/* ------------------------------------------------------------------ */

function getHoveredImage(target: EventTarget | null): HTMLImageElement | null {
    if (!(target instanceof Element)) return null;

    const img = target.closest(".image-body img");
    if (!(img instanceof HTMLImageElement)) return null;

    const imageBody = img.closest(".image-body");
    if (!imageBody) return null;

    return img;
}

function onMouseMove(event: MouseEvent) {
    const tooltip = ensureTooltip();
    const hoveredImg = getHoveredImage(event.target);

    if (!hoveredImg) {
        hideTooltip();
        return;
    }

    const result = getPixelBox(hoveredImg, event.clientX, event.clientY);
    if (!result) {
        hideTooltip();
        return;
    }

    const centerPixel = result.pixels[2]?.[2] ?? null;

    renderTooltipContent(tooltip, result.pixels, centerPixel);
    tooltip.style.top = `${event.clientY + 2}px`;
    tooltip.style.left = `${event.clientX + 2}px`;
    tooltip.style.opacity = "1";
}

function onMouseLeave() {
    hideTooltip();
}

/* ------------------------------------------------------------------ */
/* Init                                                               */
/* ------------------------------------------------------------------ */

function init() {
    ensureTooltip();

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("click", hideTooltip);
    document.addEventListener("scroll", hideTooltip);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
        once: true,
    });
} else {
    init();
}
