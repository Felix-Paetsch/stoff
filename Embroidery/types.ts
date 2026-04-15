import { Json, Sketch } from "@/Core";

export type EmbroideryFunction<T extends Json> = (
    config: T,
) => Sketch | Sketch[];
export type EmbroideryProject<S extends string, T extends Json> = {
    name: S;
    embroidery: EmbroideryFunction<T>;
};

export function defineEmbroidery<S extends string, T extends Json>(
    name: S,
    embroidery: EmbroideryFunction<T>,
): EmbroideryProject<S, T> {
    return {
        name,
        embroidery,
    };
}
