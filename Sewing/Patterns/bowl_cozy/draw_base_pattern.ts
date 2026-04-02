import {
    Bowl_Measurements,
    calculate_sidelengths,
} from "./calculate_sidelengths";
import { BowlCozyConfig } from ".";
import { Sketch } from "@/Core/sketch/sketch";
import { get_points } from "@/Core/sketch/collection";
import { deg_to_rad, Vector } from "@/Core/geometry";

export function draw_base_pattern(s: Sketch, cfg: BowlCozyConfig) {
    const mea = calculate_sidelengths(cfg);

    draw_top_square(s, mea);
    draw_center_points(s, mea);
    draw_darts(s);
}

function draw_darts(s: Sketch) {
    for (let i = 0; i < 4; i++) {
        const center = get_points(s, {
            side: "" + i,
            type: "center",
        })[0]!;

        const dart = get_points(s, {
            side: "" + i,
            dart: "true",
        });

        dart.forEach((p) => {
            s.line_between_points(center, p);
        });
    }
}

function draw_center_points(s: Sketch, m: Bowl_Measurements) {
    const center = new Vector(m.top_sidelength / 2, m.top_sidelength / 2);
    let offset = new Vector(0, -m.dart_diagonal);

    for (let i = 0; i < 4; i++) {
        const inner_pt = s.add_point(center.add(offset));
        inner_pt.data.side = "" + i;
        inner_pt.data.type = "center";
        offset = offset.rotate(deg_to_rad(90));
    }
}

function draw_top_square(s: Sketch, m: Bowl_Measurements) {
    const pts = [
        s.point(0, 0),
        s.point(m.top_sidelength, 0),
        s.point(m.top_sidelength, m.top_sidelength),
        s.point(0, m.top_sidelength),
    ] as const;

    for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i]!;
        const p2 = pts[(i + 1) % pts.length]!;

        const p_left = s.add_point(
            Vector.lerp_abs(p1, p2, m.top_sidelength / 2 - m.dart_base),
        );
        const p_mid = s.add_point(Vector.add(p1, p2).scale(0.5));
        const p_right = s.add_point(
            Vector.lerp_abs(p1, p2, m.top_sidelength / 2 + m.dart_base),
        );

        p1.data.type = "top_corner";
        p1.data.side = "" + i;

        p_left.data.type = "dart_base";
        p_left.data.dart = "true";
        p_left.data.side = "" + i;

        p_mid.data.type = "dart_middle";
        p_mid.data.dart = "true";
        p_mid.data.side = "" + i;

        p_right.data.type = "dart_base";
        p_right.data.dart = "true";
        p_right.data.side = "" + i;

        const side_pts = [p1, p_left, p_mid, p_right, p2];

        for (let j = 0; j < side_pts.length - 1; j++) {
            s.line_between_points(side_pts[j]!, side_pts[j + 1]!);
        }
    }
}
