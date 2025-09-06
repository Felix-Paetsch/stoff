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