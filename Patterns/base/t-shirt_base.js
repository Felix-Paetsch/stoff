import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector, rotation_fun, triangle_data } from '../../StoffLib/geometry.js';
import { spline } from "../../StoffLib/curves.js";

import PatternComponent from "./pattern_component.js";

import {line_with_length, point_at, get_point_on_other_line2} from '../funs/basicFun.js';


import neck from '../neckline/neckline.js';
import arm from '../sleeves/simple_sleeve.js';
import seam from '../seam_allowance/simple_seam.js';



export default class TShirtBasePattern extends PatternComponent{
    constructor(mea, ease, design, side = "front"){
        /*
            Notes:
                You have to decide what to put in the config object (see pattern) or whether you need it at all.
                In my head it is initial data for the setUp that woun't change -> help keep track of stuff later
                Likewise "this.side" is redundant (if you want to include fromt as a boolean at least), but i liked strings more.

                main_construction is still messy and i am not sure how (whether) to change it.
                Note that i created the pts and lns objects. They have two purposes:
                    - more easily see whcih things are pts and lines in the code
                    - you can iterate over the keys and add them to the lines / pts as attributes if you want that

                I havent changed the interface to the outside world. But

                {
                    "p5": pts.p5,
                    "p6": pts.p6,
                    "pt": pts.pt,
                    "height_sleeve": pts.e.y - pts.c.y,
                    "front": this.config.side == "front"
                }

                seem like strange data attributes. Usually whenever you have something really messy, it should be really descriptive what comes in
                and what comes out.
        */
        super(mea, {ease, side}, design);

        this.sketch = new Sketch();

        this.seam_allowances = {
          neckline: 0.5,
          armpit: 1,
          hem: 2,
          side: 1
        };

        this.initialize_shorthands();
        this.main_construction();
        this.add_ease();
        this.neckline();
        this.armpit();
    }

    initialize_shorthands(){
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
        for (const key of Object.keys(shorthand_map)){
            if (typeof shorthand_map[key] == "string"){
                this.sh[key] = this.measurements[shorthand_map[key]];
            } else {
                this.sh[key] = this.config.side == "front" ? this.measurements[shorthand_map[key][0]] : this.measurements[shorthand_map[key][1]];
            }
        }
    }

    main_construction(){
        const pts = {}
        const lns = {}

        pts.a = this.sketch.point(0,0);
        pts.b = this.sketch.point(0, this.sh.center);
        lns.a_to_b = this.sketch.line_between_points(pts.a,pts.b);
        lns.a_to_b.data.type = "fold";

        pts.p1 = this.sketch.point(pts.b.subtract(new Vector(0, this.sh.shoulder)));
        pts.p2 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.across/2, 0)));
        pts.p3 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.shoulder_width/2, 0)));
        pts.p4 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.bust/2, 0)));

        let len = Math.sqrt(Math.pow(this.sh.diagonal, 2) - Math.pow(this.sh.shoulder_width/2, 2));
        pts.c = this.sketch.point(pts.b.add(new Vector(pts.p3.x, -len)));

        len = Math.sqrt(Math.pow(this.sh.shoulder_length, 2) - Math.pow(pts.c.y - pts.p1.y, 2));

        pts.d = this.sketch.point(pts.c.add(new Vector(len, pts.p1.y - pts.c.y)));
        lns.c_to_d = this.sketch.line_between_points(pts.d, pts.c);
        lns.c_to_d.data.type = "shoulder";

        pts.c.move_to(pts.c.subtract(pts.d).scale(0.75).add(pts.d));

        pts.p5 = get_point_on_other_line2(this.sketch, pts.p2, pts.c.subtract(pts.p2), 10, pts.p3.subtract(pts.p1).get_orthonormal()).set_color("blue");

        len = pts.p4.subtract(pts.p2).length();

        const vec_p6 = pts.p2.subtract(pts.p1).get_orthonormal().scale((this.sh.arm - 20) * (2/5)).add(pts.p5).add(pts.p4.subtract(pts.p2).normalize().scale(len - 2.5))//.subtract(p2)//.add(p3);
        pts.p6 = this.sketch.add_point(vec_p6).set_color("blue");
        pts.e = this.sketch.add_point(pts.p6.add(new Vector(-2.5, 0)));

        lns.b_to_g = line_with_length(this.sketch, pts.b, this.sh.point_width/2, 90);
        lns.b_to_g.data.type = "waistline";
        lns.b_to_g.data.side = "inner";
        pts.g = lns.b_to_g.p2;
        pts.g.data.type = "g";

        let diff = this.sh.bust_width_back + this.sh.bust_width_front - this.sh.under_bust;
        let a1 = pts.e.subtract(pts.g).length();
        let c1 = (this.sh.bust/2) - lns.b_to_g.get_length() + (diff/4);
        let b1 = this.sh.side_height;

        let angle = triangle_data({a: a1, b: b1, c: c1}).gamma;

        let fun = rotation_fun(pts.e, angle);
        pts.f = this.sketch.add_point(pts.g.copy());
        pts.f.data.type = "f"
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
        const supposed_length = this.sh.waist /2 - length_b_g;
        const p8_help =  point_at(this.sketch, lns.l_help, supposed_length/lns.l_help.get_length());
        this.sketch.remove_line(p8_help.l2_segment);
        pts.p8 = p8_help.point;

        lns.l_help = this.sketch.line_between_points(pts.h, pts.p8);
        lns.g_to_h = this.sketch.line_between_points(pts.h, pts.g);
        lns.g_to_h.data.type = "dart";
        lns.g_to_h.data.side = "inner";

        const vec_length = lns.g_to_h.get_length();
        let vec_i = lns.l_help.get_line_vector().normalize().scale(vec_length).add(pts.h);
        pts.i = this.sketch.add_point(new Point(vec_i.x, vec_i.y));
        pts.i.data.type = "i";
        lns.f_to_i = this.sketch.line_between_points(pts.i, pts.f);
        lns.f_to_i.data.type = "waistline";
        lns.f_to_i.data.side = "outer";
        lns.h_to_i = this.sketch.line_between_points(pts.h, pts.i);
        lns.h_to_i.data.type = "dart";
        lns.h_to_i.data.side = "outer";


        this.sketch.remove_points(pts.p1, pts.p2, pts.p3, pts.p4, pts.p7, pts.p8);

        lns.l_help = this.sketch.line_between_points(pts.d, pts.a);
        const neck = this.construct_neckline(lns.l_help);
        neck.data.type = "neckline";
        neck.data.curve = true;
        neck.data.direction = -1;
        neck.data.direction_split = -1;

        const pt_vec = lns.a_to_b.get_line_vector().scale(0.2).add(pts.a);
        pts.pt = this.sketch.add_point(new Point(pt_vec.x, pt_vec.y));

        this.sketch.data = {
            "p5": pts.p5,
            "p6": pts.p6,
            "pt": pts.pt,
            "height_sleeve": pts.e.y - pts.c.y,
            "front": this.config.side == "front"
        }
    }

    construct_neckline(neckline_base){
        let p = this.sketch.point(neckline_base.p1.x, neckline_base.p2.y);
        let p2 = this.sketch.point(neckline_base.p1.x, neckline_base.p2.y);
        let vec = p.subtract(neckline_base.p1).scale(0.5);
        p.move_to(vec.add(neckline_base.p1));
        if(this.sketch.data.front){
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

    add_ease(){
        let lines = this.sketch.lines_by_key("type");
        let side = lines.side[0];
        let extra = this.config.ease / 4;

        let ln = this.sketch.line_with_offset(side, extra, true);

        side.p1.move_to(ln.p1);
        side.p2.move_to(ln.p2);

        this.sketch.remove_points(ln.p1, ln.p2);
        return this;
    };

    get_sketch(){
        return this.sketch;
    }

    neckline(){
      const design = this.design["neckline"].type;
      if (design === "round"){
        neck.slim_neckline(this.get_sketch(), 0.7);
      } else if (design === "V-Line wide"){
        neck.v_line(this.get_sketch(), "wide");
      } else if (design === "V-Line deep"){
        neck.v_line(this.get_sketch(), "deep");
      } else if(design === "V-Line") {
        neck.v_line(this.get_sketch(), "normal");
      } else if (design === "round wide"){
        neck.round_wide(this.get_sketch());
      } else if (design === "square"){
        neck.square(this.get_sketch());
      } else if (design === "boat"){
        neck.boat(this.get_sketch());
      }
    }

    armpit(){
      arm.armpit(this.get_sketch());
    }

    set_grainline(vec){
      this.sketch.data.up_direction = vec;
    }

    set_grainline_basic(){
      let lines = this.get_sketch().lines_by_key("type").fold;

      if (lines.length > 1){
        // es wird automatisch der Teil von Fold gewählt, welcher am längsten ist
        lines = lines.sort(function(a, b){return b.get_length() - a.get_length()});
      }
      this.set_grainline(lines[0].get_line_vector().scale(-1));
    };

    dartstyle(){
      return this.design.dartAllocation.dartstyle;
    }

    // soll je nach Art der Linie (seite, hals, saum) unterschiedliche
    // längen an Nahtzugabe geben
    seam_allowance(s){

      let lines = s.lines_by_key("type");
      lines.side[0].data.s_a = "side";
      s.dev.at_new_url("/wa")
      lines.armpit[0].data.s_a = "armpit";
      lines.shoulder[0].data.s_a = "side";
      seam.seam_allow(s, [lines.side[0], lines.armpit[0], lines.shoulder[0]], this.seam_allowances);
    }
    seam_allowance_after_mirror(s){

      seam.seam_allowance_after_mirror(s, this.seam_allowances);
    }
}

export class TShirtBasePatternFront extends TShirtBasePattern{
    constructor(mea, ease){
        super(mea, ease, "front")
    }
}

export class TShirtBasePatternBack extends TShirtBasePattern{
    constructor(mea, ease){
        super(mea, ease, "back")
    }
}
