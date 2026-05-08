export const Bounds = {
    max_iterations: 1_000_000,
    guard_inf_loop: (max_it?: number) => {
        const max_it_num = max_it ?? Bounds.max_iterations;
        const it_fn = iteration_guard_gen(max_it_num);
        return () => {
            it_fn.next();
            return true;
        };
    },
};

function* iteration_guard_gen(n: number) {
    for (let i = 0; i < n; i++) {
        yield;
    }

    throw new Error("To many iterations; Max Iterations: " + n);
}
