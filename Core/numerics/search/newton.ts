import { SearchResult, TerminationCriteria } from ".";

const TotalMaxIterations = 10001;

export function newton(
    f: (x: number) => number,
    f_prime: (x: number) => number,
    target: number,
    initial_guess: number = 0,
    stop_criteria: TerminationCriteria = {},
): SearchResult {
    let iterations = stop_criteria.iterations ?? 5;

    const x_change = stop_criteria.x_change ?? 0;
    const y_change = stop_criteria.y_change ?? 0;
    const distance = stop_criteria.distance ?? 0;

    const hasOnlyNonIterationCriteria =
        (stop_criteria.x_change !== undefined ||
            stop_criteria.y_change !== undefined ||
            stop_criteria.distance !== undefined) &&
        stop_criteria.iterations === undefined;

    if (hasOnlyNonIterationCriteria) {
        iterations = TotalMaxIterations;
    }

    let x = initial_guess;
    let i = 0;

    for (; i < iterations && i < TotalMaxIterations; i++) {
        const fx = f(x) - target;
        const fpx = f_prime(x);

        if (fpx === 0) {
            throw new Error("Derivative is zero; Newton's method fails.");
        }

        const next = x - fx / fpx;
        const next_fx = f(next) - target;

        if (Math.abs(next - x) <= x_change)
            return {
                x: next,
                fx: next_fx,
                terminationReason: "x_change",
            };

        if (Math.abs(next_fx - fx) <= y_change)
            return {
                x: next,
                fx: next_fx,
                terminationReason: "y_change",
            };

        if (Math.abs(next_fx) <= distance)
            return {
                x: next,
                fx: next_fx,
                terminationReason: "distance",
            };

        x = next;
    }

    if (i < TotalMaxIterations) {
        return {
            x: x,
            fx: f(x),
            terminationReason: "iterations",
        };
    }

    return {
        x: x,
        fx: f(x),
        terminationReason: "hard_stop",
    };
}
