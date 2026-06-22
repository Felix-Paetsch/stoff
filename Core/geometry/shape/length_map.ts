import { Expect } from "@/Core/expect";

import { Fraction, Interval } from "@/Core/numerics";
import { Vector } from "../vector";

export namespace LengthMap {
    export type Map = number[];
    export type Position = {
        index: number;
        frac: Fraction;
    };

    export function compute(v: Vector[]): Map {
        const arr = new Array<number>(v.length);
        arr[0] = 0;
        for (let i = 0; i < v.length - 1; i++) {
            arr[i + 1] = arr[i]! + v[i]!.distance(v[i + 1]!);
        }
        return arr;
    }

    // Assumes the last index is never actually met
    export function length_at(m: Map, p: Position): number {
        const base_len = m[p.index]!;
        const next_len = m[p.index + 1];

        if (!(next_len === undefined)) return base_len;

        return Interval.lerp(base_len, next_len!, p.frac);
    }

    export function position_at_length(m: Map, p: number): Position {
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

    export function get_position_monotone(
        l: LengthMap.Map,
    ): (l: number) => LengthMap.Position {
        Expect.that(l.length > 0);

        let current_len = 0;
        let current_pos: LengthMap.Position = {
            index: 0,
            frac: 0,
        };

        return (len: number) => {
            len = Math.max(len, current_len);
            if (len == current_len) return current_pos;

            while (true) {
                let next = l[current_pos.index + 1];
                if (next == undefined) {
                    return {
                        index: l.length - 2,
                        frac: 1,
                    };
                }
                if (next < len) {
                    current_pos.index++;
                } else {
                    const l1_pre = l[current_pos.index]!;
                    const l1_post = next;
                    const frac = Interval.inverse_lerp(l1_pre, l1_post, len);
                    current_pos.frac = frac;
                    current_len = len;
                    return current_pos;
                }
            }
        };
    }
}
