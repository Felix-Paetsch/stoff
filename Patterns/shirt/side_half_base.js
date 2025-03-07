import Sketch from '../core/sewing_sketch.js';
import Point from '../../Core/StoffLib/point.js';
import { Vector, rotation_fun, triangle_data, VERTICAL } from '../../Core/StoffLib/geometry.js';

import NecklineSideHalf from "../parts/neckline/neckline_side_half.js";

import PatternComponent from "../core/pattern_component.js";
import ArmpitSide from '../parts/armpit/armpit_side.js';
import ShirtSideBase from "./side_base.js";

export default class ShirtSideHalfBase extends PatternComponent{
    constructor(side, parent){
        super(parent);

        // Initialization
        this.side = side;
        this.initialize_shorthands();
        this.sketch = new Sketch();

        this.main_construction();

        // Independent Constructions
        this.get_component("neckline").construct_neckline_type();
        this.add_ease();
        this.construct_component("armpit", ArmpitSide);
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
                this.sh[key] = this.side == "front" ? this.measurements[shorthand_map[key][0]] : this.measurements[shorthand_map[key][1]];
            }
        }
    }

    main_construction(){
        // I want an image for (in) the docs!
        /*
        
            One could change the order in which things are drawn to make this more clear.
            I like the create_neckline fn a lot.
            But I probably prefer to see this fn as a black box anyway, so it doesn't matter to much.
        
        */

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


        const len_b = 10;
        const ve = pts.c.subtract(pts.p2);
        const len_c = Math.sqrt(Math.abs((len_b * len_b) - (ve.x * ve.x)));
        const a = pts.p2;
        const vec = pts.p3.subtract(pts.p1).get_orthonormal();
        ve.x = 0;
        const vec_p = vec.scale(len_c).add(a).add(ve);
        pts.p5 = this.sketch.add_point(new Point(vec_p.x, vec_p.y)).set_color("blue");


        len = pts.p4.subtract(pts.p2).length();

        const vec_p6 = pts.p2.subtract(pts.p1).get_orthonormal().scale((this.sh.arm - 20) * (2/5)).add(pts.p5).add(pts.p4.subtract(pts.p2).normalize().scale(len - 2.5))//.subtract(p2)//.add(p3);
        pts.p6 = this.sketch.add_point(vec_p6).set_color("blue");
        pts.e = this.sketch.add_point(pts.p6.add(new Vector(-2.5, 0)));

        lns.b_to_g = this.sketch.line_at_angle(pts.b, - Math.PI / 2, this.sh.point_width/2).line;

        lns.b_to_g.data.type = "waistline";
        lns.b_to_g.data.dartside = "inner";
        pts.g = lns.b_to_g.p2;

        let diff = this.sh.bust_width_back + this.sh.bust_width_front - this.sh.under_bust;
        let a1 = pts.e.subtract(pts.g).length();
        let c1 = (this.sh.bust/2) - lns.b_to_g.get_length() + (diff/4);
        let b1 = this.sh.side_height;

        let angle = triangle_data({a: a1, b: b1, c: c1}).gamma;

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
        const supposed_length = this.sh.waist /2 - length_b_g;
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
    }

    add_ease(){
        let side = this.get_line("side");
        let extra = this.design_config.ease / 4;

        let ln = this.sketch.line_with_offset(side, extra, true);

        side.p1.move_to(ln.p1);
        side.p2.move_to(ln.p2);

        this.sketch.remove(ln.p1, ln.p2);
        return this;
    };

    unfolded_sketch(){
        const glue_sketch = new Sketch();

        this.mark_symmetry_line();
        this.get_sketch().anchor();
        glue_sketch.paste_sketch(this.get_sketch().mirror(VERTICAL));
        glue_sketch.paste_sketch(this.get_sketch().mirror(VERTICAL));
        this.get_sketch().remove_anchors();
        const symm_lines = glue_sketch.lines_by_key("symmetry_line")[true];
        glue_sketch.glue(...symm_lines, { points: "delete", anchors: "delete" });

        return glue_sketch;
    }

    unfold(){
        return ShirtSideBase.from_side_half(this);
    }

    _dart_lines_default_inner_outer_poitns(){
        return [this.point_between_lines("neckline", "fold"), this.point_between_lines("side", "waistline")]
    }

    compute_grainline(){
        let lines = this.get_lines("fold").sort((a, b) => b.get_length() - a.get_length());
        const gl = lines[0].get_line_vector().scale(-1);
        this.set_grainline(gl);
        return gl;
    };
    
    dartstyle(){
        return this.design_config.dartAllocation.dartstyle;
    }


    // =====================

    shift_dart_basic(dartside = null, position = null){
        // Shift anywhere except baseline
        dartside = dartside || this.dartside();
        position = position || this.dartposition();
  
        let line = this.get_line(dartside);
        const [inner, outer] = this.dart_lines();
  
        const fraction = Math.max(Math.min(position, 0.95), 0.05);
        const { point } = this.sketch.split_line_at_fraction(line, fraction);
  
        const old_dart_lines = this.dart_lines();
        this.sketch.cut([inner.common_endpoint(outer), point], true);
        
        const dart_lines = this.get_untyped_lines().set_data({
            type: "dart",
            dartposition: line.data.type
        });
  
        const res = this.sketch.glue(...old_dart_lines, {
            points: "delete"
        });
  
        line = this.sketch.line_between_points(
            this.point_between_lines("fold", "waistline"), 
            this.point_between_lines("side", "waistline")
        );
  
        this.sketch.remove(res.merged_lines[0]);
        line.data.type = "waistline";
  
        return dart_lines;
    }

    mark_symmetry_line(){
        const l = this.get_line("fold");
        l.data.symmetry_line = true;
        return l;
    }
}