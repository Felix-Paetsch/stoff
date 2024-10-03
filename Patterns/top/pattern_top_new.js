import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector, vec_angle_clockwise, rotation_fun , rad_to_deg} from '../../Geometry/geometry.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import {new_neckline, line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline} from '../funs/basicFun.js';
import evaluate from '../funs/basicEval.js';

import utils from '../funs/utils.js';


function front(mea){
  const s = new Sketch();

  const a = s.point(0,0);
  const b = s.point(0, mea.center_height_front);
  let a_to_b = s.line_between_points(a,b);
  a_to_b.data.type = "fold";
  const p1 = s.point(b.subtract(new Vector(0, mea.shoulder_height_front)));
  const p2 = s.point(p1.subtract(new Vector(mea.across_front/2, 0)));
  const p3 = s.point(p1.subtract(new Vector(mea.shoulder_width/2, 0)));
  const p4 = s.point(p1.subtract(new Vector(mea.bust_width_front/2, 0)));

  //l = s.line_between_points(p1, p3);

  let len = Math.sqrt(Math.pow(mea.diagonal_front, 2) - Math.pow(mea.shoulder_width/2, 2));

  const c = s.point(b.add(new Vector(p3.x, -len)));
  //console.log(mea.diagonal_front);

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
  let b_to_g = line_with_length(s, b, mea.bust_point_width/2, 90);
  b_to_g.data.type = "waistline";
  b_to_g.data.part = 1;
  const g = b_to_g.p2;

  // alter code ende

  let diff = mea.bust_width_back + mea.bust_width_front - mea.under_bust;
  let a1 = e.subtract(g).length();
  let c1 = (mea.waist_width_front/2) - b_to_g.get_length() + (diff/4);
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

//let f = e_to_f.p2;
e_to_f.data.type = "side";

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
  //let l_new_2 = s.line_between_points(p8, g)
l_help = s.line_between_points(h, p8);
let g_to_h = s.line_between_points(h, g);
g_to_h.data.type = "dart";
const vec_length = g_to_h.get_length();
let vec_i = l_help.get_line_vector().normalize().scale(vec_length).add(h);
const i = s.add_point(new Point(vec_i.x, vec_i.y));
let f_to_i = s.line_between_points(i,f);
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

//const neck = neckline(s, c_to_d, a_to_b);
l_help = s.line_between_points(d, a);
const neck = new_neckline(s, l_help);
neck.data.type = "neckline";
neck.data.curve = true;
neck.data.direction = -1;
neck.data.direction_split = -1;


a_to_b.set_color("green");

const pt_vec = a_to_b.get_line_vector().scale(0.2).add(a);
const pt = s.add_point(new Point(pt_vec.x, pt_vec.y));

  s.data = {
     "comp": new ConnectedComponent(a_to_b),
     "p5": p5,
     "p6": p6,
     "direction": -1,
     "pt": pt,
     "height_sleeve": e.y - c.y,
     "front": true
   }

  return s;
}




function back(mea){
  const s = new Sketch();

  const a = s.point(0,0);
  const b = s.point(0, mea.center_height_back);
  let a_to_b = s.line_between_points(a,b);
  a_to_b.data.type = "fold";
  const p1 = s.point(b.subtract(new Vector(0, mea.shoulder_height_back)));
  const p2 = s.point(p1.subtract(new Vector(-mea.across_back/2, 0)));
  const p3 = s.point(p1.subtract(new Vector(-mea.shoulder_width/2, 0)));
  const p4 = s.point(p1.subtract(new Vector(-mea.bust_width_back/2, 0)));

  //l = s.line_between_points(p1, p3);
  let len = Math.sqrt(Math.pow(mea.diagonal_back, 2) - Math.pow(mea.shoulder_width/2, 2));

  const c = s.point(b.add(new Vector(p3.x, -len)));
  //console.log(mea.diagonal_front);

  len = Math.sqrt(Math.abs(Math.pow(mea.shoulder_length, 2) - Math.pow(c.y - p1.y, 2)));
  //console.log(c.y)
  //console.log(p1.y)
  //console.log(Math.pow(c.y - p1.y, 2))

  const d = s.point(c.add(new Vector(-len, p1.y - c.y)));
  let c_to_d = s.line_between_points(d, c);
  c_to_d.data.type = "shoulder";

  c.move_to(c.subtract(d).scale(0.75).add(d));

  let p5 = get_point_on_other_line2(s, p2, c.subtract(p2), 10, p3.subtract(p1).get_orthonormal().scale(-1)).set_color("blue");

  len = p4.subtract(p2).length();

  const vec_p6 = p2.subtract(p1).get_orthonormal().scale(-(mea.arm - 20) * (2/5)).add(p5).add(p4.subtract(p2).normalize().scale(len - 2.5))//.subtract(p2)//.add(p3);
  const p6 = s.add_point(vec_p6).set_color("blue");
  const e = s.add_point(p6.add(new Vector(2.5, 0)));

// alter code
let b_to_g = line_with_length(s, b, mea.shoulderblade_width/2, -90);
b_to_g.data.type = "waistline";
b_to_g.data.part = 1;
const g = b_to_g.p2;
// ende alter code

    let diff = mea.bust_width_back + mea.bust_width_front - mea.under_bust;

    let a1 = e.subtract(g).length();
    let c1 = (mea.waist_width_back/2) - b_to_g.get_length() + (diff/4);
    let b1 = mea.side_height;
    let angle = get_angle_cos(a1, c1, b1);


    let fun = rotation_fun(e, -angle);
    let f = s.add_point(g.copy());
    f.data.type = "f"
    f.move_to(fun(g));

    f.move_to(e.subtract(f).normalize().scale(-mea.side_height).add(e));
    /*
    */
    let e_to_f = s.line_between_points(e, f);


    // ------------ ab hier alter code

  //let e_to_f = line_with_length(s, e, mea.side_height, 0);
  //let f = e_to_f.p2;
  e_to_f.data.type = "side";


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
  let f_to_i = s.line_between_points(i,f);
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

  l_help = s.line_between_points(d, a);
  const neck = new_neckline(s, l_help);
  //const neck = back_neckline(s, c_to_d, a_to_b);

  neck.data.type = "neckline";
  neck.data.curve = true;
  neck.data.direction = 1;
  neck.data.direction_split = -1;

  a_to_b.set_color("green")

  const pt_vec = a_to_b.get_line_vector().scale(0.2).add(a);
  const pt = s.add_point(new Point(pt_vec.x, pt_vec.y));

  s.data = {
        "comp": new ConnectedComponent(a_to_b),
        "p5": p5,
        "p6": p6,
        "direction": 1,
        "pt": pt,
        "height_sleeve": e.y - c.y,
        "front": false
    }


  return s;

};


function get_angle_cos(a, b, c){
  let sum = Math.pow(a, 2) + Math.pow(c, 2) - Math.pow(b, 2);
  let mult = 2 * a * c;
  let div = sum / mult;
  let cos = Math.acos(div);
  return cos;
}


export default {back, front};
