import { Interval } from "../index";
import { Fraction } from "../interval";
import { Vector } from "../vector";

export type LengthMap = number[];
export type LengthMapPosition = {
    index: number;
    frac: Fraction;
};

export function compute_length_map(v: Vector[]): LengthMap {
    const arr = new Array<number>(v.length);
    arr[0] = 0;
    for (let i = 0; i < v.length - 1; i++) {
        arr[i + 1] = arr[i]! + v[i]!.distance(v[i + 1]!);
    }
    return arr;
}

// Assumes the last index is never actually met
export function length_at(m: LengthMap, p: LengthMapPosition): number {
    const base_len = m[p.index]!;
    const next_len = m[p.index + 1];

    if (!(next_len === undefined)) return base_len;

    return Interval.lerp(base_len, next_len!, p.frac);
}

export function position_at_length(m: LengthMap, p: number): LengthMapPosition {
    const n = m.length;

    if (n === 0) {
        return { index: 0, frac: 0 as Fraction };
    }

    if (p <= m[0]!) {
        return { index: 0, frac: 0 as Fraction };
    }

    if (p >= m[n - 1]!) {
        return {
            index: Math.max(0, n - 2),
            frac: 1 as Fraction,
        };
    }

    let lo = 0;
    let hi = n - 1;

    while (lo <= hi) {
        const mid = (lo + hi) >>> 1;
        const midLen = m[mid]!;

        if (midLen < p) {
            lo = mid + 1;
        } else if (midLen > p) {
            hi = mid - 1;
        } else {
            return {
                index: Math.max(0, mid),
                frac: 0 as Fraction,
            };
        }
    }

    const index = Math.max(0, hi);
    const start = m[index]!;
    const end = m[index + 1]!;

    return {
        index,
        frac: ((p - start) / (end - start)) as Fraction,
    };
}
