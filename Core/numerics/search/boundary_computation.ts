import { Interval } from "@/Core";

const TotalMaxIterations = 10001;

export function monotone_boundary_computation(
    f: (x: number) => number,
    target: number,
    initial_guess: number,
    initial_step: number = 1,
): Interval.Interval {
    let x0 = initial_guess;
    let f0 = f(x0) - target;

    if (f0 === 0) {
        return [x0, x0];
    }

    // Determine search direction (monotone assumption)
    let step = initial_step;
    let x1 = x0 + step;
    let f1 = f(x1) - target;

    if (f1 === 0) return [x1, x1];

    // If we already bracketed, return
    if (f0 * f1 < 0) {
        return x0 < x1 ? [x0, x1] : [x1, x0];
    }

    // Decide direction
    const direction = f1 > f0 ? 1 : -1;

    // Ensure we move in the correct direction
    if ((f0 < 0 && direction < 0) || (f0 > 0 && direction > 0)) {
        step = -step;
        x1 = x0 + step;
        f1 = f(x1) - target;

        if (f1 === 0) return [x1, x1];
        if (f0 * f1 < 0) {
            return x0 < x1 ? [x0, x1] : [x1, x0];
        }
    }

    let currX = x1;
    let currF = f1;

    for (let i = 0; i < TotalMaxIterations; i++) {
        step *= 2;
        const nextX = currX + step;
        const nextF = f(nextX) - target;

        if (nextF === 0) return [nextX, nextX];

        if (currF * nextF < 0) {
            return currX < nextX ? [currX, nextX] : [nextX, currX];
        }

        currX = nextX;
        currF = nextF;
    }

    return [-Infinity, Infinity];
}
