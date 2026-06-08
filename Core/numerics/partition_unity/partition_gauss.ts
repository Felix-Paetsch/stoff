import { Expect } from "Core/expect";
import { PartitionFunction } from "./index";
import { sort_in_place } from "./permutation";

export function partition_unity_gauss(
    s: number[],
    sigmas: null | number[] | number = null,
): PartitionFunction {
    Expect.that(s.length > 0);

    const perm = sort_in_place(s, (a, b) => a - b);
    if (Array.isArray(sigmas)) {
        perm.apply(sigmas);
    }

    if (sigmas == null) {
        let avgDist = 0;
        for (let i = 0; i < s.length - 1; i++) {
            avgDist += s[i + 1]! - s[i]!;
        }
        avgDist /= s.length - 1;
        sigmas = avgDist / 2;
    }
    if (typeof sigmas == "number") {
        let n = sigmas;
        sigmas = s.map((_) => n);
    }

    const pfn = partition_unity_gauss_sorted(s, sigmas);

    return (n: number) => {
        const res = pfn(n);
        perm.inverse_apply(res);
        return res;
    };
}

function partition_unity_gauss_sorted(
    centers: number[],
    sigmas: number[],
): PartitionFunction {
    return (x: number): number[] => {
        const weights = centers.map((center, i) => {
            const sigma = sigmas[i]!;
            const diff = x - center;
            return Math.exp(-(diff * diff) / (2 * sigma * sigma));
        });

        // Normalize to create partition of unity (sum = 1)
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);

        if (totalWeight === 0) {
            // If all weights are zero (e.g., x is extremely far from all centers),
            // find the closest center and give it weight 1
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
