import { PartitionFunction } from "./index";
import { sort_in_place } from "./permutation";

export function sort_numbers_partition_wrapper(
    numbers: number[],
    fn: (s: number[]) => PartitionFunction,
): PartitionFunction {
    const perm = sort_in_place(numbers, (a, b) => a - b);
    const pfn = fn(numbers);
    return (n: number) => {
        const res = pfn(n);
        perm.inverse_apply(res);
        return res;
    };
}

export function normalize_partition_wrapper(
    numbers: number[],
    fn: (s: number[]) => PartitionFunction,
) {
    const pfn = fn(numbers);
    return (n: number) => {
        const res = pfn(n);
        let sum = 0;
        for (let i = 0; i < res.length; i++) {
            if (isFinite(res[i]!)) {
                sum += res[i]!;
                continue;
            }

            return res.map((_, j) => (j == i ? 1 : 0));
        }

        const total = res.reduce((a, b) => a + b, 0);
        return res.map((v) => v / total);
    };
}
