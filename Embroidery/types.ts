import { DST } from "@/Core/embroidery";
import { Sketch } from "@/Core/sketch";
import { SVG_Builder } from "@/Core/svg";
import { Json } from "@/Core/utils";
import { Embroidery } from "../Core/embroidery/embroidery";

export type EmbroideryReturnPrimitive = Sketch | Embroidery | SVG_Builder | DST;
export type EmbroideryReturnType =
    | EmbroideryReturnPrimitive
    | EmbroideryReturnPrimitive[]
    | void;

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
