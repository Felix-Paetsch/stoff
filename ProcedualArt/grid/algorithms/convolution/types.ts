export const CompassRotationAmounts = [
    "0",
    "45",
    "90",
    "135",
    "180",
    "225",
    "270",
    "315",
] as const;
export type CompassRotationAmount = (typeof CompassRotationAmounts)[number];
export const CompassDirections = [
    "N",
    "NE",
    "E",
    "SE",
    "S",
    "SW",
    "W",
    "NW",
] as const;
export type CompassDirection = (typeof CompassDirections)[number];

export function compass_rotation_amount(
    from: CompassDirection,
    to: CompassDirection,
): CompassRotationAmount {
    return CompassRotationAmounts[
        (CompassDirections.findIndex((a) => a == to)! -
            CompassDirections.findIndex((a) => a == from)) %
            8
    ]!;
}

export function rotate_compass_direction(
    d: CompassDirection,
    amt: CompassRotationAmount | number,
): CompassDirection {
    amt =
        typeof amt == "string" ? CompassRotationAmounts.indexOf(amt) || 0 : amt;
    const compass_direction_index = CompassDirections.indexOf(d)!;
    return CompassDirections[
        (compass_direction_index + amt) % CompassDirections.length
    ]!;
}
