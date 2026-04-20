export const constEmbroideryConfig = {
    project: "Buffer",
    file: "./out/out.dst",
    buffer: 1,
    concavity: 2,
    length_theshold: 0.1,
    smooth_hull: 0.01,
    smooth_buffer: 0.2,
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
