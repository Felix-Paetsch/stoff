import { Random } from "Core/random";

export type Char = string;
export type StringToCharUnion<S extends string> =
    S extends `${infer C}${infer Rest}` ? C | StringToCharUnion<Rest> : never;

export interface StringProductionRule {
    applicability(
        modules: string,
        index: number,
    ): {
        precidence: number;
        weight: number;
    };

    apply(
        modules: string,
        index: number,
    ): {
        modules: string;
        offset: number;
    };
}

export type StringLSystem<_Alphabet extends Char> = (
    run_on: string,
    iterations?: number,
    with_random?: Random,
) => string;
