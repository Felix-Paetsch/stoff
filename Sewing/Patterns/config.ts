const constPatternConfig = {
    pattern: "TShirt",

    "Darts fitted": "0_nothing",
    "Darts standard": "0_nothing",
    "Darts wide": "0_nothing",

    Fancy: "0_none",
    Main_Body: "fitted",
    Neckline: "round",
    Sleeves: "0_standard_kurz",

    over_bust_front: 45,
    over_bust_back: 46,
    belly_front: 45,
    belly_back: 40,

    shoulder_length: 13,
    shoulder_width: 40,
    bust_width: 95,
    under_bust: 82,
    bust_point_width: 19,
    bust_point_height: 17.5,
    shoulderblade_width: 12.5,
    shoulderblade_height: 14.5,
    waist_width: 78,
    waist_height: 20.5,
    shoulder_height_front: 44,
    shoulder_height_back: 38.5,
    center_height_front: 33,
    center_height_back: 36,
    across_front: 0,
    across_back: 32,
    diagonal_front: 44.5,
    diagonal_back: 37,
    side_height: 21.5,
    bottom_width_front: 50,
    bottom_width_back: 55,

    arm: 31,
    "arm length": 56.5,
    wristwidth: 20.5,
    ellbow_width: 26,
    ellbow_length: 32,
} as const;

type DeepMutable<T> = T extends Function
    ? T
    : T extends readonly (infer U)[]
      ? DeepMutable<U>[]
      : T extends object
        ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
        : T;

export const patternConfig = constPatternConfig as any as DeepMutable<
    typeof constPatternConfig
>;
