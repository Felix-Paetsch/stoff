import { z } from "zod";
import { definePattern } from "../types";
import { hot_debug_render } from "@/Core/Debug/debug_render";
import { start_global_recording } from "@/Core/Debug/recording";
import { Sketch } from "@/Core/StoffLib/sketch";
import { Sewing } from "@/Core/Sewing/sewing";
import { draw_base_pattern } from "./draw_base_pattern";
import {
    get_lines_between_points,
    get_points,
    not,
    PointFilter,
} from "@/Core/StoffLib/collection";

export const BowlCozyConfigSchema = z.object({
    w_top: z.number(),
    w_bottom: z.number(),
    depth: z.number(),
});

export type BowlCozyConfig = z.infer<typeof BowlCozyConfigSchema>;
export const BowlCozyPattern = definePattern({
    name: "Bowl Cozy",
    config_schema: BowlCozyConfigSchema,
    construct: (cfg: BowlCozyConfig) => {
        const gr = start_global_recording();
        hot_debug_render(gr);

        const sT = new Sketch();

        draw_base_pattern(sT, cfg);

        const s = new Sewing([sT]);
        const sLines = get_lines_between_points(
            get_points(
                sT,
                not({
                    type: "center",
                } as PointFilter),
            ),
            true,
            true,
            "collection_points_any_lines",
        );

        const lns = s.cut(sLines);

        lns.forEach((l) => {
            l.get_lines().forEach((r) => {
                r.set_color("red");
            });
        });

        // draw helper lines

        // const sB = sT.copy().sketch;

        return {
            result: s,
        };
    },
});
