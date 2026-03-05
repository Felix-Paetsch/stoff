import { z } from "zod"
import { definePattern } from "../types";
import { BaseMeasurements, BaseMeasurementsSchema } from "../base_measurements";
import { hot_debug_render } from "@/Core/Debug/debug_render";
import { start_global_recording } from "@/Core/Debug/recording";
import { construct_base_tshirt_parts } from "./construct_base_parts";
import { BoundShirtSideMeasurements, ShirtDerivedMeasurements } from "./measurement_utils";

export const TShirtPatternConfigSchema = z.object({
    "Darts fitted": z.literal("0_nothing"),
    "Darts standard": z.literal("0_nothing"),
    "Darts wide": z.literal("0_nothing"),

    Fancy: z.literal("0_none"),
    Main_Body: z.literal("fitted"),
    Neckline: z.literal("round"),
    Sleeves: z.literal("0_standard_kurz"),
});

export type TShirtPatternConfig = z.infer<typeof TShirtPatternConfigSchema>;
export const TShirtPattern = definePattern({
    name: "T-Shirt",
    config_schema: TShirtPatternConfigSchema,
    measurements_schema: BaseMeasurementsSchema,
    construct: (
        _cfg: TShirtPatternConfig, bmea: BaseMeasurements
    ) => {
        const gr = start_global_recording();
        hot_debug_render(gr);

        console.log(bmea, ShirtDerivedMeasurements(bmea));
        const mea = BoundShirtSideMeasurements(bmea, "back");
        const r = construct_base_tshirt_parts(mea);

        return {
            result: r
        }
    }
})
