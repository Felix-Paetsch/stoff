import { reHighlight } from "../client.js";
import { recomputeEmbroideryDisplay } from "./cjson/embroidery/index.js";
import { rebuildSVGRenderGroups } from "./cjson/svg_tooltips.js";

export function escapeHtml(value: string): string {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function json_to_string(data: unknown): string {
    try {
        const json = JSON.stringify(data, null, 2);
        const s = escapeHtml(json);
        return s;
    } catch {
        return "" + (data as any);
    }
}

export function updateCJson() {
    reHighlight();
    rebuildSVGRenderGroups();
    recomputeEmbroideryDisplay();
}
