import { Random } from "@/Core";
import { run_string_LSystem } from "./algorithm";
import {
    StringLSystem,
    StringProductionRule,
    StringToCharUnion,
} from "./types";

export function string_LSystem<T extends [string, string][]>(
    rules: T,
): StringLSystem<
    StringToCharUnion<T[number][0]> | StringToCharUnion<T[number][1]>
> {
    const parsed_rules: StringProductionRule[] = rules.map(parse_rule);
    return (
        run_on: string,
        iterations: number = 1,
        with_random: Random = new Random(),
    ) => {
        for (let i = 0; i < iterations; i++) {
            run_on = run_string_LSystem(run_on, parsed_rules, with_random);
        }
        return run_on;
    };
}

function parse_rule(r: [string, string]): StringProductionRule {
    if (!r[0].includes("<")) {
        return {
            apply: () => ({
                modules: r[1],
                offset: r[0].length,
            }),
            applicability: (modules: string, index: number) => {
                const can_apply = modules.slice(index).startsWith(r[0]);
                if (!can_apply) {
                    return {
                        precidence: -1,
                        weight: 0,
                    };
                }

                return {
                    precidence: r[0].length,
                    weight: 1,
                };
            },
        };
    }

    const re = /^(?<prefix>[^<]*)(?:<(?<mid>[^>]*)>)?(?<suffix>.*)$/;
    const match = r[0].match(re);

    if (!match?.groups) {
        throw new Error("Invalid context sensitive rule");
    }

    const prefix = match.groups.prefix!;
    const mid = match.groups.mid!;
    const suffix = match.groups.suffix!;

    return {
        apply: () => ({
            modules: r[1],
            offset: mid.length,
        }),
        applicability: (modules: string, index: number) => {
            const can_apply =
                index >= prefix.length &&
                modules
                    .slice(index - prefix.length)
                    .startsWith(prefix + mid + suffix);
            if (!can_apply) {
                return {
                    precidence: -1,
                    weight: 0,
                };
            }

            return {
                precidence: r[0].length - 2,
                weight: 1,
            };
        },
    };
}
