import { Random } from "Core/random";
import { StringProductionRule } from "./types";

export function run_string_LSystem(
    on: string,
    rules: StringProductionRule[],
    with_random: Random = new Random(),
) {
    let index = 0;
    let res: string = "";

    while (index < on.length) {
        const applicability_ratings = rules.map((r) =>
            r.applicability(on, index),
        );
        const max_precidence = Math.max(
            -1,
            ...applicability_ratings.map((r) => r.precidence),
        );

        if (max_precidence == -1) {
            res += on[index]!;
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
            res += on[index]!;
            index++;
            continue;
        }

        const applied = rules[applicable_index]!.apply(on, index);
        res += applied.modules;
        index += Math.max(applied.offset, 1);
    }

    return res;
}
