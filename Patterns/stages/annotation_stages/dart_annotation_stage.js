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
import assert from "../../../Core/assert.js";
import fill_in_dart from "../algorithms/fill_in_dart.js";

/*
    entry: ?
    exit: Nahtzugabe hinzufügen

    funktionen:
    - annotate dart
    - linie bei Abnähern (vergessen wie es heißt)
    - anpassen Abstand Nahtzugabe
    - Beschreibung von Linien oder so?


*/

export default class DartAnnotationStage extends BaseStage {
    constructor() {
        super();
    }

    on_enter() {
        this.sketch = this.wd.sketch;
        this.wd.sketch = this.sketch;
    }

    on_exit() {
        this.#mirror();
    }

    finish() {
        return this.wd.sketch;
    }

    #mirror() {
        let line = this.sketch.get_typed_line("fold");
        this.sketch.unfold(line);

        let a = this.sketch.get_typed_point("a");
        let m = this.sketch.get_typed_point("m");
        let lines = a.get_adjacent_lines();
        this.sketch.merge_lines(lines[0], lines[1], true);
        lines = m.get_adjacent_lines();
        this.sketch.merge_lines(lines[0], lines[1], true);
    }

    manipulate_darts(config) {
        const len = config.additional.manipulation_distance;

        const h = this.sketch.get_typed_point("h");
        if (!h) {
            return;
        }

        const lines = h.get_adjacent_lines();
        let pts = [];
        if (config.additional.top_dart_manipulation) {
            lines
                .filter((ln) => ln.data.type == "dart")
                .forEach((ln, i) => {
                    ln.data.manipulated = true;
                    pts.push(this.sketch.split_line_at_length(ln, len).point);
                });
        }

        if (config.additional.waistline_dart_manipulation) {
            lines
                .filter((ln) => ln.data.sub_type == "dart")
                .forEach((ln, i) => {
                    ln.data.manipulated = true;
                    pts.push(this.sketch.split_line_at_length(ln, len).point);
                });
        }

        let distance;
        pts.forEach((pt, i) => {
            if (i % 2 == 0) {
                distance = pt.subtract(pts[i + 1]);
                pt.move_to(pt.add(distance.scale(0.2)));
            } else {
                pt.move_to(pt.subtract(distance.scale(0.2)));
            }
            pt.data.type = "to_merge";
        });

        // ich bin mir unsicher, ob ich das fuer den Rücken auch brauche
    }

    move_dart_outside(dart_number, distance = 3) {
        let lines = this.sketch.lines_by_key("dart_number")[dart_number];
        let pt;
        let merge = false;
        if (lines.length > 2) {
            lines = lines.filter((ln) => ln.p1.data.type == ln.data.darttip);
            merge = true;
        }

        if (lines[0].p1.other_adjacent_lines(lines[0]).length <= 1) {
            pt = lines[0].p1;
            delete pt.data.type;
        } else {
            pt = this.sketch.add_point(lines[0].p1.copy());
            lines[0].replace_endpoint(lines[0].p1, pt);
            lines[1].replace_endpoint(lines[1].p1, pt);
        }

        let vec = lines[0].p2.subtract(lines[1].p2).scale(0.5).add(lines[1].p2);
        vec = pt.subtract(vec).normalize().scale(-distance);

        pt.move_to(pt.add(vec));

        if (merge) {
            this.#merge_manipulated_dart(lines[0].p2, lines[1].p2);
        }
    }

    #merge_manipulated_dart(p1, p2) {
        let lns = p1.get_adjacent_lines();
        let data = lns[0].data;
        let points = [lns[1].p1, lns[0].p2];
        let intp_pts = [points[0]];
        intp_pts.push(lns[1].position_at_fraction(0.8));
        intp_pts.push(lns[0].position_at_fraction(0.2));

        intp_pts.push(points[1]);

        let ln = this.sketch.plot(
            ...points,
            spline.catmull_rom_spline(intp_pts)
        );
        ln.data = data;

        this.sketch.remove(lns[1].p2);
        //    console.log(intp_pts)
        //    this.sketch.merge_lines(lns[0], lns[1], true);
        lns = p2.get_adjacent_lines();
        data = lns[0].data;
        points = [lns[1].p1, lns[0].p2];
        intp_pts = [points[0]];
        intp_pts.push(lns[1].position_at_fraction(0.8));
        intp_pts.push(lns[0].position_at_fraction(0.2));

        intp_pts.push(points[1]);

        ln = this.sketch.plot(...points, spline.catmull_rom_spline(intp_pts));
        ln.data = data;

        this.sketch.remove(lns[1].p2);
        //    this.sketch.merge_lines(lns[0], lns[1], true);
    }

    // erst alle anderen Abnäher verschieben und von h und p lösen
    move_waistline_dart(distance = 3) {
        let p = this.sketch.get_typed_point("p");
        let h = this.sketch.get_typed_point("h");
        let vec = new Vector(0, 1);
        vec = vec.scale(distance);

        if (p) {
            p.move_to(p.add(vec));
        }
        if (h) {
            h.move_to(h.add(vec));
        }

        let pts = this.sketch.get_typed_points("to_merge");

        /*
        if(pts.length > 2){
          // kann maximal 4 sein
          this.#merge_manipulated_dart(pts[0], pts[1]);
          this.#merge_manipulated_dart(pts[2], pts[3]);
        } else if (pts.length > 0){
          this.#merge_manipulated_dart(pts[0], pts[1]);
        }

*/
    }

    fill_in_dart(dart_number, reverse = false) {
        fill_in_dart(this.sketch, dart_number, reverse);
    }

    dart_annotation(dart_number, shift_length = 3) {
        let dart_lines = this.sketch.get_typed_lines("dart").filter((line) => {
            return line.data.dart_number == dart_number;
        });

        assert.CALLBACK(
            "Abnähernummer" + dart_number + "existiert nicht",
            () => {
                return dart_lines.length > 0;
            }
        );

        let fill_in = this.sketch
            .get_typed_lines("fill in")
            .filter((ln) => ln.data.dart_number == dart_number)[0];

        /*
        let vec = dart_lines[0].p1.subtract(dart_lines[1].p1).scale(0.5).add(dart_lines[1].p1);
        let pt = this.sketch.add_point(vec);

        vec = dart_lines[0].p2.subtract(dart_lines[1].p2).scale(0.5).add(dart_lines[1].p2);
        let pt2 = this.sketch.add_point(vec);
        pt2.data.dart_side_distance = dart_lines[0].p2.subtract(dart_lines[1].p2).length() / 2;

        pt.data.dart_lenghen = shift_length;
*/
        let pt = dart_lines[0].p1;
        //  console.log(fill_in)

        let split = this.sketch.split_line_at_fraction(fill_in, 0.5);
        let line = this.sketch.line_between_points(pt, split.point);
        line.data.type = "annotation";
        line.data.dart_number = dart_number;
        line.data.sewing = "close_dart";

        //  this.sketch.remove(dart_lines[0].p1);
        this.remove_dart_lines_from_outline(dart_lines[0].p1);

        //    pt.move_to(line.get_line_vector().normalize().scale(shift_length).add(pt));
        return line;
    }

    remove_dart_lines_from_outline(point) {
        const lines = point.get_adjacent_lines();
        /*
      let p = lines[0].p2;
      let p_n = this.sketch.add_point(p.copy())
      lines[0].replace_endpoint(p, p_n);

      p = lines[1].p2;
      p_n = this.sketch.add_point(p.copy())
      lines[1].replace_endpoint(p, p_n);
*/
        lines[0].data.sewing = "close_dart";
        lines[1].data.sewing = "close_dart";
    }

    annotate_inner_waistline_dart(type = "h", position = "inner") {
        const p = this.sketch.get_typed_point(type);
        if (p) {
            const lines = p.get_adjacent_lines();
            if (lines[0].data.manipulated) {
                let lns = lines[0].p2.get_adjacent_lines().copy();
                let ln = lns[1].p2.other_adjacent_line(lns[1]);
                lns.push(ln);
                let l = this.curve_manipulated_dart(lns);
                this.sketch.remove(lns[1].p1, lns[1].p2);


                lns = lines[1].p2.get_adjacent_lines().copy();
                ln = lns[1].p2.other_adjacent_line(lns[1]);
                lns.push(ln);
                let l2 = this.curve_manipulated_dart(lns);

                const p1 = lns[1].p1;
                this.sketch.remove(lns[1].p1, lns[1].p2);
                l.data.type = "dart";
                l.data.position = position;
                l.data.sewing = "close_waistline_dart";
                l2.data.type = "dart";
                l2.data.position = position;
                l2.data.sewing = "close_waistline_dart";
                let ln_ann = this.sketch.line_between_points(l.p1, l.p2);
                ln_ann.data.sewing = "close_waistline_dart";
                ln_ann.data.position = position;
                ln_ann.data.type = "annotation";

                //    this.sketch.remove(lines[0].p2)
                //ToDo: What happened here?!?
            } else {
                let ln = this.curve_dart(lines[0].p2.get_adjacent_lines());
                ln.data.type = "dart";
                ln.data.position = position;
                ln.data.sewing = "close_waistline_dart";
                ln = this.curve_dart(lines[1].p2.get_adjacent_lines());
                ln.data.type = "dart";
                ln.data.position = position;
                ln.data.sewing = "close_waistline_dart";
                this.sketch.remove(lines[0].p2, lines[1].p2);
                let ln_ann = this.sketch.line_between_points(ln.p1, ln.p2);
                ln_ann.data.sewing = "close_waistline_dart";
                ln_ann.data.position = position;
                ln_ann.data.type = "annotation";
            }
        }
    }

    curve_dart(lines) {
        const target_endpoints = [lines[0].p1, lines[1].p1];

        const intp_pts = [target_endpoints[0]];
        intp_pts.push(lines[0].position_at_fraction(0.8));
        intp_pts.push(lines[1].position_at_fraction(0.8));

        intp_pts.push(target_endpoints[1]);

        return this.sketch.plot(
            ...target_endpoints,
            spline.catmull_rom_spline(intp_pts)
        );
    }

    curve_manipulated_dart(lines) {
        const target_endpoints = [lines[0].p1, lines[2].p1];

        const intp_pts = [target_endpoints[0]];
        intp_pts.push(lines[0].position_at_fraction(0.75));
        intp_pts.push(lines[1].position_at_fraction(0.25));
        intp_pts.push(lines[1].position_at_fraction(0.75));
        intp_pts.push(lines[2].position_at_fraction(0.75));
        intp_pts.push(target_endpoints[1]);

        return this.sketch.plot(
            ...target_endpoints,
            spline.catmull_rom_spline(intp_pts)
        );
    }

    /*
    annotate_outer_waistline_dart(){
      const p = this.sketch.get_typed_point("p");
      if (p){
        const lines = p.get_adjacent_lines();
        let ln = this.curve_dart(lines[0].p2.get_adjacent_lines());
        ln.data.sub_type = "dart"
        ln.data.position = "outer"
        ln.data.sewing = "close_waistline_dart"
        ln = this.curve_dart(lines[1].p2.get_adjacent_lines());
        ln.data.sub_type = "dart"
        ln.data.position = "outer"
        ln.data.sewing = "close_waistline_dart"
        this.sketch.remove(lines[0].p2, lines[1].p2)
        let ln_ann = this.sketch.line_between_points(ln.p1, ln.p2);
        ln_ann.data.sewing = "close_waistline_dart"
        ln_ann.data.position = "outer"
        ln_ann.data.sub_type = "annotation"
      }

    }
*/
    annotate_waistline_dart() {
        const ln = this.sketch.get_typed_line("i_to_r");
        if (ln) {
            this.sketch.remove(ln);
        }
        this.annotate_inner_waistline_dart();
        this.annotate_inner_waistline_dart("p", "outer");
    }
}
