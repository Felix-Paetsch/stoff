import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector, vec_angle, rotation_fun , rad_to_deg} from '../../StoffLib/geometry.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import {new_neckline, line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline} from '../funs/basicFun.js';
import evaluate from '../funs/basicEval.js';

import utils from '../funs/utils.js';



function first_pattern(mea, ease, front = true){
  const s = new Sketch();

  let center;
  let shoulder;
  let across;
  let bust;
  let diagonal;
  let point_width;
  let point_height;
  let waist;
  if (front){
    center = mea.center_height_front;
    shoulder = mea.shoulder_height_front;
    across = mea.across_front;
    bust = mea.bust_width_front;
    diagonal = mea.diagonal_front;
    point_width = mea.bust_point_width;
    point_height = mea.bust_point_height;
    waist = mea.waist_width_front;
  } else {
    center = mea.center_height_back;
    shoulder = mea.shoulder_height_back;
    across = mea.across_back;
    bust = mea.bust_width_back;
    diagonal = mea.diagonal_back;
    point_width = mea.shoulderblade_width;
    point_height = mea.shoulderblade_height;
    waist = mea.waist_width_back;

  }



  const a = s.point(0,0);
  const b = s.point(0, center);
  let a_to_b = s.line_between_points(a,b);
  a_to_b.data.type = "fold";
  const p1 = s.point(b.subtract(new Vector(0, shoulder)));
  const p2 = s.point(p1.subtract(new Vector(across/2, 0)));
  const p3 = s.point(p1.subtract(new Vector(mea.shoulder_width/2, 0)));
  const p4 = s.point(p1.subtract(new Vector(bust/2, 0)));


  let len = Math.sqrt(Math.pow(diagonal, 2) - Math.pow(mea.shoulder_width/2, 2));

  const c = s.point(b.add(new Vector(p3.x, -len)));

  len = Math.sqrt(Math.pow(mea.shoulder_length, 2) - Math.pow(c.y - p1.y, 2));
  const d = s.point(c.add(new Vector(len, p1.y - c.y)));
  let c_to_d = s.line_between_points(d, c);
  c_to_d.data.type = "shoulder";

  c.move_to(c.subtract(d).scale(0.75).add(d));

  let p5 = get_point_on_other_line2(s, p2, c.subtract(p2), 10, p3.subtract(p1).get_orthonormal()).set_color("blue");

  len = p4.subtract(p2).length();

  const vec_p6 = p2.subtract(p1).get_orthonormal().scale((mea.arm - 20) * (2/5)).add(p5).add(p4.subtract(p2).normalize().scale(len - 2.5))//.subtract(p2)//.add(p3);
  const p6 = s.add_point(vec_p6).set_color("blue");
  const e = s.add_point(p6.add(new Vector(-2.5, 0)));

// alter code
  let b_to_g = line_with_length(s, b, point_width/2, 90);
  b_to_g.data.type = "waistline";
  b_to_g.data.side = "inner";
  const g = b_to_g.p2;
  g.data.type = "g";

  // alter code ende

  let diff = mea.bust_width_back + mea.bust_width_front - mea.under_bust;
  let a1 = e.subtract(g).length();
  let c1 = (bust/2) - b_to_g.get_length() + (diff/4);
  let b1 = mea.side_height;
  let angle = get_angle_cos(a1, c1, b1);

  let fun = rotation_fun(e, angle);
  let f = s.add_point(g.copy());
  f.data.type = "f"
  f.move_to(fun(g));

  f.move_to(e.subtract(f).normalize().scale(-mea.side_height).add(e));
  /*
  */
  let e_to_f = s.line_between_points(e, f);





  // ------------ ab hier alter code

  e_to_f.data.type = "side";

  let vec_p7 = a.subtract(b).normalize().scale(point_height).add(b);
  const p7 = s.add_point(new Point(vec_p7.x, vec_p7.y));
  p7.set_color("blue");
  let vec_h = p7.subtract(b).add(g);
  let h = s.add_point(new Point(vec_h.x, vec_h.y));

  let l_help = s.line_between_points(f,g);
  const length_b_g = b_to_g.get_length();
  const supposed_length = waist /2 - length_b_g;
  let p8_help =  point_at(s, l_help, supposed_length/l_help.get_length());
  s.remove_line(p8_help.l2_segment);
  const p8 = p8_help.point;

  l_help = s.line_between_points(h, p8);
  let g_to_h = s.line_between_points(h, g);
  g_to_h.data.type = "dart";
  g_to_h.data.side = "inner";

  const vec_length = g_to_h.get_length();
  let vec_i = l_help.get_line_vector().normalize().scale(vec_length).add(h);
  const i = s.add_point(new Point(vec_i.x, vec_i.y));
  i.data.type = "i";
  let f_to_i = s.line_between_points(i,f);
  f_to_i.data.type = "waistline";
  f_to_i.data.side = "outer";
  let h_to_i = s.line_between_points(h,i);
  h_to_i.data.type = "dart";
  h_to_i.data.side = "outer";


  s.remove_points(p1, p2, p3, p4, p7, p8);

  l_help = s.line_between_points(d, a);
  const neck = new_neckline(s, l_help);
  neck.data.type = "neckline";
  neck.data.curve = true;
  neck.data.direction = -1;
  neck.data.direction_split = -1;



  const pt_vec = a_to_b.get_line_vector().scale(0.2).add(a);
  const pt = s.add_point(new Point(pt_vec.x, pt_vec.y));

  s.data = {
     "p5": p5,
     "p6": p6,
     "pt": pt,
     "height_sleeve": e.y - c.y,
     "front": front
   }

  add_ease(s, ease);
  return s;



}



function get_angle_cos(a, b, c){
  let sum = Math.pow(a, 2) + Math.pow(c, 2) - Math.pow(b, 2);
  let mult = 2 * a * c;
  let div = sum / mult;
  let cos = Math.acos(div);
  return cos;
}


function add_ease(s, extra_width){
  let lines = s.lines_by_key("type");
  let side = lines.side[0];
  let extra = extra_width / 4;

  let ln = s.line_with_offset(side, extra, true);

  side.p1.move_to(ln.p1);
  side.p2.move_to(ln.p2);

  s.remove_points(ln.p1, ln.p2);
  return s;
};



export default {first_pattern};
