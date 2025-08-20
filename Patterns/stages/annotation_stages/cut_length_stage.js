// Wird nach den Curve Stages verwendet, um zu vereifachen, wie viel geschnitten wird

import BaseStage from "../../../Core/Stages/base_stages/baseStage.js";
import ConnectedComponent from "../../../Core/StoffLib/connected_component.js";
import { spline } from "../../../Core/StoffLib/curves.js";
import {
    Vector,
    triangle_data,
    rotation_fun,
    vec_angle_clockwise,
    vec_angle,
    deg_to_rad,
} from "../../../Core/StoffLib/geometry.js";
import { intersect_lines } from "../../../Core/StoffLib/unicorns/intersect_lines.js";
import assert from "../../../Core/assert.js";
import fill_in_dart from "../algorithms/fill_in_dart.js";
import { at_url } from "../../../Core/Debug/render_at.js";

export default class CutLengthStage extends BaseStage {
    constructor() {
        super();
    }

    on_enter() {
        this.sketch = this.wd.sketch;
        this.wd.sketch = this.sketch;
    }

    finish() {
        return this.wd.sketch;
    }

    // percent of
    cut_length(percent) {
        //this.#merge_fill_in();
        if (percent == 1) {
            return;
        }
        const lns = this.sketch.get_typed_lines("bottom");
        let len =
            (1 - percent) *
            (0.6 * (this.wd.sh.center + this.wd.sh.waist_height));

        lns.forEach((ln) => {
            let vec_length = ln.get_line_vector().get_orthonormal().scale(len);
            if (vec_length.y > 0) {
                vec_length = vec_length.scale(-1);
            }
            let p1_h = this.sketch.add_point(ln.p1.copy());
            let p2_h = this.sketch.add_point(ln.p2.copy());
            let ln_h = this.sketch.line_between_points(p1_h, p2_h);
            let vec = ln_h.get_line_vector();
            p1_h.move_to(p1_h.subtract(vec).add(vec_length));
            p2_h.move_to(p2_h.add(vec).add(vec_length));

            let temp1 = this.sketch.intersect_lines(
                ln.p1.other_adjacent_line(ln),
                ln_h
            );

            at_url(this.sketch, "/bla");

            let temp2 = this.sketch.intersect_lines(
                ln.p2.other_adjacent_line(ln),
                temp1.l2_segments[1]
            );

            this.sketch.remove(
                temp1.l2_segments[0].p1,
                temp2.l2_segments[1].p2
            );
            this.sketch.remove(ln.p1, ln.p2);
        });
    }

    #merge_fill_in() {
        let lines = this.sketch.get_typed_lines("fill in");
        let adjacent;
        let temp;
        lines.forEach((line) => {
            adjacent = line.get_adjacent_lines();
            temp = this.sketch.merge_lines(line, adjacent[0]);
            this.sketch.merge_lines(temp, adjacent[1]);
        });
    }
}
