import { Json, Sketch } from "../../Core";

export type PatternFunction<T extends Json> = (config: T) => Sketch | Sketch[];
export type Pattern<T extends Json> = {
    name: string;
    pattern: PatternFunction<T>;
};

export function definePattern<T extends Json>(
    name: string,
    pattern: PatternFunction<T>,
): Pattern<T> {
    return {
        name,
        pattern,
    };
}
