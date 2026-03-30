import { SearchResult, TerminationCriteria } from ".";

const TotalMaxIterations = 10001;

export function binary(
    f: (x: number) => number,
    target: number,
    interval: [number, number],
    stop_criteria: TerminationCriteria = {},
): SearchResult {
    let [a, b] = interval;

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

    let fa = f(a) - target;
    let fb = f(b) - target;

    if (fa === 0)
        return {
            x: a,
            fx: target,
            terminationReason: "distance",
        };
    if (fb === 0)
        return {
            x: b,
            fx: target,
            terminationReason: "distance",
        };

    if (fa * fb > 0) {
        let x = (interval[0] + interval[1]) / 2;
        return {
            x,
            fx: f(x),
            terminationReason: "method_error",
        };
    }

    let prevMid = a;
    let prevFm = fa;

    let i = 0;

    for (; i < iterations && i < TotalMaxIterations; i++) {
        const mid = (a + b) / 2;
        const fmid = f(mid);
        const fm = fmid - target;

        if (stop_criteria.x_change !== undefined) {
            if (Math.abs(mid - prevMid) <= x_change)
                return {
                    x: mid,
                    fx: fmid,
                    terminationReason: "x_change",
                };
        }

        if (stop_criteria.y_change !== undefined) {
            if (Math.abs(fm - prevFm) <= y_change)
                return {
                    x: mid,
                    fx: fmid,
                    terminationReason: "y_change",
                };
        }

        if (Math.abs(fm) <= distance)
            return {
                x: mid,
                fx: fmid,
                terminationReason: "distance",
            };

        if (fa * fm < 0) {
            b = mid;
            fb = fm;
        } else {
            a = mid;
            fa = fm;
        }

        prevMid = mid;
        prevFm = fm;
    }

    const x = (a + b) / 2;
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
