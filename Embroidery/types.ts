import { Json, Sketch, SVG_Builder } from "@/Core";
import { Embroidery } from "./Lib/embroidery";

export type EmbroideryReturnPrimitive = Sketch | Embroidery | SVG_Builder;
export type EmbroideryReturnType =
    | EmbroideryReturnPrimitive
    | EmbroideryReturnPrimitive[];

export type EmbroideryFunction<T extends Json> = (
    config: T,
) => EmbroideryReturnType;
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
