export type Permutation = {
    apply: (on: any[]) => void;
    inverse_apply: (on: any[]) => void;
};

export function sort_in_place<T>(
    what: T[],
    cb: (a: T, b: T) => number,
): Permutation {
    const indices = what.map((_, i) => i);
    indices.sort((a, b) => cb(what[a]!, what[b]!));
    what.sort(cb);
    const inverse_indices = new Array(indices.length);
    for (let i = 0; i < indices.length; i++) {
        inverse_indices[indices[i]!] = i;
    }

    return {
        apply(on: any[]): void {
            const copy = [...on];
            for (let i = 0; i < indices.length; i++) {
                on[i] = copy[indices[i]!];
            }
        },

        inverse_apply(on: any[]): void {
            const copy = [...on];
            for (let i = 0; i < inverse_indices.length; i++) {
                on[i] = copy[inverse_indices[i]!];
            }
        },
    };
}
