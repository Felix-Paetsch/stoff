import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector } from '../../StoffLib/geometry.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import { line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline} from './basicFun.js';
import evaluate from '../evaluation/basicEval.js';

import utils from '../change/utils.js';


function front(mea){
  const s = new Sketch();

  const p1 = s.add_point(new Point(0,0));
  const b = s.add_point(new Point(0, mea.shoulder_height_front));
  let a_to_b = line_with_length(s, b, mea.center_height_front, 180).swap_orientation();
  a_to_b.data.type = "fold";
  const a = a_to_b.p1;
  let p1_to_p4 = line_with_length(s, p1, mea.bust_width_front/2, 90);
  const p4 = p1_to_p4.p2;
  let p1_to_p3 = line_with_length(s, p1, mea.shoulder_width * (1/2), 90);
  const p3 = p1_to_p3.p2;
  let p1_to_p2 = line_with_length(s, p1, mea.across_front/2, 90);
  const p2 = p1_to_p2.p2;
  let p5_1 = get_point_on_other_line(s, p1_to_p3, mea.shoulder_w_point/2, p1_to_p3.get_line_vector().get_orthonormal());
  let l = s.line_between_points(p5_1, p1);
  let d_h = point_at(s, l, mea.shoulder_length/l.get_length());
  const d = d_h.point;
  let c_h = point_at(s, d_h.l1_segment, 1/3);
  const c = c_h.point;
  const c_to_d = c_h.l2_segment;
  c_to_d.data.type = "shoulder";
  c_to_d.data.direction = 1;
  c_to_d.swap_orientation();
  s.remove_point(p5_1);
  s.remove_line(d_h.l2_segment);

  let p5_2 = get_point_on_other_line2(s, p2, c.subtract(p2), 10, p1_to_p3.get_line_vector().get_orthonormal()).set_color("blue");

  const vec_p6 = p1_to_p2.get_line_vector().get_orthonormal().scale((mea.arm - 20) * (2/5)).add(p5_2).subtract(p2).add(p3);
  const p6 = s.add_point(new Point(vec_p6.x, vec_p6.y)).set_color("blue");
  const e = s.add_point(new Point(vec_p6.subtract(p3).add(p4).x, vec_p6.subtract(p3).add(p4).y));
  let e_to_f = line_with_length(s, e, mea.side_height, 0);
  let f = e_to_f.p2;
  e_to_f.data.type = "side";

  let b_to_g = line_with_length(s, b, mea.bust_point_width/2, 90);
  b_to_g.data.type = "waistline";
  b_to_g.data.part = 1;
  const g = b_to_g.p2;
  let vec_p7 = a.subtract(b).normalize().scale(mea.bust_point_height).add(b);
  const p7 = s.add_point(new Point(vec_p7.x, vec_p7.y));
  p7.set_color("blue");
  let vec_h = p7.subtract(b).add(g);
  let h = s.add_point(new Point(vec_h.x, vec_h.y));

  let l_help = s.line_between_points(f,g);
  const length_b_g = b_to_g.get_length();
  const supposed_length = mea.waist_width_front /2 - length_b_g;
  let p8_help =  point_at(s, l_help, supposed_length/l_help.get_length());
  s.remove_line(p8_help.l2_segment);
  const p8 = p8_help.point;
  l_help = s.line_between_points(h, p8);
  let g_to_h = s.line_between_points(h, g);
  g_to_h.data.type = "dart";
  const vec_length = g_to_h.get_length();
  let vec_i = l_help.get_line_vector().normalize().scale(vec_length).add(h);
  const i = s.add_point(new Point(vec_i.x, vec_i.y));
  let f_to_i = s.line_between_points(f,i);
  f_to_i.data.type = "waistline";
  f_to_i.data.part = 2;
  let h_to_i = s.line_between_points(h,i);
  h_to_i.data.type = "dart";


  s.remove_point(p1);
  s.remove_point(p2);
  s.remove_point(p3);
  s.remove_point(p4);
  s.remove_point(p7);
  s.remove_point(p8);

  const neck = neckline(s, c_to_d, a_to_b);
  neck.data.type = "neckline";
  neck.data.curve = true;
  neck.data.direction = -1;
  neck.data.direction_split = -1;


  a_to_b.set_color("green");

  const pt_vec = a_to_b.get_line_vector().scale(0.2).add(a);
  const pt = s.add_point(new Point(pt_vec.x, pt_vec.y));

  //console.log(c_to_d.data)

  s.data = {
     "comp": new ConnectedComponent(a_to_b),
     "loose_end1": b,
     "loose_end2":f,
     "p5": p5_2,
     "p6": p6,
     "direction": -1,
     "pt": pt,
     "height_sleeve": e.y - c.y,
     "front":true
   }

  return s;

};


function back(mea){
  const s = new Sketch();

  const p1 = s.add_point(new Point(0,0));
  const b = s.add_point(new Point(0, mea.shoulder_height_back));
  let a_to_b = line_with_length(s, b, mea.center_height_back, 180).swap_orientation();
  a_to_b.data.type = "fold";
  const a = a_to_b.p1;
  let p1_to_p4 = line_with_length(s, p1, mea.bust_width_back/2, -90);
  const p4 = p1_to_p4.p2;
  let p1_to_p3 = line_with_length(s, p1, mea.shoulder_width * (1/2), -90);
  const p3 = p1_to_p3.p2;
  let p1_to_p2 = line_with_length(s, p1, mea.across_back/2, -90);
  const p2 = p1_to_p2.p2;

  let p5_1 = get_point_on_other_line(s, p1_to_p3, mea.shoulder_w_point/2, p1_to_p3.get_line_vector().get_orthonormal().scale(-1));
  let l = s.line_between_points(p5_1, p1);
  let d_h = point_at(s, l, mea.shoulder_length/l.get_length());
  const d = d_h.point;
  let c_h = point_at(s, d_h.l1_segment, 1/3);
  const c = c_h.point;
  const c_to_d = c_h.l2_segment;
  c_to_d.data.type = "shoulder";
  c_to_d.data.direction = 1;
  c_to_d.swap_orientation();

  s.remove_point(p5_1);
  s.remove_line(d_h.l2_segment);

  let p5_2 = get_point_on_other_line2(s, p2, c.subtract(p2), 10, p1_to_p3.get_line_vector().get_orthonormal().scale(-1)).set_color("blue");

  const vec_p6 = p1_to_p2.get_line_vector().get_orthonormal().scale(-(mea.arm - 20) * (3/5)).add(p5_2).subtract(p2).add(p3);
  const p6 = s.add_point(new Point(vec_p6.x, vec_p6.y)).set_color("blue");
  const e = s.add_point(new Point(vec_p6.subtract(p3).add(p4).x, vec_p6.subtract(p3).add(p4).y));
  let e_to_f = line_with_length(s, e, mea.side_height, 0);
  let f = e_to_f.p2;
  e_to_f.data.type = "side";

  let b_to_g = line_with_length(s, b, mea.shoulderblade_width/2, -90);
  b_to_g.data.type = "waistline";
  b_to_g.data.part = 1;
  const g = b_to_g.p2;
  let vec_p7 = a.subtract(b).normalize().scale(mea.shoulderblade_height).add(b);
  const p7 = s.add_point(new Point(vec_p7.x, vec_p7.y));
  p7.set_color("blue");
  let vec_h = p7.subtract(b).add(g);
  let h = s.add_point(new Point(vec_h.x, vec_h.y));

  let l_help = s.line_between_points(f,g);
  const length_b_g = b_to_g.get_length();
  const supposed_length = mea.waist_width_back /2 - length_b_g;
  let p8_help =  point_at(s, l_help, supposed_length/l_help.get_length());
  s.remove_line(p8_help.l2_segment);
  const p8 = p8_help.point;
  l_help = s.line_between_points(h, p8);
  let g_to_h = s.line_between_points(h, g);
  g_to_h.data.type = "dart";

  const vec_length = g_to_h.get_length();
  let vec_i = l_help.get_line_vector().normalize().scale(vec_length).add(h);
  const i = s.add_point(new Point(vec_i.x, vec_i.y));
  let f_to_i = s.line_between_points(f,i);
  f_to_i.data.type = "waistline";
  f_to_i.data.part = 2;
  let h_to_i = s.line_between_points(h,i);
  h_to_i.data.type = "dart";

  s.remove_point(p1);
  s.remove_point(p2);
  s.remove_point(p3);
  s.remove_point(p4);
  s.remove_point(p7);
  s.remove_point(p8);

  const neck = back_neckline(s, c_to_d, a_to_b);
  
  neck.data.type = "neckline";
  neck.data.curve = true;
  neck.data.direction = 1;
  neck.data.direction_split = -1;

  a_to_b.set_color("green")

  const pt_vec = a_to_b.get_line_vector().scale(0.2).add(a);
  const pt = s.add_point(new Point(pt_vec.x, pt_vec.y));

  s.data = {
        "comp": new ConnectedComponent(a_to_b),
        "loose_end1": b,
        "loose_end2":f,
        "p5": p5_2,
        "p6": p6,
        "direction": 1,
        "pt": pt,
        "height_sleeve": e.y - c.y,
        "front": false
    }

  return s;

}


function sleeve(mea, height, sleeve_type, len_front, len_back){
  let type = evaluate.eval_sleeve(sleeve_type);
  const s = new Sketch();
  const p1 = s.add_point(new Point(0,0));
  const a = s.add(new Point(0, (height/2)*type));

  const b = s.add_point(new Point(a.add(new Vector(0, mea["arm length"]))));
  s.data.length = mea["arm length"];
  if (evaluate.eval_sleeve_eingehalten(sleeve_type)){
    len_front = len_front + 1;
    len_back = len_back + 1;
  }


  // Kurve einzeichnen
  let pt1 = s.add_point(new Point(a.add(new Vector(-(mea.arm)*0.475, 0))));
  let pt2 = s.add_point(new Point(a.add(new Vector((mea.arm)*0.525, 0)))); // back

//  console.log(mea.arm, pt1.subtract(pt2).length())

  let c1 = curve(s, pt1, p1).swap_orientation();
  c1.data.curve = true;
  c1.data.front = true;
  c1.data.name = "armpit";
  let c2 = curve(s, p1, pt2).set_color("blue"); // back
  c2.data.curve = true;
  c2.data.name = "armpit";

//  console.log(c1.get_length(), pt1.subtract(p1).length(), len_front)
// kurve korrigieren
const r_squared =  p1.subtract(a).length_squared();
  if (c1.get_length() < len_front){
    const k = len_front/c1.get_length();
    const s_squared = pt1.subtract(a).length_squared();
    const s_prime = Math.sqrt(k*k*(r_squared + s_squared) - r_squared);
    pt1.move_to(-s_prime, pt1.y);
  }
  if (c2.get_length() < len_back){
    const k2 = len_back/c2.get_length();
    const s_squared2 = pt2.subtract(a).length_squared();
    const s_prime2 = Math.sqrt(k2*k2*(r_squared + s_squared2) - r_squared);
    pt2.move_to(s_prime2, pt2.y);
  }
  //  console.log(mea.arm, pt1.subtract(pt2).length())
  //  console.log(c1.get_length(), pt1.subtract(p1).length(), len_front)

// weiter im Text

  let wrist_p1 = s.add_point(new Point(b.add(new Vector(-(mea.wristwidth)*0.475, 0))));
  let wrist_p2 = s.add_point(new Point(b.add(new Vector((mea.wristwidth)*0.525, 0))));

  let l1 = s.line_between_points(pt1, wrist_p1);
  l1.data.type = "side";
  let l2 = s.line_between_points(pt2, wrist_p2);
  l2.data.type = "side";
  let wrist_l = s.line_between_points(wrist_p1, wrist_p2);
  wrist_l.data.type = "wrist";



  s.remove_point(a);
  s.remove_point(b);
  s.data.comp = new ConnectedComponent(p1);

  return s;
}

function curve(s, pt1, pt2, r = 1){
  return s.line_from_function_graph(pt1, pt2, t => {
      const t3 = t*t*t;
      const t4 = t3*t;
      const t5 = t4*t;

      // Integrate x^n(x-1)^n (and scale it nicely; theoretically not even needed thoug);
      return (10*t3 - 15*t4 + 6*t5) * r;
  });
};


export default {back, front, sleeve};