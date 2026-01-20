import { people_measurements } from "@/Data/measurements"

export const DEFAULT_DESIGN_CONFIG = {
    pattern_name: "T-Shirt",

    "Darts fitted": "0_nothing",
    "Darts standard": "0_nothing",
    "Darts wide": "0_nothing",
    Fancy: "0_none",
    Main_Body: "fitted",
    Neckline: "round",
    Sleeves: "0_standard_kurz",
} as const;

export const DEFAULT_MEASUREMENTS = people_measurements.Leonie;
