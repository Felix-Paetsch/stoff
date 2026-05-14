import { DST, PlaneLine } from "@/Core";
import { Out } from "@/Dev";
import { add_seam_allowance } from "Sewing/Lib/add_seam_allowance";
import { BaseMeasurements } from "../../Data/base_measurements";
import { definePattern } from "../types";
import { construct_base_tshirt_parts } from "./construct_base_parts";
import { BoundShirtSideMeasurements } from "./measurement_utils";
import { people_measurements } from "Sewing/Data/measurements";

export type TShirtPatternConfig = {
    pattern_for: keyof typeof people_measurements,
    "Darts fitted": "0_nothing";
    "Darts standard": "0_nothing";
    "Darts wide": "0_nothing";

    Fancy: "0_none";
    Main_Body: "fitted";
    Neckline: "round";
    Sleeves: "0_standard_kurz";
};

export const TShirtPattern = definePattern(
    "TShirt" as const,
    (cfg: TShirtPatternConfig) => {
        // const gr = Recording.start_global_recording();
        // Out.put(gr);

        // Note: You probably really want to change this method up. The calculations don't seem structured currently
        // I.g. think about how - "scientifically" to modify/calculate measurements.
        // Basically what it does is:
        // a) ShirtDeriveMeasurements
        //    - builds new measurements out of existing ones
        //    - adds new derived measurements
        // b) Returns a functiuon to get the measurement for a ceratain key based on a side
        //    - Note that this is typesafe, so you can only input valid keys
        const mea = BoundShirtSideMeasurements(people_measurements[cfg.pattern_for], "front");
        const r = construct_base_tshirt_parts(mea);
        add_seam_allowance(r, 0.7);

        const dst = new DST();
        for (const l of r.sketch.lines()) {
            l.update_shape(l.shape.resample(0.04));
            dst.run(l.shape.as_polyline().map((v) => v.scale(100).mirror_at(PlaneLine.HORIZONTAL)));
        }
        Out.put(dst);
        dst.to_file("out/leonie_front.dst");

        return r;
    },
);
