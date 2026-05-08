// Left side is always expected to be smaller than right side
export type Interval = [number, number];
export const UnitInterval: Interval = [0, 1];
export type Fraction = number;

export function remap(from: Interval, to: Interval): (x: number) => number {
    return (x) => lerp(from[0], from[1], (x - to[0]) / (to[1] - to[0]));
}

export function lerp(a: number, b: number, amt: Fraction): number {
    return a * (1 - amt) + b * amt;
}

export function lerp_abs(a: number, b: number, amt: number): number {
    return lerp(a, b, amt / (b - a));
}

export function merge(...intervals: Interval[]): Interval {
    const [x, y] = intervals.reduce(
        ([x, y], [x2, y2]) => [Math.min(x, x2), Math.max(y, y2)],
        [Infinity, -Infinity],
    );
    return [x, y];
}

export function overlap(...intervals: Interval[]): Interval {
    const x = Math.max(...intervals.map((i) => i[0]));
    const y = Math.min(...intervals.map((i) => i[1]));
    return [Math.min(x, y), Math.max(x, y)];
}

export function clamp(at: Interval, number: number): number {
    return Math.min(Math.max(number, at[0]), at[1]);
}

export function generic_position(range: Interval, excluding: number[]): number {
    const min_guaranteed_len =
        (0.9 * (range[1] - range[0])) / (excluding.length + 1);
    excluding = [...excluding];
    excluding.sort();
    excluding.push(range[1]);
    excluding.unshift(range[0]);

    for (let i = 0; i < excluding.length - 1; i++) {
        if (excluding[i + 1]! - excluding[i]! > min_guaranteed_len) {
            return (excluding[i + 1]! + excluding[i]!) / 2;
        }
    }

    return (range[1] + range[0]) / 2;
}
