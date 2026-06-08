import { Expect } from "Core/expect";
import { PartitionFunction } from "./index";
import { sort_in_place } from "./permutation";

export function partition_unity_shepard(
    s: number[],
    power: null | number = 2,
    epsilon: null | number = 1e-8,
): PartitionFunction {
    Expect.that(s.length > 0);

    const perm = sort_in_place(s, (a, b) => a - b);

    if (power == null) {
        power = 2;
    }
    if (epsilon == null) {
        epsilon = 1e-8;
    }

    const pfn = partition_unity_shepard_sorted(s, power, epsilon);

    return (n: number) => {
        const res = pfn(n);
        perm.inverse_apply(res);
        return res;
    };
}

function partition_unity_shepard_sorted(
    centers: number[],
    power: number,
    epsilon: number,
): PartitionFunction {
    return (x: number): number[] => {
        const weights = centers.map((center) => {
            const diff = Math.abs(x - center);
            return 1 / (Math.pow(diff, power) + epsilon);
        });

        // Normalize to create partition of unity (sum = 1)
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        if (totalWeight === 0) {
            // This shouldn't happen with epsilon > 0, but as a safeguard:
            const closestIdx = centers
                .map((center, i) => ({ dist: Math.abs(x - center), idx: i }))
                .sort((a, b) => a.dist - b.dist)[0]!.idx;

            const result = new Array(centers.length).fill(0);
            result[closestIdx] = 1;
            return result;
        }

        return weights.map((w) => w / totalWeight);
    };
}
