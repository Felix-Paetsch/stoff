export const constEmbroideryConfig = {
    project: "Buffer",
    file: "./out/Fuchs Grafiti.DST",
    buffer: [0.15, -0.15],
    concavity: 0.1,
    length_theshold: 0.3,
    smooth_hull: 0,
    smooth_buffer: 0,
} as const;

type DeepMutable<T> = T extends Function
    ? T
    : T extends readonly (infer U)[]
      ? DeepMutable<U>[]
      : T extends object
        ? { -readonly [K in keyof T]: DeepMutable<T[K]> }
        : T;

export const embroideryConfig = constEmbroideryConfig as any as DeepMutable<
    typeof constEmbroideryConfig
>;
