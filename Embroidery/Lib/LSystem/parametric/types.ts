import { Random } from "Core/random";

export interface ParametricProductionRule<Module> {
    applicability(
        modules: Module[],
        index: number,
    ): {
        precidence: number;
        weight: number;
    };

    apply(
        modules: Module[],
        index: number,
    ): {
        modules: Module[];
        offset: number;
    };
}

export type ParametricLSystem<Module> = (
    run_on: Module[],
    iterations?: number,
    with_random?: Random,
) => Module[];
