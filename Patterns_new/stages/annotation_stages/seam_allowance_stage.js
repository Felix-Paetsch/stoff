import PatternStage from "../../../PatternLib/pattern_stages/baseStage.js";
import ConnectedComponent from "../../../StoffLib/connected_component.js";
import { spline } from "../../../StoffLib/curves.js";
import { Vector, triangle_data, rotation_fun, vec_angle_clockwise, vec_angle, deg_to_rad } from "../../../StoffLib/geometry.js";
import assert from "../../../StoffLib/assert.js";
import fill_in_dart from "../algorithms/fill_in_dart.js";



export default class SeamAllowanceStage extends PatternStage{

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


    set_seam_allowance(line_type, distance = 1.5){
        let lines = this.sketch.get_typed_lines(line_type);
        lines.forEach(line => {
            line.data.seam_allowance = distance;
        });
    }

    set_all_seam_allowance(distance = 0.5){
        let lines = this.sketch.get_lines();
        lines.forEach(line => {
            line.data.seam_allowance = distance;
        });
    }


    seam_allowance_temp() {
        this.#merge_fill_in();
        let d = this.sketch.get_typed_point("d");
        this.seam_allowance(new ConnectedComponent(d));
      //  let e_arr = this.sketch.get_typed_points("e");
     //   this.seam_allowance(new ConnectedComponent(e_arr[0]));
   //     this.seam_allowance(new ConnectedComponent(e_arr[1]), true);
    }


    seam_allowance(comp, direction = false) {

        let lines = comp.get_lines();
        let distance;
        let allowance = [];
        const oriented = this.sketch.oriented_lines(lines);
        oriented.forEach((line, i) => {
            line.data.line_i = i;
            line.data.orientation = oriented.orientations[i];
            
            //line.set_color("red")
            distance = line.data.seam_allowance;
            if (!distance) {
                distance = 1.5;
            }
            if (direction) {
                allowance.push(this.sketch.line_with_offset(line, distance, line.data.orientation).line);
            } else {
                allowance.push(this.sketch.line_with_offset(line, distance, !line.data.orientation).line);
            }
            allowance[i].data.orientation = line.data.orientation;
            allowance[i].data.line_i = i;

            if (i != 0) {
                let temp = this.#close_lines(allowance[i - 1], allowance[i]);
                allowance[i - 1] = temp.ln1;
                allowance[i] = temp.ln2;
            }

            /*
            */
        });


        this.#close_lines(allowance[lines.length - 1], allowance[0]);

    }



    #close_lines(ln1, ln2) {
        let p1;
        let p2;
        let o1 = ln1.data.orientation;
        let o2 = ln2.data.orientation;

        if (!o1) {
            p1 = ln1.p1;
        } else {
            p1 = ln1.p2;
        }

        if (!o2) {
            p2 = ln2.p2;
        } else {
            p2 = ln2.p1;
        }

        let vec1 = p1.get_tangent_vector(ln1);
        let vec2 = p2.get_tangent_vector(ln2);

        let pt1 = this.sketch.add_point(p1.add(vec1.scale(10)));
        let pt2 = this.sketch.add_point(p2.add(vec2.scale(10)));

        let temp = this.sketch.line_between_points(p1, pt1);
        ln1 = this.sketch.merge_lines(ln1, temp, true);
        temp = this.sketch.line_between_points(p2, pt2);
        ln2 = this.sketch.merge_lines(ln2, temp, true);
        temp = this.sketch.intersect_lines(ln1, ln2);

        if (!o1) {
            this.sketch.remove(temp.l1_segments[0].p1);
            ln1 = temp.l1_segments[1];
        } else {
            this.sketch.remove(temp.l1_segments[1].p2);
            ln1 = temp.l1_segments[0];
        }

        if (o2) {
            this.sketch.remove(temp.l2_segments[0].p1);
            ln2 = temp.l2_segments[1];
        } else {
            this.sketch.remove(temp.l2_segments[1].p2);
            ln2 = temp.l2_segments[0];
        }
        //    this.sketch.dev.at_url("/wha", false)
        ln1.data.orientation = o1;
        ln2.data.orientation = o2;

        return {
            ln1,
            ln2
        }
        /*
        */
    }


    #merge_fill_in() {
        let lines = this.sketch.get_typed_lines("fill in");
        let adjacent;
        let temp;
        lines.forEach(line => {
            adjacent = line.get_adjacent_lines();
            temp = this.sketch.merge_lines(line, adjacent[0]);
            this.sketch.merge_lines(temp, adjacent[1]);
        });
    }

}