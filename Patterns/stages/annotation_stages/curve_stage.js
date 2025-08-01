import BaseStage from "../../../Core/Stages/base_stages/baseStage.js";
import ConnectedComponent from "../../../Core/StoffLib/connected_component.js";
import { spline } from "../../../Core/StoffLib/curves.js";
import Line from "../../../Core/StoffLib/line.js";
import {
    Vector,
    triangle_data,
    rotation_fun,
    vec_angle_clockwise,
    vec_angle,
    deg_to_rad,
} from "../../../Core/StoffLib/geometry.js";
import assert from "../../../Core/assert.js";

export default class CurveLinesStage extends BaseStage {
    constructor() {
        super();
    }

    on_enter() {
        this.sketch = this.wd.sketch;
    }

    finish() {
        return this.wd.sketch;
    }

    // diese Funktion soll noch raus / anders werden.
    // Dafür muss geklärt werden, ob nach dem Trennen, die Komponenten auf eigene Sketches gepackt werden sollen oder nicht
    curve_lines() {
        let lns_h = this.sketch.get_typed_lines("cut h");
        let lns_p = this.sketch.get_typed_lines("cut p");
        let comp;

        if (lns_p.length > 0) {
            comp = new ConnectedComponent(lns_p[0]);
            this.curve_outer_lines(
                comp.lines_by_key("type")["cut p"]
            ).data.type = "side";
            lns_p = this.sketch.get_typed_lines("cut p");
            comp = new ConnectedComponent(lns_p[0]);
            this.curve_outer_lines(
                comp.lines_by_key("type")["cut p"]
            ).data.type = "side";
        }
        if (lns_h.length > 0) {
            comp = new ConnectedComponent(lns_h[0]);
            this.curve_outer_lines(
                comp.lines_by_key("type")["cut h"]
            ).data.type = "side";
            lns_h = this.sketch.get_typed_lines("cut h");
            comp = new ConnectedComponent(lns_h[0]);
            this.curve_outer_lines(
                comp.lines_by_key("type")["cut h"]
            ).data.type = "side";
        }

        /*
         */
    }

    curve_outer_lines(lines) {
        lines = Line.order_by_endpoints(...lines);

        const target_endpoints = [
            lines.points[0],
            lines.points[lines.points.length - 1],
        ];

        const intp_pts = [target_endpoints[0]];
        for (let i = 0; i < lines.length; i++) {
            intp_pts.push(
                lines[i].position_at_fraction(0.2, !lines.orientations[i]),
                lines[i].position_at_fraction(0.8, !lines.orientations[i])
            );
        }

        intp_pts.push(target_endpoints[1]);

        lines.points.slice(1, -1).forEach((p) => p.remove());
        return this.sketch.plot(
            ...target_endpoints,
            spline.catmull_rom_spline(intp_pts)
        );
    }

    curve_side() {
        let lines = [];
        //lines.push(this.sketch.get_typed_line("side"));
        let f = this.sketch.get_typed_point("f");
        lines.push(
            f.get_adjacent_lines().filter((line) => {
                return line.data.type == "side";
            })[0]
        );
        lines.push(this.sketch.get_typed_line("f_to_o"));
        lines.push(this.sketch.get_typed_line("o_to_n"));

        this.curve_outer_lines(lines).data.type = "side";
    }

    complete_fold() {
        let line = this.sketch.merge_lines(
            this.sketch.get_typed_line("fold"),
            this.sketch.get_typed_line("b_to_m"),
            true
        );
        line.data.type = "fold";
        return line;
    }
}
