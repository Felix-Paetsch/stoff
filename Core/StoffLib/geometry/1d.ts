export type Interval = [number, number];
export type Fraction = number;

export function merge_intervals(...intervals: Interval[]): Interval {
    const [x, y] = intervals.reduce(([x, y], [x2, y2]) => [Math.min(x, x2), Math.max(y, y2)], [Infinity, -Infinity]);
    return [x, y];
}

export function interval_overlap(i: Interval, ...intervals: Interval[]): Interval {
    intervals.push(i);
    const x = Math.max(...intervals.map(i => i[0]));
    const y = Math.min(...intervals.map(i => i[1]));
    return [Math.min(x, y), Math.max(x, y)];
}

export function pythagoras([w1, w2]: Interval, [h1, h2]: Interval): number;
export function pythagoras(w: number, h: number): number;
export function pythagoras(w: any, h: any): number {
    if (typeof w !== "number") {
        return pythagoras(w[0] - w[1], h[0] - h[1]);
    }

    return Math.sqrt(w * w + h * h);
}

export function pythagorasN([h1, h2]: Interval, [c1, c2]: Interval): number;
export function pythagorasN(c: number, a: number): number;
export function pythagorasN(c: any, a: any): number {
    if (typeof c !== "number") {
        return pythagorasN(c[0] - c[1], a[0] - a[1]);
    }

    return Math.sqrt(c * c - a * a);
}

export function lerp(a: number, b: number, amt: number): number {
    return a * (1 - amt) + b * amt;
}
