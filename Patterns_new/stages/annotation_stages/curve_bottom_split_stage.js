import BaseStage from "../../../Core/Stages/base_stages/baseStage.js";
import ConnectedComponent from "../../../Core/StoffLib/connected_component.js";
import { spline } from "../../../Core/StoffLib/curves.js";
import { Vector, triangle_data, rotation_fun, vec_angle_clockwise, vec_angle, deg_to_rad } from "../../../Core/StoffLib/geometry.js";
import assert from "../../../Core/assert.js";






export default class CurveBottomCutStage extends BaseStage {
    constructor() {
        super();
    }

    on_enter(){
        this.sketch = this.wd.sketch;
    }


    finish() {
        return this.wd.sketch;
    }

    curve_styleline(){
        let d = this.sketch.get_typed_point("d");
        let e = this.sketch.get_typed_point("e");
        
        let comp = new ConnectedComponent(d);

        this.#curve_outer_lines(comp.lines_by_key("type")["cut h"]);
        comp = new ConnectedComponent(e);
        this.#curve_outer_lines(comp.lines_by_key("type")["cut h"]);
    }

    curve_cut_waistline_dart(){
        let lines = [];
        let lines2 = [];

        let ln = this.sketch.lines_by_key("old_type").j_to_i[0];
        if(ln){
            lines.push(ln);
            let lns = ln.p2.other_adjacent_lines(ln);
            lines.push(lns.filter(line => { return line.data.type == "cut h"})[0]);
            lines.push(ln.p1.other_adjacent_line(ln));
            let curve = this.#curve_outer_lines(lines);
            curve.data.type = "cut";
            curve.data.darttip = "h";
            lines2 = this.sketch.get_typed_lines("cut h");
            let curve2 = this.#curve_outer_lines(lines2);
            curve2.data.type = "cut";
            curve2.data.darttip = "h";
        } else {
            ln = this.sketch.lines_by_key("old_type").q_to_s;
            lines.push(ln);
            let lns = ln.p2.other_adjacent_lines(ln);
            lines.push(lns.filter(line => { return line.data.type == "cut p" })[0]);
            lines.push(ln.p1.other_adjacent_line(ln));
            let curve = this.#curve_outer_lines(lines);
            curve.data.type = "cut";
            curve.data.darttip = "p";
            lines2 = this.sketch.get_typed_lines("cut p");
            let curve2 = this.#curve_outer_lines(lines2);
            curve2.data.type = "cut";
            curve2.data.darttip = "p";
        }

    }

    curve_inner_waistline_dart(position = false){
        
        if(position){
            let p1;
            let p2;
            switch (position) {
                case "both":
                    this.curve_inner_waistline_dart("inner");
                    this.curve_inner_waistline_dart("outer");
                    return;
                case "inner":
                    p1 = this.sketch.get_typed_point("g");
                    p2 = this.sketch.get_typed_point("i");
                    this.sketch.get_typed_point("j").get_adjacent_lines().forEach(ln => {
                        ln.swap_orientation();
                    })
                    break;
                case "outer":
                    p1 = this.sketch.get_typed_point("r");
                    p2 = this.sketch.get_typed_point("s");
                    this.sketch.get_typed_point("q").get_adjacent_lines().forEach(ln => {
                        ln.swap_orientation();
                    })
                    break;
            
                default:
                    break;
            }
            let adjacent = p1.get_adjacent_lines().filter(ln => {return ln.data.sub_type == "dart";});
            this.#curve_outer_lines(adjacent).data.sub_type = "dart";
            adjacent = p2.get_adjacent_lines().filter(ln => { return ln.data.sub_type == "dart"; });
            this.#curve_outer_lines(adjacent).data.sub_type = "dart";
        } else {
            let ln = this.sketch.get_typed_line("h_to_i");
            let ln2 = this.sketch.get_typed_line("p_to_s");
            if(ln){
                this.curve_inner_waistline_dart("inner");
            }
            if(ln2){
                this.curve_inner_waistline_dart("outer");
            }
        }
        
    }

    #curve_outer_lines(lines) {
        lines = this.sketch.order_by_endpoints(...lines);

        const target_endpoints = [
            lines.points[0],
            lines.points[lines.points.length - 1]
        ];

        const intp_pts = [target_endpoints[0]];
        for (let i = 0; i < lines.length; i++) {
            intp_pts.push(
                lines[i].position_at_fraction(0.2, !lines.orientations[i]),
                lines[i].position_at_fraction(0.8, !lines.orientations[i])
            )
        }
        intp_pts.push(target_endpoints[1]);
        
        lines.points.slice(1, -1).forEach(p => p.remove());
        
        
        return this.sketch.plot(...target_endpoints, spline.catmull_rom_spline(intp_pts));
    }

}