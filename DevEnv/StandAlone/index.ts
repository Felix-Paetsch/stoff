import Sketch from "@/Core/StoffLib/sketch.js";
import { Sewing } from "@/Core/Sewing/sewing.js";
import { dirname, join } from "path";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import debug_create_design from "../Debug/debug_create_design.js";

// Get scene name from command line arguments, default to "annotation"
const sceneName = process.argv[2] || "annotation";
const design = await debug_create_design(sceneName);

if (design instanceof Sketch) {
    const target = join(__dirname, "out/standAlone.png");
    (design as any).save_as_png(target, 300);
} else {
    // Sewing with multiple sketches - save each as component_i.svg
    design.sketches.forEach((sketch, index) => {
        const target = join(__dirname, `out/component_${index}.png`);
        (sketch as any).save_as_png(target, 300, 300);
    });

    design.renderers.forEach((r, i) => {
        design.sketches.forEach((s, index) => {
            const target = join(__dirname, `out/step_${i}_component_${index}.svg`);
            const svg = r.render_sketch(s, 300, 300, 20);
            writeFileSync(target, svg, "utf-8");
        })
    });
}