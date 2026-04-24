import { Threads } from "..";
import { Color } from "./color";
import { Vector } from "./vec";

export type Embroidery = {
    stitch_count: () => number;
    bounding_box: () => {
        center: Vector;
        width: number;
        height: number;
        top_left: Vector;
        top_right: Vector;
        bottom_left: Vector;
        bottom_right: Vector;
        min_x: number;
        max_x: number;
        min_y: number;
        max_y: number;
    };
    threads: {
        color: Color;
        runs: {
            map: (fn: (v: Vector) => Vector) => {
                vertices: Vector[];
            };
        }[];
    }[];
};

export function to_embroidery_interface(threads: Threads): Embroidery {
    return {
        stitch_count: () => {
            let res = 0;
            for (const t of threads) {
                for (const r of t.runs) {
                    res += r.length + 1;
                }
            }

            return res;
        },
        bounding_box: () => {
            let min_x = Infinity;
            let max_x = -Infinity;
            let min_y = Infinity;
            let max_y = -Infinity;

            for (const t of threads) {
                for (const r of t.runs) {
                    for (const [x, y] of r) {
                        min_x = Math.min(min_x, x);
                        max_x = Math.max(max_x, x);
                        min_y = Math.min(min_y, y);
                        max_y = Math.max(max_y, y);
                    }
                }
            }

            return {
                center: new Vector((min_x + max_x) / 2, (max_y + max_y) / 2),
                width: max_x - min_x,
                height: max_y - min_y,
                top_left: new Vector(min_x, min_y),
                top_right: new Vector(max_x, min_y),
                bottom_left: new Vector(min_x, max_y),
                bottom_right: new Vector(max_x, max_y),
                min_x,
                max_x,
                min_y,
                max_y,
            };
        },
        threads: threads.map((t) => {
            const runs = t.runs.map((r) => {
                return {
                    vertices: r.map((p) => new Vector(p[0], p[1])),
                };
            });
            return {
                color: t.color as Color,
                runs: runs.map((r) => ({
                    map: (fn) => ({
                        vertices: r.vertices.map(fn),
                    }),
                })),
            };
        }),
    };
}
