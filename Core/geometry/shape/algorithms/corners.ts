import { EPS } from "../../../index";
import { Radians } from "../../types";
import { Vector } from "../../vector";
import { Shape } from "../shape";
import { get_appreciable_corner } from "./appreciable_line_segment";

export function shape_corners(
    s: Shape.Shape,
    threshold_angle: Radians,
): Shape.ShapePosition[] {
    const all_corners: Shape.ShapePosition[] = [];

    for (let i = 0; i < s.verticies.length; i++) {
        const corner = get_appreciable_corner(s, i);
        if (!corner) continue;
        if (
            Vector.angle(corner[0][0], corner[1][1], corner[0][1]) >
            threshold_angle
        ) {
            all_corners.push({
                vec: corner[0][1],
                index: i,
                frac: 0,
            });
        }
    }

    const res_corners: Shape.ShapePosition[] = [];

    const current_eps_corners: Shape.ShapePosition[] = [];
    while (all_corners.length > 0) {
        if (all_corners.length < 2) {
            res_corners.push(all_corners.shift()!);
            break;
        }

        if (all_corners[0]!.vec.distance(all_corners[1]!.vec) > EPS.tiny) {
            res_corners.push(all_corners.shift()!);
            continue;
        }

        current_eps_corners.push(all_corners.shift()!);
        while (
            all_corners.length > 0 &&
            all_corners[0]!.vec.distance(
                current_eps_corners[current_eps_corners.length - 1]!.vec,
            ) < EPS.tiny
        ) {
            current_eps_corners.push(all_corners.shift()!);
        }

        res_corners.push(mix_eps_corners(s, current_eps_corners));
        current_eps_corners.length = 0;
    }

    return [];
}

function mix_eps_corners(
    s: Shape,
    c: Shape.ShapePosition[],
): Shape.ShapePosition {
    let min_index = c[0]!.index;
    let max_index = c[c.length - 1]!.index;
    let avg = Math.floor((min_index + max_index) / 2);
    return {
        vec: s.verticies[avg]!,
        index: avg,
        frac: 0,
    };
}
