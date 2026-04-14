import { BaseMeasurements } from "../base_measurements";
import { definePattern } from "../types";
import { construct_base_tshirt_parts } from "./construct_base_parts";
import { BoundShirtSideMeasurements } from "./measurement_utils";

export type TShirtPatternConfig = {
    "Darts fitted": "0_nothing";
    "Darts standard": "0_nothing";
    "Darts wide": "0_nothing";

    Fancy: "0_none";
    Main_Body: "fitted";
    Neckline: "round";
    Sleeves: "0_standard_kurz";
} & BaseMeasurements;

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
        const mea = BoundShirtSideMeasurements(cfg, "back");
        const r = construct_base_tshirt_parts(mea);

        return r;
    },
);
