/*
    entry: base, erst bis taille, dann auch komplett? was machen mit den zusätzlichen Abnähern bei Michael' Fällen?
        ease umsetzen

    exit: data ist front & back + Ärmel

    Funktionen:
    - Halsausschnitt
    - abnäher verschieben & aufspalten in mehrere
    - Abnäher "löschen"
    - Ärmel

*/

import BaseStage from "../../../Core/Stages/base_stages/baseStage.js";
import SewingSketch from "../../../Core/PatternLib/sewing_sketch.js";
import {
    Vector,
    rotation_fun,
    vec_angle_clockwise,
    vec_angle,
    deg_to_rad,
    triangle_data,
} from "../../../Core/StoffLib/geometry.js";
import Point from "../../../Core/StoffLib/point.js";
import { spline } from "../../../Core/StoffLib/curves.js";
import ConnectedComponent from "../../../Core/StoffLib/connected_component.js";

// To be ported
// import NecklineSideHalf from "../../Patterns/parts/neckline/neckline_side_half.js"

// There are three types of basic pattern

export default class BasicBaseStage extends BaseStage {
    constructor(
        one_w_dart = true,
        basic = null,
        side = "front",
        needed_base_type = 1
    ) {
        super();
        this.one_w_dart = one_w_dart;
        this.basic_config = basic;
        this.side = side;
        this.needed_base_type = needed_base_type;
    }

    on_enter() {
        const s = new SewingSketch();
        this.wd.sketch = s;
        //    this.wd.side = this.side;

        this.sketch = s;
        //    this.side = "front";
        this.#initialize_shorthands();

        this.#main_construction();

        this.#add_pattern_type(); // ändert Schnittmuster von fitted zu normal oder oversize
        this.#adjust_ease_fabric_type();

        this.wd.direction_swap_of_k_l = false;
    }

    finish() {
        return this.wd.sketch;
    }

    #initialize_shorthands() {
        const shorthand_map = {
            center: ["center_height_front", "center_height_back"],
            shoulder: ["shoulder_height_front", "shoulder_height_back"],
            across: ["across_front", "across_back"],
            bust: ["bust_width_front", "bust_width_back"],
            diagonal: ["diagonal_front", "diagonal_back"],
            point_width: ["bust_point_width", "shoulderblade_width"],
            point_height: ["bust_point_height", "shoulderblade_height"],
            waist: ["waist_width_front", "waist_width_back"],
            bottom: ["bottom_width_front", "bottom_width_back"],
            over_bust: ["over_bust_front", "over_bust_back"],
            belly: ["belly_front", "belly_back"],
        };

        this.sh = { ...this.wd.measurements };
        for (const key of Object.keys(shorthand_map)) {
            if (typeof shorthand_map[key] == "string") {
                this.sh[key] = this.wd.measurements[shorthand_map[key]];
            } else {
                this.sh[key] =
                    this.side == "front"
                        ? this.wd.measurements[shorthand_map[key][0]]
                        : this.wd.measurements[shorthand_map[key][1]];
            }
        }
        this.wd.sh = this.sh;
    }

    #construct_neckline() {
        let a = this.sketch.get_typed_point("a");
        let d = this.sketch.get_typed_point("d");
        let p = this.sketch.point(d.x, a.y);
        let p2 = this.sketch.point(p.copy());

        let vec2 = d
            .get_adjacent_line()
            .get_line_vector()
            .get_orthonormal()
            .scale(-d.subtract(a).length())
            .add(d);
        p2.move_to(p2.subtract(new Vector(vec2.x, 0)));
        p.move_to(p.subtract(new Vector(vec2.x, 0)));
        let vec = p.subtract(d).scale(0.5).add(d);
        p.move_to(vec);

        /*
        if(this.side == "front"){
            vec = p2.subtract(a).scale(0.6);
        } else {
            vec = p2.subtract(a).scale(0.4);
        }
        p2.move_to(vec.add(a));
        */
        let l = this.sketch.line_from_function_graph(
            d,
            a,
            spline.bezier([d, p, p2, a])
        );
        l.data.type = "neckline";
        l.set_color("black");
        this.sketch.remove(p, p2);
        return l;
        /*
         */
    }

    // This part is the same for each of the pattern variants
    #construct_parts(pts, lns, pts2, lns2) {
        pts.a = this.sketch.point(0, 0);
        pts.b = this.sketch.point(0, this.sh.center);
        lns.a_to_b = this.sketch.line_between_points(pts.a, pts.b);
        lns.a_to_b.data.type = "fold";

        pts.p1 = this.sketch.point(
            pts.b.subtract(new Vector(0, this.sh.shoulder))
        );
        pts.p2 = this.sketch.point(
            pts.p1.subtract(new Vector(this.sh.across / 2, 0))
        );
        pts.p3 = this.sketch.point(
            pts.p1.subtract(new Vector(this.sh.shoulder_width / 2, 0))
        );
        pts.p4 = this.sketch.point(
            pts.p1.subtract(new Vector(this.sh.bust / 2, 0))
        );
        let len = Math.sqrt(
            Math.pow(this.sh.diagonal, 2) -
                Math.pow(this.sh.shoulder_width / 2, 2)
        );
        pts.c = this.sketch.point(pts.b.add(new Vector(pts.p3.x, -len)));

        len = Math.sqrt(
            Math.pow(this.sh.shoulder_length, 2) -
                Math.pow(pts.c.y - pts.p1.y, 2)
        );

        pts.d = this.sketch.point(
            pts.c.add(new Vector(len, pts.p1.y - pts.c.y))
        );
        lns.c_to_d = this.sketch.line_between_points(pts.d, pts.c);
        lns.c_to_d.data.type = "shoulder";

        pts.c.move_to(lns.c_to_d.get_line_vector().scale(0.75).add(pts.d));

        lns.b_to_f = this.sketch.line_at_angle(
            pts.b,
            -Math.PI / 2,
            this.sh.waist / 2
        ).line;
        lns.b_to_f.data.type = "b_to_g";
        pts.f = lns.b_to_f.p2;
        pts.f.data.type = "f";

        let vec_h = pts.b.subtract(
            new Vector(this.sh.point_width / 2, this.sh.point_height)
        );
        pts.h = this.sketch.add_point(new Vector(vec_h.x, vec_h.y));
        pts.h.data.type = "h";

        let angle = 0;
        if (this.sh.bust > this.sh.over_bust) {
            len = this.sh.side_height - this.sh.point_height;
            // nur erstmal zur sicherheit, falld das nicht im Abschnitt vorher gemacht wurde

            let diff = this.sh.bust / 2 - this.sh.over_bust / 2;
            let pt = this.sketch.add_point(
                pts.h.subtract(new Vector(diff / 2, -len))
            );
            let pt2 = this.sketch.add_point(pt.add(new Vector(diff, 0)));

            angle = vec_angle(pt.subtract(pts.h), pt2.subtract(pts.h));

            this.sketch.remove(pt, pt2);
        }

        if (this.sh.bust > this.sh.waist) {
            let diff = this.sh.bust - this.sh.waist;
            pts.g = this.sketch.add_point(
                pts.b.subtract(new Vector((this.sh.point_width - diff) / 2), 0)
            );

            let temp = this.sketch.add_point(
                pts.g.subtract(new Vector(diff, 0))
            );
            angle =
                angle +
                vec_angle_clockwise(
                    pts.g.subtract(pts.h),
                    temp.subtract(pts.h)
                );
            this.wd.distance = pts.g.subtract(temp).length();
            this.sketch.remove_points(temp, pts.g);

            /*
             */
        }

        let temp = this.sketch.split_line_at_length(
            lns.b_to_f,
            this.sh.point_width / 2
        );
        let rest_len = temp.line_segments[1].get_length();
        this.sketch.remove_point(pts.f);
        pts.f = temp.point;
        pts.f.data.type = "f";

        lns.c_to_h = this.sketch.line_between_points(pts.c, pts.h);
        lns.h_to_f = this.sketch.line_between_points(pts.h, pts.f);

        this.sketch.remove_points(pts.p1, pts.p2, pts.p3, pts.p4);

        // from here construct side

        pts2.a = this.sketch.add_point(-60, 15);
        pts2.b = this.sketch.add_point(-60, 15 + this.sh.side_height);
        lns2.a_to_b = this.sketch.line_between_points(pts2.a, pts2.b);

        //lns2.b_to_f = this.sketch.line_at_angle(pts2.b, rad_to_deg(90), rest_len);
        pts2.f = this.sketch.add_point(
            pts2.b.subtract(new Vector(-rest_len, 0))
        );
        lns2.b_to_f = this.sketch.line_between_points(pts2.b, pts2.f);

        pts2.h = this.sketch.add_point(
            pts2.b.subtract(
                new Vector(
                    -(this.sh.bust - this.sh.point_width) / 2,
                    this.sh.point_height
                )
            )
        );

        let temp_angle = vec_angle_clockwise(
            pts.c.subtract(pts.h),
            lns.h_to_f.get_line_vector()
        );

        pts2.c = this.sketch.add_point(pts2.f.copy());

        let fun = rotation_fun(pts2.h, -temp_angle - angle / 2);
        pts2.c.move_to(fun(pts2.c));

        let vec = pts2.c
            .subtract(pts2.h)
            .normalize()
            .scale(lns.c_to_h.get_length());
        pts2.c.move_to(pts2.h.add(vec));

        lns2.c_to_h = this.sketch.line_between_points(pts2.c, pts2.h);
        lns2.h_to_f = this.sketch.line_between_points(pts2.h, pts2.f);
    }

    #check_type_of_basic_pattern(pts, lns, pts2, lns2) {
        // ToDo: Damit ist es kein rechter Winkel mehr, aber das ist noch das am
        // naheliegensten, was ich machen kann

        // Korrigiert die Länge vom Abnäher von dem Seiten Panel
        let vec = lns2.h_to_f
            .get_line_vector()
            .normalize()
            .scale(lns.h_to_f.get_length());
        pts2.f.move_to(pts2.h.add(vec));

        // führt beide Teile zusammen, dass h übereinander liegt
        vec = pts2.h.subtract(pts.h);
        Object.keys(pts2).forEach((key) => {
            const p = pts2[key];
            p.move_to(p.subtract(vec));
        });

        // Berechnung der ganzen Winkel und überprüfung dieser

        let angle_top = vec_angle_clockwise(
            pts2.c.subtract(pts.h),
            pts.c.subtract(pts.h)
        );

        let angle_bottom = vec_angle_clockwise(
            pts.f.subtract(pts.h),
            pts2.f.subtract(pts.h)
        );
        if (this.needed_base_type == 3) {
            this.#construct_base_type_three(pts, lns, pts2, lns2);
            return;
        }

        if (angle_top >= 0.05) {
            // Abnäher oben funktioniert
            if (angle_bottom >= 0.05) {
                // Abnäher unten funktioniert auch // Typ 1
                this.#construct_base_type_one(pts, lns, pts2, lns2);
            } else if (angle_bottom >= -0.05) {
                // Abnäher kann geschlossen werden
                // ToDo: Kann das passieren? // Typ 2 oder neuer Typ 4???
                console.log("FEEEEHLER!!! Grundschnittmuster Typ 2 oder Typ 4");
            } else {
                // Es müssen zwei getrennte Teile bleiben // Typ 3
                this.#construct_base_type_three(pts, lns, pts2, lns2);
            }
        } else if (angle_top >= -0.05) {
            if (angle_bottom >= 0.05) {
                // Abnäher oben schließen, unten offen lassen // Typ 2
                this.#construct_base_type_two(pts, lns, pts2, lns2);
            } else if (angle_bottom >= -0.05) {
                // Abnäher wird geschlossen. Kein Abnäher "möglich" außer komplett
                // zersäbeln.
                // ToDo: Kann das passieren? // Typ 2 oder neuer Typ 5???
                console.log("FEEEEHLER!!! Grundschnittmuster Typ 2 oder Typ 5");
            } else {
                // zwei getrennte Teile // Typ 3
                this.#construct_base_type_three(pts, lns, pts2, lns2);
            }
        } else {
            // Fehlermeldung!!! Kann das überhaupt passieren?
            // Erstmal zwei getrennte Teile  // Typ 3
            console.log("FEEEEHLER!!! Grundschnittmuster Typ 3 oder Typ X");
            this.#construct_base_type_three(pts, lns, pts2, lns2);
        }
    }

    #construct_base_type_one(pts, lns, pts2, lns2, needed_type) {
        this.sketch.data.initial_type = 1;
        if (this.side == "front") {
            this.sketch.data.initial_type_front = 1;
        } else {
            this.sketch.data.initial_type_back = 1;
        }
        this.sketch.data.base_type = 1;

        let angle = vec_angle_clockwise(
            pts2.c.subtract(pts.h),
            pts.c.subtract(pts.h)
        );

        let fun = rotation_fun(pts.h, angle);
        Object.keys(pts2).forEach((key) => {
            const p = pts2[key];
            p.move_to(fun(p));
        });

        this.sketch.remove(pts2.c, lns.c_to_h);

        //      let temp_armpit = this.sketch.line_between_points(pts.c, pts2.a);
        //    temp_armpit = this.sketch.split_line_at_fraction(temp_armpit, 0.8);
        //    let ln_h = this.sketch.line_between_points(temp_armpit.point, pts.a);
        //    let ln_h2 = this.sketch.line_between_points(pts.d, pts2.b);
        //  let p_h = this.sketch.intersection_positions(ln_h, ln_h2);
        //  this.sketch.point(p_h[0]).data.type = "armpit_point1";
        //  this.sketch.remove(temp_armpit.point, ln_h2);

        //this.#construct_armpit();
        this.#construct_armpit_new();

        this.#merge_to_dart();

        if (this.needed_base_type == 2) {
            this.#change_type_1_into_type_2(pts, lns, pts2, lns2);
        } else if (this.needed_base_type == 3) {
            console.log(
                "Das funktioniert noch nicht! Ich kann noch nicht Typ 1 in Typ 3 umwandeln!"
            );
            return;
        }
        this.#draw_bottom_for_type_one_and_two();
    }

    #construct_base_type_two(pts, lns, pts2, lns2, needed_type) {
        this.sketch.data.initial_type = 2;
        this.sketch.data.base_type = 2;
        if (this.side == "front") {
            this.sketch.data.initial_type_front = 2;
        } else {
            this.sketch.data.initial_type_back = 2;
        }

        this.sketch.remove(pts2.c, lns.c_to_h);

        // ToDo: Gefällt mir noch nicht ganz, aber mal schauen

        //  let temp = lns.c_to_d.position_at_fraction(0.6);
        //    temp = this.sketch.add_point(temp);
        /*
      let temp_armpit = this.sketch.line_between_points(pts.c, pts2.a);
      temp_armpit = this.sketch.split_line_at_fraction(temp_armpit, 0.9);
      let temp2 = lns.a_to_b.position_at_fraction(0.01);
      temp2 = this.sketch.add_point(temp2);
      */

        //  let ln_h = this.sketch.line_between_points(pts2.a, pts.a);
        //  let ln_h2 = this.sketch.line_between_points(temp, pts2.b);
        //  let p_h = this.sketch.intersection_positions(ln_h, ln_h2);
        //  this.sketch.point(p_h[0]).data.type = "armpit_point1";

        //  this.sketch.remove(temp, ln_h2, ln_h, temp_armpit.point, temp2);
        //    this.sketch.remove(temp, ln_h2, ln_h)
        //    this.#construct_armpit();
        this.#construct_armpit_new();

        let pts_h = this.sketch.get_typed_points("h");
        this.sketch.merge_points(pts_h[0], pts_h[1]);

        if (this.needed_base_type == 1) {
            this.#change_type_2_into_type_1(pts, lns, pts2, lns2);
        } else if (this.needed_base_type == 3) {
            console.log(
                "Das funktioniert noch nicht! Ich kann noch nicht Typ 2 in Typ 3 umwandeln!"
            );
            return;
        }

        this.#draw_bottom_for_type_one_and_two();
    }

    #construct_base_type_three(pts, lns, pts2, lns2) {
        this.sketch.data.initial_type = 3;
        this.sketch.data.base_type = 3;

        let angle = vec_angle_clockwise(
            pts2.c.subtract(pts.h),
            pts.c.subtract(pts.h)
        );

        let fun = rotation_fun(pts.h, angle);
        Object.keys(pts2).forEach((key) => {
            const p = pts2[key];
            p.move_to(fun(p));
        });

        let temp_armpit = this.sketch.line_between_points(pts.c, pts2.a);
        temp_armpit = this.sketch.split_line_at_fraction(temp_armpit, 0.8);
        let ln_h = this.sketch.line_between_points(temp_armpit.point, pts.a);
        let ln_h2 = this.sketch.line_between_points(pts.d, pts2.b);
        let p_h = this.sketch.intersection_positions(ln_h, ln_h2);
        this.sketch.point(p_h[0]).data.type = "armpit_point1";
        this.sketch.remove(temp_armpit.point, ln_h2);

        pts.c.data.type = "";
        pts2.c.data.type = "c";
        this.#construct_armpit();
        pts.c.data.type = "c";

        fun = rotation_fun(pts.h, -angle);
        Object.keys(pts2).forEach((key) => {
            const p = pts2[key];
            p.move_to(fun(p));
        });
    }

    #change_type_1_into_type_2() {
        // ToDo
        this.sketch.data.base_type = 2;
        let h_to_k = this.sketch.get_typed_line("h_to_k");
        let h_to_l = this.sketch.get_typed_line("h_to_l");
        let h = h_to_k.p1;

        let e = this.sketch.get_typed_point("e");
        let angle = vec_angle_clockwise(
            h_to_k.p2.subtract(h),
            h_to_l.p2.subtract(h)
        );
        let fun = rotation_fun(e, angle);
        let fun2 = rotation_fun(e, (angle * 2) / 3);

        let glued = this.sketch.glue(h_to_k, h_to_l);
        let lns = glued.point.get_adjacent_lines();
        this.sketch.merge_lines(lns[0], lns[1], true).data.type = "d_to_c";

        let i_to_f = this.sketch.get_typed_line("i_to_f");

        i_to_f.p1.move_to(fun(i_to_f.p1));
        i_to_f.p2.move_to(fun(i_to_f.p2));

        let h_to_i = this.sketch.get_typed_line("h_to_i");
        let h_to_g = this.sketch.get_typed_line("h_to_g");

        // Abnäher um 1/3 der Differenz nach oben gesetzt
        /*
      let f = this.sketch.get_typed_point("f");
      let b = this.sketch.get_typed_point("b");
      let ln = this.sketch.line_between_points(b, f);

      let pt = this.sketch.intersection_positions(ln, h_to_g)[0];
      let vec = h_to_g.p2.subtract(pt).scale(1/3);
      h_to_g.p2.move_to(h_to_g.p2.subtract(vec))
      this.sketch.remove(ln);
      */
        let vec = h_to_i
            .get_line_vector()
            .normalize()
            .scale(h_to_g.get_length());
        h_to_i.p2.move_to(h_to_i.p1.add(vec));

        // Armaussschnitt um 2 cm runter gesetzt
        e.move_to(e.add(new Vector(0, 2)));
        i_to_f.p2.move_to(i_to_f.p2.add(new Vector(0, 2)));
    }

    #change_type_2_into_type_1() {
        this.sketch.data.base_type = 1;

        let shoulder = this.sketch.get_typed_line("shoulder");
        let h = this.sketch.get_typed_point("h");
        let e = this.sketch.get_typed_point("e");

        let pt = this.sketch.split_line_at_fraction(shoulder, 0.8).point;
        let ln = this.sketch.line_between_points(h, pt);

        let cuted = this.sketch.cut(ln, h);

        cuted.cut_parts[0].line.data.type = "h_to_k";
        cuted.cut_parts[0].line.p2.data.type = "k";
        cuted.cut_parts[0].line.p2.other_adjacent_line(
            cuted.cut_parts[0].line
        ).data.type = "d_to_k";

        cuted.cut_parts[1].line.data.type = "h_to_l";
        cuted.cut_parts[1].line.p2.data.type = "l";
        cuted.cut_parts[1].line.p2.other_adjacent_line(
            cuted.cut_parts[1].line
        ).data.type = "l_to_c";

        let h_to_g = this.sketch.get_typed_line("h_to_g");
        let h_to_i = this.sketch.get_typed_line("h_to_i");

        let angle = vec_angle_clockwise(
            h_to_g.p2.subtract(e),
            h_to_i.p2.subtract(e)
        );
        let fun = rotation_fun(e, angle);

        let glued = this.sketch.glue(h_to_g, h_to_i); // keine Ahnung ob hier ein Fehler drin ist, wenn ich {lines:"merge"} mache

        ln = this.sketch.line_between_points(h, glued.point);

        let b = this.sketch.get_typed_point("b");
        let f = this.sketch.get_typed_point("f");

        let distance_vec = new Vector(0, f.subtract(b).y / 2);

        b.move_to(b.add(distance_vec));
        glued.point.move_to(glued.point.add(distance_vec));

        cuted = this.sketch.cut(ln, h);

        let i_to_f = this.sketch.get_typed_line("i_to_f");

        i_to_f.p1.move_to(fun(i_to_f.p1));
        i_to_f.p2.move_to(fun(i_to_f.p2));

        h_to_g = cuted.cut_parts[0].line;
        h_to_g.data.type = "h_to_g";
        h_to_g.p2.type = "g";
        h_to_i = cuted.cut_parts[1].line;
        h_to_i.data.type = "h_to_i";

        let vec = h_to_i
            .get_line_vector()
            .normalize()
            .scale(h_to_g.get_length());

        h_to_i.p2.move_to(h_to_i.p1.add(vec));
    }

    #main_construction() {
        // I want an image for (in) the docs!
        /*

            One could change the order in which things are drawn to make this more clear.
            I like the create_neckline fn a lot.
            But I probably prefer to see this fn as a black box anyway, so it doesn't matter to much.

        */

        const pts = {};
        const lns = {};

        const pts2 = {};
        const lns2 = {};

        this.#construct_parts(pts, lns, pts2, lns2);

        pts.a.data.type = "a";
        pts.b.data.type = "b";
        pts.c.data.type = "c";
        pts.d.data.type = "d";
        pts.f.data.type = "g";
        pts2.a.data.type = "e";
        pts2.b.data.type = "f";
        pts2.f.data.type = "i";
        pts2.h.data.type = "h";
        pts.h.data.type = "h";

        lns.a_to_b.data.type = "fold";
        lns.b_to_f.data.type = "b_to_g";
        lns.h_to_f.data.type = "h_to_g";

        lns2.h_to_f.data.type = "h_to_i";
        lns.h_to_i = lns2.h_to_f;
        lns2.b_to_f.swap_orientation();
        lns2.b_to_f.data.type = "i_to_f";
        lns.i_to_f = lns2.b_to_f;
        lns2.a_to_b.data.type = "side";
        lns.e_to_f = lns2.a_to_b;

        //    ease_fun(this.wd, this.sh);
        //    this.#ease_new()

        this.#check_type_of_basic_pattern(pts, lns, pts2, lns2);

        /* alte Kommentare

        // Ich habe mich dazu entschieden, die Verlängerung noch allgemein zu machen und
        // anschließend erst zu spliten für Styleline o.ae.
*/

        //this.draw_round_neckline();
        //   this.#construct_neckline();

        if (this.sketch.data.base_type != 3) {
            this.#widen_armpit();
        }

        /*
         */
        /*
         */
        this.sketch.validate();
        /*
        this.sketch.remove_points(pts.p1, pts.p2, pts.p3, pts.p4, pts.p7, pts.p8);

       // this.add_component("neckline", new NecklineSideHalf(this, pts.d, pts.a));

        const center_vec = lns.a_to_b.get_line_vector().scale(0.2).add(pts.a);
        this.sketch.data = {
            "base_p5": pts.p5,
            "base_p6": pts.p6,
            "center": center_vec,
            "is_front": this.side == "front"
        }
        */
    }

    #ease() {
        let s = this.sketch;
        let line = s.get_typed_line("shoulder");

        let temp = s.split_line_at_length(line, 0.5 * line.get_length());
        let pt = s.add_point(temp.point.copy());

        temp.line_segments[0].replace_endpoint(temp.point, pt);
        let pts = {};
        pts.c = s.get_typed_point("c");
        pts.d = pts.c.get_adjacent_line().other_endpoint(pts.c);
        pts.p5 = s.get_typed_point("p5");
        pts.p6 = s.get_typed_point("p6");
        pts.e = s.get_typed_point("e");
        pts.f = s.get_typed_point("f");

        let vec = new Vector(-this.wd.ease, 0);
        //    console.log(this.wd.ease)

        // pts is an object, not an array, to iterate it you can do:
        Object.keys(pts).forEach((key) => {
            const p = pts[key];
            p.move_to(p.add(vec));
        });
        /*
         */
    }

    /*
    Ich mache das so, da ich die Abnäherspitze, sowie die Schulterpasse genau so lassen will,
    sonst verzieht sich alles. Die einzige Möglichkeit die ich habe ist also, den Bereich zwischen Seitennaht
    und Abnäherspitze zu vergrößern. Damit sich nicht der Winkel zum Abnäher hin verzieht, bleibt mir nur,
    die Punkte der Seitennaht (e, f) zu verschieben. Was das am Ende für Auswirkungen hat, muss ich wohl noch
    ausprobieren
*/

    #ease_new() {
        let percentage =
            this.sh.belly /
            (this.wd.measurements.belly_front +
                this.wd.measurements.belly_back);

        let ease = (this.wd.ease * percentage) / 2; // das hier sollte noch von Aussen gesteuert werden
        // und ggf. fuer beide Punkte einzelnd die Groesse bestimmt werden
        let e = this.sketch.get_typed_point("e");
        let f = this.sketch.get_typed_point("f");

        e.move_to(e.add(new Vector(-ease, 0)));
        f.move_to(f.add(new Vector(-ease, 0)));
    }

    #merge_to_dart() {
        let pts = this.sketch.get_typed_points("h");
        //this.sketch.merge_points(pts[0], pts[1]);

        let shoulder = this.sketch.get_typed_line("shoulder");
        let temp = this.sketch.split_line_at_fraction(shoulder, 0.9); // TODO: das hier ggf. ändern
        let k = temp.point;
        k.data.type = "k";
        let l = this.sketch.add_point(k.copy());
        l.data.type = "l";
        temp.line_segments[1].replace_endpoint(k, l);
        temp.line_segments[0].data.type = "d_to_k";
        temp.line_segments[1].data.type = "l_to_c";

        this.sketch.line_between_points(
            this.sketch.get_typed_line("h_to_g").p1,
            k
        ).data.type = "h_to_k";
        this.sketch.line_between_points(
            this.sketch.get_typed_line("h_to_i").p1,
            l
        ).data.type = "h_to_l";
        let h = this.sketch.get_typed_point("h");
        //let angle = vec_angle_clockwise(this.sketch.get_typed_line("h_to_g").get_line_vector(), this.sketch.get_typed_line("h_to_i").get_line_vector());

        let f = this.sketch.get_typed_point("f");
        let g = this.sketch.get_typed_point("g");

        let triangle = triangle_data({
            a: g.subtract(h).length(),
            c: f.subtract(h).length(),
            gamma: deg_to_rad(90),
        });

        /*    let angle2 =
            vec_angle_clockwise(f.subtract(h), g.subtract(h)) - deg_to_rad(90);
        let fun = rotation_fun(h, deg_to_rad(180) - angle2);
*/
        let angle2 = vec_angle_clockwise(f.subtract(h), g.subtract(h));
        let final_angle = angle2 + triangle.beta;
        let fun = rotation_fun(h, final_angle);

        let comp = new ConnectedComponent(l);
        //  console.log(angle2 + triangle.beta)
        comp.transform((p) => p.move_to(fun(p)));

        this.sketch.merge_points(pts[0], pts[1]);
    }

    #draw_bottom_for_type_one_and_two() {
        let f = this.sketch.get_typed_point("f");
        let b = this.sketch.get_typed_point("b");
        let b_to_m = this.sketch.line_at_angle(
            b,
            deg_to_rad(180),
            this.sh.waist_height
        ).line;
        b_to_m.data.type = "b_to_m";
        b_to_m.p2.data.type = "m";
        let m_to_n = this.sketch.line_at_angle(
            b_to_m.p2,
            deg_to_rad(270),
            this.sh.bottom / 2
        ).line;
        m_to_n.data.type = "m_to_n";
        //   console.log(this.sh);
        //console.log(m_to_n)
        m_to_n.p2.data.type = "n";

        let vec = b_to_m
            .get_line_vector()
            .scale(0.5)
            .add(b)
            .add(new Vector(-this.sh.belly / 2, 0));
        let o = this.sketch.add_point(vec);

        vec = m_to_n.p2.subtract(f).scale(0.5).add(f);
        let o2 = this.sketch.add_point(vec);

        let diff = o2.x - o.x;
        if (diff < 0) {
            this.sketch.line_between_points(f, o2).data.type = "f_to_o";
            this.sketch.line_between_points(o2, m_to_n.p2).data.type = "o_to_n";
            o2.data.type = "o";
            this.sketch.remove(o);
        } else {
            // bei Leuten mit viel Bauch wollen wir nicht, dass sie wie eine angezogene Murmel aussehen,
            // daher verschieben wir auch zusätzlich die Saumbreite
            m_to_n.p2.move_to(m_to_n.p2.add(new Vector(-diff / 2, 0)));
            this.sketch.line_between_points(f, o).data.type = "f_to_o";
            this.sketch.line_between_points(o, m_to_n.p2).data.type = "o_to_n";
            o.data.type = "o";
            this.sketch.remove(o2);
        }

        /*
         */
    }

    one_waistline_dart() {
        let h_to_g = this.sketch.get_typed_line("h_to_g");
        let h_to_i = this.sketch.get_typed_line("h_to_i");
        let h = this.sketch.get_typed_point("h");
        // hier wird der Abnäher gemalt und vervollständigt
        let len;
        if (this.side == "front") {
            len = h_to_g.get_length() + this.sh.waist_height / 3;
        } else {
            len = h_to_g.get_length() + (this.sh.waist_height * 2) / 3;
        }
        let vec = h_to_g.get_line_vector().normalize().scale(len).add(h);
        let j = this.sketch.add_point(vec);
        j.data.type = "j";

        len = h_to_g.p2.subtract(h_to_i.p2).length() / 2;
        len = this.sketch.get_typed_line("b_to_g").get_length() - len;
        //console.log(len)
        let pt = this.sketch.split_line_at_length(
            this.sketch.get_typed_line("b_to_g"),
            len
        ).point;
        const cut_res = this.sketch.cut([h, pt], h);

        this.sketch.glue(h_to_i, h_to_g);

        let i = this.sketch.get_typed_line("i_to_f").p1;
        let lns = i.get_adjacent_lines();
        let ln = this.sketch.merge_lines(lns[0], lns[1], true);
        ln.p1.data.type = "i";
        i = ln.p1;
        ln = i.other_adjacent_line(ln);
        ln.data.type = "h_to_i";
        ln.data.sub_type = "dart";
        ln = this.sketch.get_typed_line("b_to_g");
        let g = ln.p2;
        g.data.type = "g";
        ln = g.other_adjacent_line(ln);
        ln.data.type = "h_to_g";
        ln.data.sub_type = "dart";

        ln = this.sketch.line_between_points(j, g);
        ln.data.type = "j_to_g";
        ln.data.sub_type = "dart";
        ln = this.sketch.line_between_points(j, i);
        ln.data.type = "j_to_i";
        ln.data.sub_type = "dart";

        /*

        */
    }

    two_waistline_darts() {
        let h_to_g = this.sketch.get_typed_line("h_to_g");
        let h_to_i = this.sketch.get_typed_line("h_to_i");
        let h = this.sketch.get_typed_point("h");
        // hier wird der Abnäher gemalt und vervollständigt
        let len;
        if (this.side == "front") {
            len = h_to_g.get_length() + this.sh.waist_height / 3;
        } else {
            len = h_to_g.get_length() + (this.sh.waist_height * 2) / 3;
        }
        let vec = h_to_g.get_line_vector().normalize().scale(len).add(h);
        let j = this.sketch.add_point(vec);
        j.data.type = "j";

        let diff = h_to_g.p2.subtract(h_to_i.p2).length();
        len = diff + this.sketch.get_typed_line("i_to_f").get_length() / 3;
        vec = new Vector(-len, 0);

        let p = this.sketch.add_point(h.add(vec));
        p.data.type = "p";
        let q = this.sketch.add_point(j.add(vec));
        q.data.type = "q";

        let r = this.sketch.add_point(new Vector(p.x + diff / 4, h_to_i.p2.y));
        r.data.type = "r";
        let s = this.sketch.add_point(new Vector(p.x - diff / 4, h_to_i.p2.y));
        s.data.type = "s";

        let g = this.sketch.add_point(new Vector(j.x + diff / 4, h_to_g.p2.y));
        g.data.type = "g";
        let i = this.sketch.add_point(new Vector(j.x - diff / 4, h_to_g.p2.y));
        i.data.type = "i";

        if (this.sketch.data.base_type == 2 && this.sketch.initial_type != 2) {
            let f = this.sketch.get_typed_point("f");
            vec = new Vector(0, r.subtract(f).y / 2);
            s.move_to(s.subtract(vec));
            r.move_to(r.subtract(vec));
            g.move_to(g.subtract(vec.scale(1 / 2)));
            i.move_to(i.subtract(vec.scale(1 / 2)));
        }

        this.sketch.remove(h_to_g.p2, h_to_i.p2);

        let ln = this.sketch.line_between_points(h, g);
        ln.data.type = "h_to_g";
        ln.data.sub_type = "dart";
        ln = this.sketch.line_between_points(h, i);
        ln.data.type = "h_to_i";
        ln.data.sub_type = "dart";
        ln = this.sketch.line_between_points(j, g);
        ln.data.type = "j_to_g";
        ln.data.sub_type = "dart";
        ln = this.sketch.line_between_points(j, i);
        ln.data.type = "j_to_i";
        ln.data.sub_type = "dart";

        ln = this.sketch.line_between_points(p, r);
        ln.data.type = "p_to_r";
        ln.data.sub_type = "dart";
        ln = this.sketch.line_between_points(p, s);
        ln.data.type = "p_to_s";
        ln.data.sub_type = "dart";
        ln = this.sketch.line_between_points(q, r);
        ln.data.type = "q_to_r";
        ln.data.sub_type = "dart";
        ln = this.sketch.line_between_points(q, s);
        ln.data.type = "q_to_s";
        ln.data.sub_type = "dart";

        let f = this.sketch.get_typed_point("f");
        let b = this.sketch.get_typed_point("b");
        ln = this.sketch.line_between_points(b, g);
        ln.data.type = "b_to_g";
        ln = this.sketch.line_between_points(i, r);
        ln.data.type = "i_to_r";
        ln = this.sketch.line_between_points(s, f);
        ln.data.type = "s_to_f";
    }

    // wird extern aufgerufen
    draw_waitline_darts() {
        if (this.one_w_dart) {
            this.one_waistline_dart();
        } else {
            this.two_waistline_darts();
        }
    }

    #construct_armpit() {
        let pt = this.sketch.get_typed_point("armpit_point1");
        let pt2 = this.sketch.get_typed_point("armpit_point2");
        let c = this.sketch.get_typed_point("c");
        let e = this.sketch.get_typed_point("e");
        let side_vec = this.sketch.get_typed_line("side").get_line_vector();
        let vec = side_vec
            .get_orthonormal()
            .scale(-7)
            .add(e)
            .add(side_vec.normalize().scale(-2));

        let l = this.sketch.line_from_function_graph(
            c,
            e,
            spline.bezier([c, pt, vec, e])
        );
        this.sketch.remove(pt);
        l.set_color("black");
        l.data.type = "armpit";
        return l;
    }

    #construct_armpit_new() {
        let c = this.sketch.get_typed_point("c");
        let e = this.sketch.get_typed_point("e");

        const tiefe = this.sh.bust / 90;
        const entlang = 0.75;
        let l = this.sketch.line_from_function_graph(
            c,
            e,
            spline.bezier([
                new Vector(0, 0),
                new Vector(tiefe, entlang),
                new Vector(0, 1),
            ]) //.plot_control_points(this.sketch),
        );

        l.set_color("black");
        l.data.type = "armpit";
        return l;
    }

    #add_pattern_type() {
        const e = this.sketch.get_typed_point("e");
        e.move_to(e.subtract(new Vector(this.basic_config.width.bust / 4, 0)));

        const f = this.sketch.get_typed_point("f");
        f.move_to(
            f.subtract(new Vector(this.basic_config.width.waistline / 4, 0))
        );

        const o = this.sketch.get_typed_point("o");
        o.move_to(
            o.subtract(
                new Vector(
                    (this.basic_config.width.waistline +
                        this.basic_config.width.bottom) /
                        8,
                    0
                )
            )
        );

        const n = this.sketch.get_typed_point("n");
        n.move_to(
            n.subtract(new Vector(this.basic_config.width.bottom / 4, 0))
        );
    }

    #adjust_ease_fabric_type() {
        if (!this.basic_config.fabric_adjustment_needed) {
            return;
        }

        const m = this.sketch.get_typed_point("m");
        const e = this.sketch.get_typed_point("e");
        const len = this.wd.distance;
        if (this.basic_config.fabric == "jersey") {
            m.move_to(m.add(new Vector(0, len / 3)));
            e.move_to(e.add(new Vector(-len / 5, 0)));
        } else if (this.basic_config.fabric == "cotton") {
            m.move_to(m.add(new Vector(0, len / 5)));
            e.move_to(e.add(new Vector(-len / 7, 0)));
        }
    }

    #widen_armpit() {
        this.sketch.get_typed_line("m_to_n").data.type = "bottom";
        const e = this.sketch.get_typed_point("e");
        const c = this.sketch.get_typed_point("c");
        const side = this.sketch.get_typed_line("side");
        e.move_to(side.get_line_vector().normalize().scale(3).add(e));
        this.wd.measurements.distance_armpit = e.subtract(c).length();
        this.wd.measurements.armpit_length = this.sketch
            .get_typed_line("armpit")
            .get_length();
    }
}
