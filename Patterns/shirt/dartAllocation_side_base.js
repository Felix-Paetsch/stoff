import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector, rotation_fun, triangle_data } from '../../StoffLib/geometry.js';
import dart from '../darts/simple_dart.js';
import annotate from '../annotate/annotate.js';

import NecklineSide from "../neckline/neckline_side.js";
import {line_with_length} from '../funs/basicFun.js';

import seam from '../seam_allowance/simple_seam.js';
import arm from "../sleeves/simple_sleeve.js"

import PatternComponent from "../core/pattern_component.js";
import Armpit from '../sleeves/armpit.js';

export default class DartAllocationSideBase extends PatternComponent{
    constructor(side, parent){
        super(parent);
        this.side = side;
        
        this.initialize_shorthands();
        this.sketch = new Sketch();

        this.main_construction();
        this.add_ease();

        this.get_component("neckline").construct();

        this.seam_allowances = {
          neckline: 0.5,
          armpit: 1,
          hem: 2,
          side: 1
        };

        const armpit = new Armpit(this);
        armpit.construct();
        this.add_component("armpit", armpit);
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

        lns.b_to_g = line_with_length(this.sketch, pts.b, this.sh.point_width/2, 90);
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

        this.sketch.remove_points(pts.p1, pts.p2, pts.p3, pts.p4, pts.p7, pts.p8);

        lns.l_help = this.sketch.line_between_points(pts.d, pts.a);

        this.add_component("neckline", new NecklineSide(this, lns.l_help));
        
        const center_vec = lns.a_to_b.get_line_vector().scale(0.2).add(pts.a);
        this.sketch.data = {
          "base_p5": pts.p5,
          "base_p6": pts.p6,
          "center": center_vec,
          "is_front": this.side == "front" 
        }
    }

    inner_line(l1, l2){
        if (l1.minimal_distance(this.sketch.data.center) > l2.minimal_distance(this.sketch.data.center)){
            return l2;
        } return l1;
    }

    outer_line(l1, l2){
        return this.inner_line(l1, l2) == l1 ? l2 : l1;
    }

    ordered_lines(l1, l2){
        return {
          "inner": this.inner_line(l1, l2),
          "outer": this.outer_line(l1, l2)
        }
    }

    order_lines(lines){
        const r = lines.map(l => [l, l.minimal_distance(this.sketch.data.center)])
                    .sort((l1, l2) => l1[1] - l2[1])
                    .map(l => l[0])

        lines.splice(0, lines.length, ...r);
        return r;
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

    compute_grainline(){
        let lines = this.get_lines("fold").sort((a, b) => b.get_length() - a.get_length());
        const gl = lines[0].get_line_vector().scale(-1);
        this.set_grainline(gl);
        return gl;
    };

    /*
    
        Todo Next:
        1.
        - Move tuck() to the correct file
        - Figure out what fill_darts() macht ~~~~ it could be....
        => tuck() to tuck_darts() and update names

        2.
        Figure out what fill_in_darts macht (und ob fill_darts umbenannt werden sollte)
        Incorporate "Seam Allowance"

        3. Fix for other configurations


        4. Start 2nd round of refactor:
        - Delte unnesseccary files
        - Look at Todo.md
    */

    dartstyle(){
      return this.design_config.dartAllocation.dartstyle;
    }

    fill_darts(){
      const lines = this.order_lines(this.get_lines("dart"));
      while(lines.length > 0){
        this.fill_in_dart([lines[0], lines[1]]);
        this.sketch.remove(dart.single_dart(this.sketch, [lines[0], lines[1]]));
        annotate.annotate_dart(this.sketch, [lines[0], lines[1]]);
        lines.splice(0, 2);
      }
      annotate.remove_dart(this.sketch);
      this.connect_filling(this.sketch);
    }

    tuck(){
      const lines = this.order_lines(this.get_lines("dart"));

      while(lines.length > 0){
        this.fill_in_dart(s, [lines[0], lines[1]]);
        dart.simple_tuck(s, [lines[0], lines[1]]);
        annotate.annotate_tuck(s, [lines[0], lines[1]]);
        lines.splice(0, 2);
      }
      annotate.remove_dart(s);
      this.connect_filling(s);
      
    }

    fill_in_dart(lines){
    
        if(lines[0].data.dartposition === "waistline"){
          let other_lines = this.get_lines("dart_bottom");
          if (other_lines){
            if (other_lines[0].p1 !== other_lines[1].p1){
              let ln1 = s.line_between_points(lines[0].p1, other_lines[0].p1);
              ln1.data.side = "inner";
              let ln2 = s.line_between_points(lines[0].p1, other_lines[1].p1);
              ln2.data.side = "outer";
              let data1 = other_lines[0].data;
              let data2 = other_lines[1].data;
              this.sketch.remove(other_lines[0], other_lines[1]);
              dart.fill_in_dart(s, [ln1, ln2]).data.type = "filling";
    
              s.line_between_points(ln1.p2, lines[1].p2).data = data1;
              s.line_between_points(ln2.p2, lines[0].p2).data = data2;
              s.remove(ln1, ln2);
            } else {
              return;
            }
          } else {
            dart.fill_in_dart(this.sketch, lines).data.type = "filling";
          }
        } else {
          const {inner, outer} = this.ordered_lines(...lines);
          dart.fill_in_dart(this.sketch, inner, outer).data.type = "filling";
        }
    }
  
    connect_filling(s){
      let lines = s.lines_by_key("type").filling;
      if (lines){
        lines.forEach((line) => {
          let ln1 = line.p1.other_adjacent_line(line);
          let ln2 = line.p2.other_adjacent_line(line);
  
          if(line.get_endpoints().includes(ln1.p2)){
            ln1 = s.merge_lines(
              ln1, line, true,
              (data_ln1, data_line) => {
                return data_ln1;
              }
            );
              s.merge_lines(ln1, ln2, true, (data_ln1, data_l2) => {
                  return data_ln1;
              });
  
          } else {
            ln2 = s.merge_lines(
              ln2, line, true,
              (data_ln1, data_line) => {
                return data_ln1;
              }
            );
              s.merge_lines(ln2, ln1, true, (data_ln1, data_l2) => {
                  return data_ln1;
              });
  
  
          }
  
        });
      }
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