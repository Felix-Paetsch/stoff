import { Expect } from "Core/expect";
import { Interval } from "../index";
import { PartitionFunction } from "./index";
import { sort_numbers_partition_wrapper } from "./wrapper";

export function partition_unity_linear(s: number[]): PartitionFunction {
    Expect.that(s.length > 0);

    return sort_numbers_partition_wrapper(s, partition_unity_linear_sorted);
}

function partition_unity_linear_sorted(s: number[]) {
    return (n: number) => {
        if (n <= s[0]!) return s.map((_, i) => (i == 0 ? 1 : 0));
        for (let i = 0; i < s.length - 1; i++) {
            if (n < s[i + 1]!) {
                continue;
            }

            const left_component = Interval.inverse_lerp(s[i]!, s[i + 1]!, n);
            return s.map((_, j) => {
                if (j == i) return left_component;
                if (j == i + 1) return 1 - left_component;
                return 0;
            });
        }
        return s.map((_, i) => (i == s.length - 1 ? 1 : 0));
    };
}
