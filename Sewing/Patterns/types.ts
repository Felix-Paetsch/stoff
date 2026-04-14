import { Json, Sketch } from "@/Core";

export type PatternFunction<T extends Json> = (config: T) => Sketch | Sketch[];
export type Pattern<S extends string, T extends Json> = {
    name: S;
    pattern: PatternFunction<T>;
};

export function definePattern<S extends string, T extends Json>(
    name: S,
    pattern: PatternFunction<T>,
): Pattern<S, T> {
    return {
        name,
        pattern,
    };
}
