import { Random } from "@/Core";
import { run_parametric_LSystem } from "./algorithm";
import { ParametricLSystem, ParametricProductionRule } from "./types";

// The third entry is the weigth of the rule if several apply
export function parametric_LSystem<Module>(
    rules: ParametricProductionRule<Module>[],
): ParametricLSystem<Module> {
    return (
        run_on: Module[],
        iterations: number = 1,
        with_random: Random = new Random(),
    ) => {
        for (let i = 0; i < iterations; i++) {
            run_on = run_parametric_LSystem(run_on, rules, with_random);
        }
        return run_on;
    };
}
