import { Random } from "Core/random";
import { ParametricProductionRule } from "./types";

export function run_parametric_LSystem<Module>(
    on: Module[],
    rules: ParametricProductionRule<Module>[],
    with_random: Random = new Random(),
) {
    let index = 0;
    let res: Module[] = [];

    while (index < on.length) {
        const applicability_ratings = rules.map((r) =>
            r.applicability(on, index),
        );
        const max_precidence = Math.max(
            -1,
            ...applicability_ratings.map((r) => r.precidence),
        );

        if (max_precidence == -1) {
            res.push(on[index]!);
            index++;
            continue;
        }

        const applicable_index = with_random.weighted_choice(
            applicability_ratings.map((r) => {
                if (r.precidence < max_precidence) {
                    return 0;
                }

                return r.weight;
            }),
        );

        if (applicable_index < 0) {
            res.push(on[index]!);
            index++;
            continue;
        }

        const applied = rules[applicable_index]!.apply(on, index);
        res.push(...applied.modules);
        index += Math.max(applied.offset, 1);
    }

    return res;
}
