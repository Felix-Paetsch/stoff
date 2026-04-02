import { z } from "zod";
import { definePattern } from "../types";
import { BaseMeasurementsSchema } from "../base_measurements";
import { construct_base_tshirt_parts } from "./construct_base_parts";
import { BoundShirtSideMeasurements } from "./measurement_utils";
import { start_global_recording } from "@/Core/sketch/debug/recording";
import { hot_debug_render } from "@/Core/sketch/debug/debug_render";

export const TShirtPatternConfigSchema = z.intersection(
    z.object({
        "Darts fitted": z.literal("0_nothing"),
        "Darts standard": z.literal("0_nothing"),
        "Darts wide": z.literal("0_nothing"),

        Fancy: z.literal("0_none"),
        Main_Body: z.literal("fitted"),
        Neckline: z.literal("round"),
        Sleeves: z.literal("0_standard_kurz"),
    }),
    BaseMeasurementsSchema,
);

export type TShirtPatternConfig = z.infer<typeof TShirtPatternConfigSchema>;
export const TShirtPattern = definePattern({
    name: "T-Shirt",
    config_schema: TShirtPatternConfigSchema,
    construct: (cfg: TShirtPatternConfig) => {
        const gr = start_global_recording();
        hot_debug_render(gr);

        const mea = BoundShirtSideMeasurements(cfg, "back");
        const r = construct_base_tshirt_parts(mea);

        return {
            result: r,
        };
    },
});
