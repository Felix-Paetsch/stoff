import { CollectionMethods, Sketch } from "@/Core";
import { Out, Recording } from "@/Dev";
import { definePattern } from "../types";
import { draw_base_pattern } from "./draw_base_pattern";

export type BowlCozyConfig = {
    width_top: number;
    width_bottom: number;
    depth: number;
};

export const BowlCozyPattern = definePattern(
    "Bowl Cozy" as const,
    (cfg: BowlCozyConfig) => {
        const gr = Recording.start_global_recording();
        Out.put(gr);

        const sT = new Sketch();

        draw_base_pattern(sT, cfg);

        CollectionMethods.get_lines_between_points(
            CollectionMethods.get_points(
                sT,
                CollectionMethods.notP({
                    type: "center",
                }),
            ),
            {
                where: "collection_points_any_lines",
            },
        );

        return sT;
    },
);
