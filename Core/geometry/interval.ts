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

export function merge(i: Interval, ...intervals: Interval[]): Interval {
    const [x, y] = intervals.reduce(
        ([x, y], [x2, y2]) => [Math.min(x, x2), Math.max(y, y2)],
        i,
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
