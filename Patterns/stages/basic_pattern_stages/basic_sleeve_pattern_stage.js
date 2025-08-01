import BaseStage from "../../../Core/Stages/base_stages/baseStage.js";
import SewingSketch from "../../../Core/PatternLib/sewing_sketch.js";
import {
    Vector,
    triangle_data,
    rotation_fun,
    vec_angle,
    deg_to_rad,
    DOWN,
    LEFT,
} from "../../../Core/StoffLib/geometry.js";
import { spline, arc } from "../../../Core/StoffLib/curves.js";
import ConnectedComponent from "../../../Core/StoffLib/connected_component.js";
import Line from "../../../Core/StoffLib/line.js";

// To be ported
// import NecklineSideHalf from "../../Patterns/parts/neckline/neckline_side_half.js"

export default class BasicSleeveBaseStage extends BaseStage {
    constructor(one_w_dart = true) {
        super();
        this.one_w_dart = one_w_dart;
    }

    on_enter() {
        this.wd.mult_vector = 4 / 5; // Das hier noch anpassbar machen und mit einer variable verknüpfen
        const s = new SewingSketch();
        this.wd.sketch = s;

        this.sketch = s;
        this.#main_construction();
    }

    finish() {
        return this.wd;
    }

    #main_construction() {
        //  console.log(this.wd.measurements)
        //   this.sketch.dev.at_url("/bla")
        this.#basic_straight_construction();
    }

    #basic_straight_construction() {
        const pts = {};
        const lns = {};

        pts.a = this.sketch.point(0, 0);
        pts.b = new Vector(
            0,
            this.wd.measurements.distance_armpit * this.wd.mult_vector
        );
        pts.c = pts.b.add(new Vector(0, this.wd.measurements["arm length"]));

        pts.d = this.sketch.point(
            pts.b.add(new Vector(this.wd.measurements["arm"] / 2, 0))
        );
        pts.e = this.sketch.point(
            pts.b.add(new Vector(-this.wd.measurements["arm"] / 2, 0))
        );

        pts.f = this.sketch.point(
            pts.c.add(new Vector(this.wd.measurements["arm"] / 2, 0))
        );
        pts.g = this.sketch.point(
            pts.c.add(new Vector(-this.wd.measurements["arm"] / 2, 0))
        );

        pts.a.data.type = "a";
        pts.d.data.type = "d";
        pts.e.data.type = "e";
        pts.f.data.type = "f";
        pts.g.data.type = "g";

        lns.d_to_f = this.sketch.line_between_points(pts.d, pts.f);
        lns.e_to_g = this.sketch.line_between_points(pts.e, pts.g);

        lns.f_to_g = this.sketch.line_between_points(pts.f, pts.g);

        lns.a_to_d = this.sketch.line_with_length(
            pts.a,
            pts.d,
            pts.a.subtract(pts.d).length() + 1
        );
        lns.a_to_e = this.sketch
            .line_with_length(pts.e, pts.a, pts.a.subtract(pts.e).length() + 2)
            .mirror();

        lns.d_to_e = this.sketch.merge_lines(lns.a_to_d, lns.a_to_e, true);

        lns.d_to_f.data.type = "side";
        lns.e_to_g.data.type = "side";
        lns.f_to_g.data.type = "bottom";
        //lns.a_to_d.data.type = "armpit";
        //lns.a_to_e.data.type = "armpit";
        lns.d_to_e.data.type = "armpit";

        lns.d_to_f.data.side = "front";
        lns.d_to_f.data.dart_number = 0;
        lns.e_to_g.data.side = "back";
        //lns.a_to_d.data.side = "front";
        //lns.a_to_e.data.side = "back";

        // this.sketch.line_between_points(pts.b, pts.d)

        //console.log(pts.a.subtract(pts.d).length())
    }

    // Für schönere Kurven bitte Zahlen über 10 nehmen!
    //
    cut_sleeve_stripes(number_of_stripes = 3) {
        let lns = [];
        let bottom = this.sketch.get_typed_line("bottom");
        let armpit = this.sketch.get_typed_line("armpit");

        const len = bottom.get_length() / number_of_stripes;
        const vec = this.sketch
            .get_typed_line("side")
            .get_line_vector()
            .scale(-2)
            .add(new Vector(0, -this.wd.measurements.distance_armpit * 2));

        let temp = this.sketch.split_line_at_length(bottom, len);
        for (let i = 0; i < number_of_stripes - 1; i++) {
            lns.push(
                this.sketch.line_at_angle(
                    temp.point,
                    deg_to_rad(0),
                    vec.length()
                ).line
            );
            lns[i].data.type = "dart";
            lns[i].data.dart_number = i + 1;
            lns[i].swap_orientation();
            const intersection = this.sketch.intersect_lines(lns[i], armpit);
            armpit = intersection.l2_segments[0];
            this.sketch.remove(intersection.l1_segments[0].p1);

            armpit = intersection.l2_segments[0];
            if (i < number_of_stripes - 2) {
                temp = this.sketch.split_line_at_length(
                    temp.line_segments[1],
                    len
                );
            }
        }
    }

    flare_bottom_sleeve(distance_armpit = 5, flare_by_angle = false) {
        const dart_lines = this.sketch.get_typed_lines("dart");
        if (dart_lines.length == 0) return;

        dart_lines.sort(function (a, b) {
            return a.data.dart_number - b.data.dart_number;
        });

        const angles = [];
        if (flare_by_angle) {
            const index = Math.round(dart_lines.length / 2);
            const len = dart_lines[index].get_length();
            dart_lines.forEach((l) => {
                const angle = triangle_data({
                    a: len,
                    b: len,
                    c: distance_armpit,
                }).gamma;
                angles.push(angle);
            });
        } else {
            dart_lines.forEach((l) => {
                const len = l.get_length();
                const angle = triangle_data({
                    a: len,
                    b: len,
                    c: distance_armpit,
                }).gamma;
                angles.push(angle);
            });
        }

        let top_right_corner = this.sketch.get_typed_point("d");
        let prev_top_right_corner = dart_lines[0].p1; // Will become relevant only for n>1 th line
        let prev_bottom_left_corner = dart_lines[0].p1;

        dart_lines.forEach((l, index) => {
            const top_left_corner = l.p1;

            //l.p1.set_color("red");
            //l.p1.attributes.radius = 5;
            const bottom_right_corner = top_right_corner.other_adjacent_point(
                top_left_corner,
                prev_top_right_corner,
                prev_bottom_left_corner
            );
            //this.sketch.dev.at_new_url("/wah")
            const cut_res = this.sketch.cut(l, l.p1);
            const bottom_left_corner = cut_res.points.get_point_between_lines(
                (l) => l.has_endpoint(bottom_right_corner),
                (l) => l.has_endpoint(top_left_corner)
            );

            // The new entry in dart_lines[i] is the right side of the split dart
            dart_lines[index] = top_left_corner
                .common_line(bottom_left_corner)
                .set_orientation(top_left_corner, bottom_left_corner);
            for (let i = index; i < dart_lines.length; i++) {
                const pivot = dart_lines[i].p1;
                const angle = angles[i];
                const rot_fun = rotation_fun(pivot, -angle);

                [
                    bottom_left_corner,
                    bottom_right_corner,
                    top_right_corner,
                ].forEach((p) => p.move_to(rot_fun(p)));
            }

            prev_top_right_corner = top_right_corner;
            top_right_corner = top_left_corner;
            prev_bottom_left_corner = bottom_left_corner;
        });

        let correction_angle;
        let correction_pivot;
        if (dart_lines.length % 2 == 0) {
            const lhs_line = dart_lines[Math.round(dart_lines.length / 2)];
            const left_center = lhs_line.p2;
            const right_center = left_center.other_adjacent_point(lhs_line.p1);

            const dir_vec = left_center.subtract(right_center);

            correction_pivot = right_center;
            correction_angle = vec_angle(dir_vec, LEFT);
        } else if (dart_lines.length % 2 == 1) {
            const rhs_line = dart_lines[Math.floor(dart_lines.length / 2)];
            correction_pivot = rhs_line.p1;
            correction_angle = vec_angle(rhs_line.get_line_vector(), DOWN) / 2;
        }

        const rot_correction_fun = rotation_fun(
            correction_pivot,
            correction_angle
        );
        this.sketch.transform((p) => p.move_to(rot_correction_fun(p)));
    }

    flare_top_sleeve(distance_armpit = 5, flare_by_angle = false) {
        const dart_lines = this.sketch.get_typed_lines("dart");
        if (dart_lines.length == 0) return;

        dart_lines.sort(function (a, b) {
            return a.data.dart_number - b.data.dart_number;
        });

        const angles = [];
        if (flare_by_angle) {
            const index = Math.round(dart_lines.length / 2);
            const len = dart_lines[index].get_length();
            dart_lines.forEach((l) => {
                const angle = triangle_data({
                    a: len,
                    b: len,
                    c: distance_armpit,
                }).gamma;
                angles.push(angle);
            });
        } else {
            dart_lines.forEach((l) => {
                const len = l.get_length();
                const angle = triangle_data({
                    a: len,
                    b: len,
                    c: distance_armpit,
                }).gamma;
                angles.push(angle);
            });
        }

        /*
        let top_right_corner = this.sketch.get_point_between_lines(
            (l) => { return l.data.type == "side" && l.data.side == "front" },
            (l) => { return l.data.type == "armpit" && l.data.side == "front" }
        );
        */
        let prev_bottom_right_corner = dart_lines[0].p2; // Will become relevant only for n>1 th line
        let prev_top_left_corner = dart_lines[0].p2;

        let bottom_right_corner = this.sketch.get_point_between_lines(
            (l) => {
                return l.data.type == "side" && l.data.side == "front";
            },
            (l) => {
                return l.data.type == "bottom" && l.p1.data.type == "f";
            }
        );

        dart_lines.forEach((l, index) => {
            //    let top_left_corner = l.p1;
            const bottom_left_corner = l.p2;
            let top_right_corner = bottom_right_corner.other_adjacent_point(
                bottom_left_corner,
                prev_bottom_right_corner,
                prev_top_left_corner
            );
            const cut_res = this.sketch.cut(l, l.p2);
            const top_left_corner = cut_res.points.get_point_between_lines(
                (l) => l.has_endpoint(bottom_left_corner),
                (l) => l.has_endpoint(top_right_corner)
            );

            // The new entry in dart_lines[i] is the right side of the split dart
            dart_lines[index] = top_left_corner
                .common_line(bottom_left_corner)
                .set_orientation(top_left_corner, bottom_left_corner);
            for (let i = index; i < dart_lines.length; i++) {
                const pivot = dart_lines[i].p2;
                const angle = angles[i];
                const rot_fun = rotation_fun(pivot, angle);

                [
                    top_left_corner,
                    bottom_right_corner,
                    top_right_corner,
                ].forEach((p) => p.move_to(rot_fun(p)));
            }

            prev_bottom_right_corner = bottom_right_corner;
            bottom_right_corner = bottom_left_corner;
            prev_top_left_corner = top_left_corner;
        });

        let correction_angle;
        let correction_pivot;
        if (dart_lines.length % 2 == 0) {
            const lhs_line = dart_lines[Math.round(dart_lines.length / 2)];
            const left_center = lhs_line.p1;
            const right_center = left_center.other_adjacent_point(lhs_line.p2);

            const dir_vec = left_center.subtract(right_center);

            correction_pivot = right_center;
            correction_angle = vec_angle(dir_vec, LEFT) * -1;
        } else if (dart_lines.length % 2 == 1) {
            const rhs_line = dart_lines[Math.floor(dart_lines.length / 2)];
            correction_pivot = rhs_line.p1;
            correction_angle = vec_angle(rhs_line.get_line_vector(), DOWN) / -2;
        }

        const rot_correction_fun = rotation_fun(
            correction_pivot,
            correction_angle
        );
        this.sketch.transform((p) => p.move_to(rot_correction_fun(p)));
    }

    connect_sleeve_bottom(middle_addition = 3) {
        let lns = this.sketch.get_typed_lines("dart");
        //  let lns = this.sketch.get_typed_lines("bottom");
        lns.sort(function (a, b) {
            return a.p2.x - b.p2.x;
        });
        let sides = this.sketch.get_typed_lines("side");
        const vec = sides[0].p1
            .subtract(sides[1].p1)
            .scale(0.5)
            .add(sides[1].p1);
        let pts = [this.sketch.get_typed_point("g")];
        const step_size =
            middle_addition / Math.log(Math.round((lns.length - 1) / 2));

        let lns_1 = lns.slice(0, Math.round(lns.length / 2));
        let lns_2 = lns.slice(Math.round(lns.length / 2)).reverse();
        for (let i = 0; i < lns_1.length; i += 2) {
            const ln1 = lns_1[i];

            const addition = step_size * Math.log(i + 2);

            //const p = ln1.p1.subtract(ln1.p2).scale(0.5).add(ln1.p2);
            let vec_h = ln1.get_line_vector().normalize().scale(addition);
            pts.push(this.sketch.add_point(ln1.p2.add(vec_h)));
        }
        let pts_h = [this.sketch.get_typed_point("f")];
        for (let i = 0; i < lns_2.length; i += 2) {
            const ln1 = lns_2[i];

            const addition = step_size * Math.log(i + 2);

            //const p = ln1.p1.subtract(ln1.p2).scale(0.5).add(ln1.p2);
            let vec_h = ln1.get_line_vector().normalize().scale(addition);
            pts_h.push(this.sketch.add_point(ln1.p2.add(vec_h)));
        }

        pts = pts.concat(pts_h.reverse());
        /*
         */
        this.sketch.remove(lns[0].p2, lns[lns.length - 1].p2);
        delete lns[0];
        delete lns[lns.length - 1];
        lns.forEach((ln) => {
            this.sketch.remove(ln.p2);
        });
        /*
        lns = [];
        for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i + 1];
            lns.push(this.sketch.line_between_points(p1, p2));
        }
*/

        //const curve = this.#curve_lines(lns);
        const curve = this.sketch.line_from_function_graph(
            pts[0],
            pts[pts.length - 1],
            spline.catmull_rom_spline(pts)
        );
        /*
         */
        delete pts[0];
        delete pts[pts.length - 1];
        pts.forEach((p) => {
            this.sketch.remove(p);
        });
        this.#merge_parts("armpit");
    }

    connect_sleeve_top(middle_addition = 3) {
        let lns = this.sketch.get_typed_lines("armpit");
        lns.sort(function (a, b) {
            return (
                a.p2.other_adjacent_line(a).data.dart_number -
                b.p2.other_adjacent_line(b).data.dart_number
            );
        });
        let sides = this.sketch.get_typed_lines("side");
        const vec = sides[0].p1
            .subtract(sides[1].p1)
            .scale(0.5)
            .add(sides[1].p1);
        let pts = [this.sketch.get_typed_point("d")];
        const step_size = middle_addition / Math.round((lns.length - 1) / 2);

        let lns_1 = lns.slice(0, Math.round(lns.length / 2));
        let lns_2 = lns.slice(Math.round(lns.length / 2)).reverse();
        for (let i = 1; i < lns_1.length; i++) {
            const ln1 = lns_1[i];

            const addition = step_size * (i + 1);

            const p = ln1.p1.subtract(ln1.p2).scale(0.5).add(ln1.p2);
            let vec_h = p.subtract(vec).normalize().scale(addition);
            pts.push(this.sketch.add_point(p.add(vec_h)));
        }
        let pts_h = [this.sketch.get_typed_point("e")];
        for (let i = 1; i < lns_2.length; i++) {
            const ln1 = lns_2[i];

            const addition = step_size * (i + 1);

            const p = ln1.p1.subtract(ln1.p2).scale(0.5).add(ln1.p2);
            let vec_h = p.subtract(vec).normalize().scale(addition);
            pts_h.push(this.sketch.add_point(p.add(vec_h)));
        }

        pts = pts.concat(pts_h.reverse());
        this.sketch.remove(lns[0].p1, lns[lns.length - 1].p2);
        delete lns[0];
        delete lns[lns.length - 1];
        lns.forEach((ln) => {
            this.sketch.remove(ln.p1, ln.p2);
        });
        lns = [];
        for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i + 1];
            lns.push(this.sketch.line_between_points(p1, p2));
        }

        //const curve = this.#curve_lines(lns);
        const curve = this.sketch.line_from_function_graph(
            pts[0],
            pts[pts.length - 1],
            spline.catmull_rom_spline(pts)
        );
        /*
         */
        delete pts[0];
        delete pts[pts.length - 1];
        pts.forEach((p) => {
            this.sketch.remove(p);
        });
        this.#curve_lines(this.sketch.get_typed_lines("bottom"));
    }

    #merge_parts(type) {
        let lns = this.sketch.get_typed_lines(type);
        lns = Line.order_by_endpoints(lns);
        let temp = lns[0];
        for (let i = 1; i < lns.length; i++) {
            const ln = lns[i];

            temp = this.sketch.merge_lines(temp, ln, true);
        }
    }
    #curve_lines(lines) {
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

    // Wird direkt nach der konstruktion des Ärmels aufgerufen, bevor irgendwas anderes gemacht wird
    cut_length(length) {
        const bottom = this.sketch.get_typed_line("bottom");

        let vec = bottom.p1.other_adjacent_line(bottom).get_line_vector();
        vec = vec.normalize().scale(-vec.length() * length * 0.99);
        bottom.p1.move_to(bottom.p1.add(vec));

        vec = bottom.p2.other_adjacent_line(bottom).get_line_vector();
        vec = vec.normalize().scale(-vec.length() * length * 0.99);
        bottom.p2.move_to(bottom.p2.add(vec));

        // seiten sind aktuell noch absolut senkrecht
    }

    cut_to_other_sketch(length) {
        if (length < 0.15) {
            length = 0.15;
        } else if (length > 0.8) {
            length = 0.8;
        }

        const bottom = this.sketch.get_typed_line("bottom");
        const side_vec = this.sketch.get_typed_line("side").get_line_vector();
        const len = -side_vec.length() * length * 0.99;

        const p1 = this.sketch.split_line_at_length(
            bottom.p1.other_adjacent_line(bottom),
            len
        );
        const p2 = this.sketch.split_line_at_length(
            bottom.p2.other_adjacent_line(bottom),
            len
        );
        const ln = this.sketch.line_between_points(p1.point, p2.point);
        ln.data.type = "cut";

        const cut = this.sketch.cut(ln);
        let comp = new ConnectedComponent(cut.cut_parts[0].line);
        let comp2;
        if (comp.lines_by_key("type").armpit.length > 0) {
            cut.cut_parts[0].line.data.type = "bottom";
            cut.cut_parts[0].line.p1.data.type = "f";
            cut.cut_parts[0].line.p2.data.type = "g";
            cut.cut_parts[1].line.data.type = "armpit";
            cut.cut_parts[1].line.swap_orientation();
            cut.cut_parts[1].line.p1.data.type = "e";
            cut.cut_parts[1].line.p2.data.type = "d";
            comp2 = new ConnectedComponent(cut.cut_parts[1].line);
        } else {
            comp2 = comp;
            comp = new ConnectedComponent(cut.cut_parts[1].line);

            cut.cut_parts[1].line.data.type = "bottom";
            cut.cut_parts[1].line.p1.data.type = "f";
            cut.cut_parts[1].line.p2.data.type = "g";
            cut.cut_parts[0].line.data.type = "armpit";
            cut.cut_parts[0].line.swap_orientation();
            cut.cut_parts[0].line.p1.data.type = "e";
            cut.cut_parts[0].line.p2.data.type = "d";
        }
        comp.transform((p) => {
            p.move_to(p.add(new Vector(0, -10)));
        });
        this.wd.sketch = comp.to_sketch();
        this.wd.sketch2 = comp2.to_sketch();
        this.sketch = this.wd.sketch;

        //bottom.p2.move_to(bottom.p2.add(vec));
    }

    latern_sleeve(flare = 2) {
        this.cut_sleeve_stripes(10);
        this.flare_bottom_sleeve(flare);
        this.connect_sleeve_bottom(1);
        const sk = this.sketch;
        this.sketch = this.wd.sketch2;
        //    this.wd.sketch2 = this.wd.sketch3;
        this.cut_sleeve_stripes(10);
        this.flare_top_sleeve(flare);
        this.connect_sleeve_top(1);
        /*
         */
        this.wd.sketch.paste_sketch(this.sketch);
    }

    slim_sleeve(sum_reduction = 2) {
        this.cut_sleeve_stripes(4);
        const len = sum_reduction / 6;
        const dart_lines = this.sketch.get_typed_lines("dart");
        dart_lines.sort(function (a, b) {
            return a.data.dart_number - b.data.dart_number;
        });

        dart_lines.forEach((line) => {
            const adjacent = line.p2.other_adjacent_lines(line);
            adjacent.sort((a, b) => b.p2.x - a.p2.x);

            const cut = this.sketch.cut(line, line.p1);
            let vec = adjacent[0].get_line_vector().normalize().scale(-len);
            adjacent[0].p2.move_to(adjacent[0].p2.add(vec));

            vec = adjacent[1].get_line_vector().normalize().scale(len);
            adjacent[1].p1.move_to(adjacent[1].p1.add(vec));
            this.sketch.glue(cut.cut_parts[0].line, cut.cut_parts[1].line, {
                points: "delete_both",
                lines: "delete",
                anchors: "keep",
            });
        });
    }

    flare_straight(sum_flare_distance = 2) {
        if (sum_flare_distance <= 0) {
            return;
        }
        const number_of_stripes = 20;
        const flare_distance = sum_flare_distance / 19;
        let lns = [];
        let cuts = [];
        let bottom = this.sketch.get_typed_line("bottom");
        let armpit = this.sketch.get_typed_line("armpit");

        const len = bottom.get_length() / number_of_stripes;
        const vec = this.sketch
            .get_typed_line("side")
            .get_line_vector()
            .scale(-2)
            .add(new Vector(0, -this.wd.measurements.distance_armpit * 2));

        let temp = this.sketch.split_line_at_length(bottom, len);
        for (let i = 0; i < number_of_stripes - 1; i++) {
            lns.push(
                this.sketch.line_at_angle(
                    temp.point,
                    deg_to_rad(0),
                    vec.length()
                ).line
            );
            lns[i].data.type = "dart";
            lns[i].data.dart_number = i + 1;
            lns[i].swap_orientation();
            const intersection = this.sketch.intersect_lines(lns[i], armpit);
            armpit = intersection.l2_segments[0];
            this.sketch.remove(intersection.l1_segments[0].p1);

            armpit = intersection.l2_segments[0];

            cuts.push(this.sketch.cut(intersection.l1_segments[1]));
            new ConnectedComponent(cuts[i].cut_parts[0].line).transform((p) => {
                p.move_to(p.add(new Vector(-flare_distance, 0)));
            });

            if (i < number_of_stripes - 2) {
                temp = this.sketch.split_line_at_length(
                    temp.line_segments[1],
                    len
                );
            }
        }
        armpit = this.sketch.get_typed_lines("armpit");
        armpit.sort((a, b) => {
            return a.p1.x - b.p1.x;
        });
        //armpit.sort((a, b) => { return Math.abs(a.p1.x - a.p2.x) - Math.abs(b.p1.x - b.p2.x); });
        let pts = [];
        pts.push(armpit[0].p1);
        armpit.forEach((line, index) => {
            if (index < armpit.length / 2) {
                pts.push(this.sketch.add_point(line.p2.copy()));
            } else if (index > armpit.length / 2) {
                pts.push(this.sketch.add_point(line.p1.copy()));
            }
        });
        pts.push(armpit[armpit.length - 1].p2);

        const curve = this.sketch.line_from_function_graph(
            pts[0],
            pts[pts.length - 1],
            spline.catmull_rom_spline(pts)
        );
        curve.data.type = "armpit";
        const f = this.sketch.get_typed_point("f");
        const g = this.sketch.get_typed_point("g");
        const ln = this.sketch.line_between_points(f, g);
        ln.set_color("black");
        ln.data.type = "bottom";
        /*
         */
        lns = this.sketch.get_typed_lines("dart");

        lns.forEach((line) => {
            this.sketch.remove(line.p1, line.p2);
        });

        pts.pop();
        delete pts[0];
        pts.forEach((p) => {
            this.sketch.remove(p);
        });
    }

    add_wristband(width = 2) {
        const sk = new SewingSketch();
        const len = this.wd.measurements.wristwidth;

        const p1 = sk.add_point(0, 0);
        const p2 = sk.add_point(len, 0);
        const p3 = sk.add_point(0, width);
        const p4 = sk.add_point(len, width);

        sk.line_between_points(p1, p2);
        sk.line_between_points(p1, p3);
        sk.line_between_points(p3, p4);
        sk.line_between_points(p2, p4);

        this.sketch.paste_sketch(sk);
    }

    ruffles(width = 4) {
        const sk = new SewingSketch();
        this.wd.sketch = sk;
        const len = this.wd.measurements.armpit_length * 2;

        const p1 = sk.add_point(width, 0);
        const p2 = sk.add_point(len - width, 0);
        const p3 = sk.add_point(0, width);
        const p4 = sk.add_point(len, width);

        sk.line_between_points(p1, p2);
        //sk.line_between_points(p1, p3);
        sk.line_between_points(p3, p4);
        //sk.line_between_points(p2, p4);

        sk.line_from_function_graph(p1, p3, arc(-0.15));
        sk.line_from_function_graph(p2, p4, arc(0.15));
    }

    // sollte im Idealfall anders gelöst werden, bin gerade aber faul
    casual_sleeve(height) {
        this.wd.mult_vector = height;
        this.wd.sketch = new SewingSketch();
        this.sketch = this.wd.sketch;
        this.wd.measurements["arm"] += 3;
        this.#main_construction();
    }
}
