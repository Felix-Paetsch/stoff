import { z } from "zod"
import { definePattern } from "../types";
import { debug_render, hot_debug_render } from "@/Core/Debug/debug_render";
import { start_global_recording } from "@/Core/Debug/recording";
import { Sketch } from "@/Core/StoffLib/sketch";

export const BowlCozyConfigSchema = z.object({
    size: z.number(),
    depth: z.number()
});

export type BowlCozyConfig = z.infer<typeof BowlCozyConfigSchema>;
export const BowlCozyPattern = definePattern({
    name: "Bowl Cozy",
    config_schema: BowlCozyConfigSchema,
    construct: (
        cfg: BowlCozyConfig,
    ) => {
        const gr = start_global_recording();
        hot_debug_render(gr);


        const sT = new Sketch();
        const sB = new Sketch();

        draw_square(sT, cfg.size);
        draw_square(sB, cfg.size);

        debug_render(sT)

        return {
            result: [sT, sB]
        }
    }
});

function draw_square(s: Sketch, l: number) {
    const pts = [
        s.point(0, 0),
        s.point(l, 0),
        s.point(l, l),
        s.point(0, l)
    ] as const;

    for (let i = 0; i < pts.length; i++) {
        s.line_between_points(pts[i]!, pts[(i + 1) % pts.length]!);
    }
}
