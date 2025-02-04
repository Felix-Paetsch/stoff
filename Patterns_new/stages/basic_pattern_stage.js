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

import PatternStage from "../../PatternLib/pattern_stages/baseStage.js";
import SewingSketch from "../../PatternLib/sewing_sketch.js";
import { Vector, triangle_data, rotation_fun } from "../../StoffLib/geometry.js";
import Point from "../../StoffLib/point.js";
import { spline } from "../../StoffLib/curves.js";

export default class BasicPatternStage extends PatternStage{
    constructor(t){
        super();
    }

    on_enter(){
        const s = new SewingSketch();
        this.wd.sketch = s;

        this.sketch = s;
        this.side = "front";
        this.#initialize_shorthands();
        this.#main_construction_without_waist();
    }

    finish() {
        return this.wd.sketch;
    }

    #initialize_shorthands() {
        const shorthand_map = {
            "center": ["center_height_front", "center_height_back"],
            "shoulder": ["shoulder_height_front", "shoulder_height_back"],
            "across": ["across_front", "across_back"],
            "bust": ["bust_width_front", "bust_width_back"],
            "diagonal": ["diagonal_front", "diagonal_back"],
            "point_width": ["bust_point_width", "shoulderblade_width"],
            "point_height": ["bust_point_height", "shoulderblade_height"],
            "waist": ["waist_width_front", "waist_width_back"],
            "bottom": ["bottom_width_front", "bottom_width_back"],
        }

        this.sh = { ... this.measurements };
        for (const key of Object.keys(shorthand_map)) {
            if (typeof shorthand_map[key] == "string") {
                this.sh[key] = this.measurements[shorthand_map[key]];
            } else {
                this.sh[key] = this.side == "front" ? this.measurements[shorthand_map[key][0]] : this.measurements[shorthand_map[key][1]];
            }
        }
    }

    #main_construction_without_waist(){

        const pts = {}
        const lns = {}

        pts.a = this.sketch.point(0, 0);
        pts.b = this.sketch.point(0, this.sh.center);
        lns.a_to_b = this.sketch.line_between_points(pts.a, pts.b);
        lns.a_to_b.data.type = "fold";

        pts.p1 = this.sketch.point(pts.b.subtract(new Vector(0, this.sh.shoulder)));
        pts.p2 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.across / 2, 0)));
        pts.p3 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.shoulder_width / 2, 0)));
        pts.p4 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.bust / 2, 0)));


        let len = Math.sqrt(Math.pow(this.sh.diagonal, 2) - Math.pow(this.sh.shoulder_width / 2, 2));
        pts.c = this.sketch.point(pts.b.add(new Vector(pts.p3.x, -len)));

        len = Math.sqrt(Math.pow(this.sh.shoulder_length, 2) - Math.pow(pts.c.y - pts.p1.y, 2));

        pts.d = this.sketch.point(pts.c.add(new Vector(len, pts.p1.y - pts.c.y)));
        lns.c_to_d = this.sketch.line_between_points(pts.d, pts.c);
        lns.c_to_d.data.type = "shoulder";

        pts.c.move_to(pts.c.subtract(pts.d).scale(0.75).add(pts.d));



        const len_b = 10;
        const ve = pts.c.subtract(pts.p2);
        const len_c = Math.sqrt(Math.abs((len_b * len_b) - (ve.x * ve.x)));
        const a = pts.p2;
        const vec = pts.p3.subtract(pts.p1).get_orthonormal();
        ve.x = 0;
        const vec_p = vec.scale(len_c).add(a).add(ve);
        pts.p5 = this.sketch.add_point(new Point(vec_p.x, vec_p.y)).set_color("blue");


        len = pts.p4.subtract(pts.p2).length();

        const vec_p6 = pts.p2.subtract(pts.p1).get_orthonormal().scale((this.sh.arm - 20) * (2 / 5)).add(pts.p5).add(pts.p4.subtract(pts.p2).normalize().scale(len - 2.5))//.subtract(p2)//.add(p3);
        pts.p6 = this.sketch.add_point(vec_p6).set_color("blue");
        pts.e = this.sketch.add_point(pts.p6.add(new Vector(-2.5, 0)));

        let a1;
        if ((this.sh.waist/2) - 3 <= this.sh.bust/2){
            a1 = this.sh.waist / 2;
            console.log("here")
        } else {
            let add_ease = (this.sh.waist / 2) - 3 - this.sh.bust / 2;
            a1 = (this.sh.waist / 2) - add_ease;
            console.log(add_ease)
            this.ease = this.ease + add_ease;
        }
        let c1 = pts.e.subtract(pts.b).length();
        let b1 = this.sh.side_height;


        let angle = triangle_data({ a: a1, b: b1, c: c1 }).alpha;
        let fun = rotation_fun(pts.e, angle);
        pts.f = this.sketch.add_point(pts.b.copy());
        pts.f.data.type = "f"
        pts.f.move_to(fun(pts.b));
        
        let ln = this.sketch.line_between_points(pts.e, pts.f);
        ln.data.type = "side";
        ln = this.sketch.line_between_points(pts.b, pts.f);
        ln.data.type = "waistline";
        pts.f.move_to(pts.e.subtract(pts.f).normalize().scale(-this.sh.side_height).add(pts.e));

        lns.l_help = this.sketch.line_between_points(pts.d, pts.a);
        const neck = this.#construct_neckline(lns.l_help);
        neck.data.type = "neckline";
        neck.data.curve = true;
        neck.data.direction = -1;
        neck.data.direction_split = -1;

        const pt_vec = lns.a_to_b.get_line_vector().scale(0.2).add(pts.a);
        pts.pt = this.sketch.add_point(new Point(pt_vec.x, pt_vec.y));
        this.sketch.remove_points(pts.p1, pts.p2, pts.p3, pts.p4);

        pts.p5.data.type = "p5";
        pts.p6.data.type = "p6";
        pts.e.data.type = "e";
        pts.c.data.type = "c";
        this.#ease();

        this.sketch.data = {
            "p5": pts.p5,
            "p6": pts.p6,
            "pt": pts.pt,
            "height_sleeve": pts.e.y - pts.c.y,
            "fside": this.side
        }
    };
    
    #construct_neckline(neckline_base){
        let p = this.sketch.point(neckline_base.p1.x, neckline_base.p2.y);
        let p2 = this.sketch.point(neckline_base.p1.x, neckline_base.p2.y);
        let vec = p.subtract(neckline_base.p1).scale(0.5);
        p.move_to(vec.add(neckline_base.p1));
        if(this.sketch.data.is_front){
            vec = p2.subtract(neckline_base.p2).scale(0.6);
        } else {
            vec = p2.subtract(neckline_base.p2).scale(0.4);
        }
        p2.move_to(vec.add(neckline_base.p2));

        let l = this.sketch.line_from_function_graph(neckline_base.p1, neckline_base.p2, spline.bezier(
            [neckline_base.p1, p, p2, neckline_base.p2]
        ));
        l.data.type = "neckline";
        this.sketch.remove(neckline_base, p, p2);
        return l;
    }

    #main_construction(){
        // I want an image for (in) the docs!
        /*
        
            One could change the order in which things are drawn to make this more clear.
            I like the create_neckline fn a lot.
            But I probably prefer to see this fn as a black box anyway, so it doesn't matter to much.
        
        */

        const pts = {}
        const lns = {}

        pts.a = this.sketch.point(0, 0);
        pts.b = this.sketch.point(0, this.sh.center);
        lns.a_to_b = this.sketch.line_between_points(pts.a, pts.b);
        lns.a_to_b.data.type = "fold";

        pts.p1 = this.sketch.point(pts.b.subtract(new Vector(0, this.sh.shoulder)));
        pts.p2 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.across / 2, 0)));
        pts.p3 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.shoulder_width / 2, 0)));
        pts.p4 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.bust / 2, 0)));

        let len = Math.sqrt(Math.pow(this.sh.diagonal, 2) - Math.pow(this.sh.shoulder_width / 2, 2));
        pts.c = this.sketch.point(pts.b.add(new Vector(pts.p3.x, -len)));

        len = Math.sqrt(Math.pow(this.sh.shoulder_length, 2) - Math.pow(pts.c.y - pts.p1.y, 2));

        pts.d = this.sketch.point(pts.c.add(new Vector(len, pts.p1.y - pts.c.y)));
        lns.c_to_d = this.sketch.line_between_points(pts.d, pts.c);
        lns.c_to_d.data.type = "shoulder";

        pts.c.move_to(pts.c.subtract(pts.d).scale(0.75).add(pts.d));


        const len_b = 10;
        const ve = pts.c.subtract(pts.p2);
        const len_c = Math.sqrt(Math.abs((len_b * len_b) - (ve.x * ve.x)));
        const a = pts.p2;
        const vec = pts.p3.subtract(pts.p1).get_orthonormal();
        ve.x = 0;
        const vec_p = vec.scale(len_c).add(a).add(ve);
        pts.p5 = this.sketch.add_point(new Point(vec_p.x, vec_p.y)).set_color("blue");


        len = pts.p4.subtract(pts.p2).length();

        const vec_p6 = pts.p2.subtract(pts.p1).get_orthonormal().scale((this.sh.arm - 20) * (2 / 5)).add(pts.p5).add(pts.p4.subtract(pts.p2).normalize().scale(len - 2.5))//.subtract(p2)//.add(p3);
        pts.p6 = this.sketch.add_point(vec_p6).set_color("blue");
        pts.e = this.sketch.add_point(pts.p6.add(new Vector(-2.5, 0)));

        lns.b_to_g = this.sketch.line_at_angle(pts.b, - Math.PI / 2, this.sh.point_width / 2).line;

        lns.b_to_g.data.type = "waistline";
        lns.b_to_g.data.dartside = "inner";
        pts.g = lns.b_to_g.p2;

        let diff = this.sh.bust_width_back + this.sh.bust_width_front - this.sh.under_bust;
        let a1 = pts.e.subtract(pts.g).length();
        let c1 = (this.sh.bust / 2) - lns.b_to_g.get_length() + (diff / 4);
        let b1 = this.sh.side_height;

        let angle = triangle_data({ a: a1, b: b1, c: c1 }).gamma;

        let fun = rotation_fun(pts.e, angle);
        pts.f = this.sketch.add_point(pts.g.copy());
        pts.f.move_to(fun(pts.g));
        pts.f.move_to(pts.e.subtract(pts.f).normalize().scale(-this.sh.side_height).add(pts.e));

        lns.e_to_f = this.sketch.line_between_points(pts.e, pts.f);

        lns.e_to_f.data.type = "side";

        let vec_p7 = pts.a.subtract(pts.b).normalize().scale(this.sh.point_height).add(pts.b);
        pts.p7 = this.sketch.add_point(new Point(vec_p7.x, vec_p7.y));
        pts.p7.set_color("blue");
        let vec_h = pts.p7.subtract(pts.b).add(pts.g);
        pts.h = this.sketch.add_point(new Point(vec_h.x, vec_h.y));

        lns.l_help = this.sketch.line_between_points(pts.f, pts.g);
        const length_b_g = lns.b_to_g.get_length();
        const supposed_length = this.sh.waist / 2 - length_b_g;
        const p8_help = this.sketch.split_line_at_length(lns.l_help, supposed_length)

        this.sketch.remove_line(p8_help.line_segments[1]);
        pts.p8 = p8_help.point;

        lns.l_help = this.sketch.line_between_points(pts.h, pts.p8);
        lns.g_to_h = this.sketch.line_between_points(pts.h, pts.g);
        lns.g_to_h.data.type = "dart";
        lns.g_to_h.data.dartside = "inner";

        const vec_length = lns.g_to_h.get_length();
        let vec_i = lns.l_help.get_line_vector().normalize().scale(vec_length).add(pts.h);
        pts.i = this.sketch.add_point(vec_i);
        lns.f_to_i = this.sketch.line_between_points(pts.i, pts.f);
        lns.f_to_i.data.type = "waistline";
        lns.f_to_i.data.dartside = "outer";
        lns.h_to_i = this.sketch.line_between_points(pts.h, pts.i);
        lns.h_to_i.data.type = "dart";
        lns.h_to_i.data.dartside = "outer";

        this.sketch.validate();
        this.sketch.remove_points(pts.p1, pts.p2, pts.p3, pts.p4, pts.p7, pts.p8);

        this.add_component("neckline", new NecklineSideHalf(this, pts.d, pts.a));

        const center_vec = lns.a_to_b.get_line_vector().scale(0.2).add(pts.a);
        this.sketch.data = {
            "base_p5": pts.p5,
            "base_p6": pts.p6,
            "center": center_vec,
            "is_front": this.side == "front"
        }
    };

    #ease(){
        let s = this.sketch;
        let line = s.get_typed_line("shoulder")

        let temp = s.split_line_at_length(line, 0.5*line.get_length());
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
        console.log(this.wd.ease)

        // pts is an object, not an array, to iterate it you can do:
        Object.keys(pts).forEach(key => {
            const p = pts[key];
            p.move_to(p.add(vec));
            });
            /*
        */
    }
}