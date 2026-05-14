const constPatternConfig = {
    pattern: "TShirt",

    pattern_for: "Felix",

    "Darts fitted": "0_nothing",
    "Darts standard": "0_nothing",
    "Darts wide": "0_nothing",

    Fancy: "0_none",
    Main_Body: "fitted",
    Neckline: "round",
    Sleeves: "0_standard_kurz",
    output_filepath: "out/felix_back.dst",
    side: "back",
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
