import { Ray, UP, DOWN, vec_angle_clockwise } from "../../StoffLib/geometry.js";
import Face from "../../StoffLib/unicorns/faces/face";

export default function get_boundary(s) {
    // Later if we get problems maybe shift pivot to not lie directly above another point
    const bb = s.get_bounding_box();
    const pivot = bb.top_left.add(bb.top_right).scale(0.5).add(UP);

    const ray = new Ray(pivot, DOWN);
    const lines = s.lines;
    const lines_intp = [];
    for (let i = 0; i < lines.length; i++) {
        s.intersection_positions(lines[i], ray).forEach((p) =>
            lines_intp.push([lines[i], p])
        );
    }

    lines_intp.sort((a, b) => a[1].distance(pivot) - b[1].distance(pivot));
    const top_line = lines_intp[0][0];

    const b1 = calculate_boundary_assuming_direction(top_line, true);
    const b2 = calculate_boundary_assuming_direction(top_line, false);

    let ret = b2 || b1;
    if (!ret) return null;
    if (b1 && b2) {
        for (let i = 0; i < b1.length; i++) {
            // If all of b1 is included inside b2, we choose b2. (Think a Zig-Zag)
            if (!b2.includes[b1[i]]) {
                if (
                    s
                        .new_sketch_element_collection(b2)
                        .convex_hull()
                        .contains(b1[i].position_at_fraction(0.5))
                ) {
                    ret = b2;
                } else {
                    ret = b1;
                }
                break;
            }
        }
    }

    return Face(ret);
}

function calculate_boundary_assuming_direction(line, direction) {
    const ret = [line];

    let current_point = direction ? line.p1 : line.p2;
    let current_line = line;

    while (true) {
        const outside_tangent_vec =
            current_line.get_tangent_vector(current_point);

        const next_line = current_point
            .other_adjacent_lines(current_line)
            .map((l) => {
                const tv = l.get_tangent_vector(current_point).scale(-1);
                const angle = vec_angle_clockwise(tv, outside_tangent_vec);
                return [l, angle];
            })
            .sort((a, b) => b[1] - a[1])[0][0];

        if (!next_line || ret.includes(next_line)) break;

        ret.push(next_line);
        current_point = next_line.other_endpoint(current_point);
        current_line = next_line;
    }

    if (ret[0].is_adjacent(ret[ret.length - 1])) return ret;
    return null;
}
