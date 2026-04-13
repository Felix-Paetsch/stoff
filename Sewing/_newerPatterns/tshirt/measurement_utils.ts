import { BaseMeasurements } from "../base_measurements";

export function ShirtDerivedMeasurements(mea: BaseMeasurements) {
    const half = mea.under_bust / 2;

    const bustWidthFront =
        mea.bust_width - (half + 2);
    const bustWidthBack =
        mea.bust_width - bustWidthFront;

    const waistWidthFront =
        mea.waist_width - (half - 5);
    const waistWidthBack =
        mea.waist_width - waistWidthFront;

    const ratio = bustWidthFront / bustWidthBack;

    return {
        ...mea,

        arm: mea.arm + 2,
        "arm length": mea["arm length"] + 4,
        wristwidth: mea.wristwidth + 3,
        ellbow_width: mea.ellbow_width + 4,

        bust_width_front: bustWidthFront,
        bust_width_back: bustWidthBack,
        waist_width_front: waistWidthFront,
        waist_width_back: waistWidthBack,
        ratio
    }
}
export type ShirtDerivedMeasurements = ReturnType<typeof ShirtDerivedMeasurements>;

type SDMK = keyof ShirtDerivedMeasurements;
const shorthand_map = {
    center: ["center_height_front", "center_height_back"],
    shoulder: ["shoulder_height_front", "shoulder_height_back"],
    across: ["across_front", "across_back"],
    bust: ["bust_width_front", "bust_width_back"],
    diagonal: ["diagonal_front", "diagonal_back"],
    point_width: ["bust_point_width", "shoulderblade_width"],
    point_height: ["bust_point_height", "shoulderblade_height"],
    waist: ["waist_width_front", "waist_width_back"],
    bottom: ["bottom_width_front", "bottom_width_back"],
    over_bust: ["over_bust_front", "over_bust_back"],
    belly: ["belly_front", "belly_back"],
} as const;

export function ExtractShirtSideMeasurement(sdm: ShirtDerivedMeasurements, key: keyof typeof shorthand_map | SDMK, side: "front" | "back" = "front") {
    if (!Object.keys(shorthand_map).includes(key)) {
        return sdm[key as SDMK] as ShirtDerivedMeasurements[SDMK];
    }

    const shorthand_result = shorthand_map[key as keyof typeof shorthand_map];
    if (typeof shorthand_result == "string") {
        return sdm[shorthand_result];
    }

    return sdm[shorthand_result[side == "front" ? 0 : 1]];
}

export function is_shirt_derived_measurements(m: BaseMeasurements): m is ShirtDerivedMeasurements {
    const m_keys = Object.keys(m);
    return Object.keys(shorthand_map).every(sh_key => m_keys.includes(sh_key));
}

export function BoundShirtSideMeasurements(mea: BaseMeasurements | ShirtDerivedMeasurements, bound_side?: "front" | "back") {
    const derived_mea = is_shirt_derived_measurements(mea) ? mea : ShirtDerivedMeasurements(mea);
    return (key: keyof typeof shorthand_map | SDMK, side: "front" | "back" | undefined = bound_side) => ExtractShirtSideMeasurement(derived_mea, key, side)
}

export type BoundShirtSideMeasurements = ReturnType<typeof BoundShirtSideMeasurements>
