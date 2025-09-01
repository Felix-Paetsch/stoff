import cfg from "../latest_design_config.json"
import create_design from "../../../Patterns/export_pattern_ui_v2";
import Sketch from "../../../Core/StoffLib/sketch.js";
import { Sewing } from "../../../Core/Sewing/sewing.js";
import { document } from "postcss";

const design = create_design(cfg);
console.log("DONE");

if (design instanceof Sketch) {
    const svg: string = (design as any).to_svg(500, 500);
    (globalThis as any).document.body.insertAdjacentHTML("beforeend", svg);
} else if (design instanceof Sewing) {
    for (const sketch of design.sketches) {
        const svg: string = (sketch as any).to_svg(500, 500);
        (globalThis as any).document.body.insertAdjacentHTML("beforeend", svg);
    }
}