import { BaseMeasurements } from "../../Data/base_measurements";

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

export function ExtractShirtSideMeasurement(
    mea: BaseMeasurements,
    key: keyof BaseMeasurements | keyof typeof shorthand_map,
    side: "front" | "back" = "front",
): number {
    if (!Object.keys(shorthand_map).includes(key)) {
        return mea[key as keyof BaseMeasurements] as BaseMeasurements[keyof BaseMeasurements];
    }

    const shorthand_result = shorthand_map[key as keyof typeof shorthand_map];
    if (typeof shorthand_result == "string") {
        return mea[shorthand_result];
    }

    return mea[shorthand_result[side == "front" ? 0 : 1]];
}

export function BoundShirtSideMeasurements(
    mea: BaseMeasurements,
    bound_side?: "front" | "back",
) {
    return (
        key: keyof typeof shorthand_map | keyof BaseMeasurements,
        side: "front" | "back" | undefined = bound_side,
    ) => ExtractShirtSideMeasurement(mea, key, side);
}

export type BoundShirtSideMeasurements = ReturnType<
    typeof BoundShirtSideMeasurements
>;
