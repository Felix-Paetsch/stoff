import { z } from "zod";
import { definePattern } from "../types";
import { draw_base_pattern } from "./draw_base_pattern";
import { Sketch } from "@/Core/sketch/sketch";
import { hot_debug_render } from "@/Core/sketch/debug/debug_render";
import { start_global_recording } from "@/Core/sketch/debug/recording";
import {
    get_lines_between_points,
    get_points,
    not,
    PointFilter,
} from "@/Core/sketch/collection";

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

        get_lines_between_points(
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

        return {
            result: sT,
        };
    },
});
