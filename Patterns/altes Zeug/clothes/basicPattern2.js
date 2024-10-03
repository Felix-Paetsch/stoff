import { debug, add_point, remove_point, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_line, intersection_points , merge_lines} from '../StoffLib/main.js';
import { Vector } from '../StoffLib/geometry.js';
import { get_orth_line, get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, armpit, round_neckline, smooth_out} from './basicFun_new.js';
import { dart_new, rotate_dart, tai_sho_dart, cut_line, rotate_point, scale_line, rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart} from './darts.js';

// Felix
const measurements = {
  shoulder_length: 16, // A
  shoulder_width: 46, //B
  shoulder_w_point: 50, //C
  bust_width_front: 50 +3,// D
  bust_width_back: 45 +3, // c
  bust_point_width: 22, // E
  bust_point_height: 18,// F
  shoulderblade_width: 17,// g
  shoulderblade_height: 20,// h
  tai_width_front: 40,// G // auch +3
  tai_width_back: 42 +3, // f
  tai_height: 26 * (2/3) +4,// e
  shoulder_height_front: 44, // H
  shoulder_height_back:48.5, // b
  center_height_front: 31, //I
  center_height_back: 44, //
  across_front: 37 * (15/16),  // J
  across_back: 36.5 * (15/16), // a
  side_height: 22, // K
  waist_width_front: 48 +4, // L
  waist_width_back:53 +4, // d

  arm: 35
}


savings = {
  front_p5: 0,
  front_p6: 0,
  back_p5: 0,
  back_p6: 0
}

//front(measurements, 0, 0);
//back(measurements, -measurements.bust_width_front/2 - measurements.bust_width_back/2 -2, 0);

function front(mea, x, y){

  const p1 = add_point(new Point(x,y));
  const b = add_point(new Point(x, y + mea.shoulder_height_front));
  let a_to_b = line_with_length(b, mea.center_height_front, 180).swap_orientation();
  const a = a_to_b.p1;
  let p1_to_p4 = line_with_length(p1, mea.bust_width_front/2, 90);
  const p4 = p1_to_p4.p2;
  let p1_to_p3 = line_with_length(p1, mea.shoulder_width * (1/2), 90);
  const p3 = p1_to_p3.p2;
  let p1_to_p2 = line_with_length(p1, mea.across_front/2, 90);
  const p2 = p1_to_p2.p2;
  //console.log(p1_to_p3.get_line_vector().get_orthonormal());
  let p5_1 = get_point_on_other_line(p1_to_p3, mea.shoulder_w_point/2, p1_to_p3.get_line_vector().get_orthonormal());
  let l = line_between_points(p5_1, p1);
  let d_h = point_at(l, mea.shoulder_length/l.get_length());
  const d = d_h.point;
  let c_h = point_at(d_h.l1_segment, 1/3);
  const c = c_h.point;
  const c_to_d = c_h.l2_segment;
  //let t = lotpunkt(p1_to_p3, c, 1);
  //let p = add_point(new Point(t.x, t.y));
  remove_point(p5_1);
  remove_line(d_h.l2_segment);
  //let d_vec = p5_1.subtract(p1).normalize().scale(mea.shoulder_length);
  //let d = add_point(d_vec.x, d_vec.y);

  let p5_2 = get_point_on_other_line2(p2, c.subtract(p2), 10, p1_to_p3.get_line_vector().get_orthonormal()).set_color("blue");

  const vec_p6 = p1_to_p2.get_line_vector().get_orthonormal().scale((mea.arm - 20) * (2/5)).add(p5_2).subtract(p2).add(p3);
  const p6 = add_point(new Point(vec_p6.x, vec_p6.y)).set_color("blue");
  const e = add_point(new Point(vec_p6.subtract(p3).add(p4).x, vec_p6.subtract(p3).add(p4).y));
  let e_to_f = line_with_length(e, mea.side_height, 0);
  let f = e_to_f.p2;


  let b_to_g = line_with_length(b, mea.bust_point_width/2, 90);
  const g = b_to_g.p2;
  let vec_p7 = a.subtract(b).normalize().scale(mea.bust_point_height).add(b);
  const p7 = add_point(new Point(vec_p7.x, vec_p7.y));
  p7.set_color("blue");
  let vec_h = p7.subtract(b).add(g);
  let h = add_point(new Point(vec_h.x, vec_h.y));

  let l_help = line_between_points(f,g);
  length_b_g = b_to_g.get_length();
  supposed_length = mea.tai_width_front /2 - length_b_g;
  let p8_help =  point_at(l_help, supposed_length/l_help.get_length());
  remove_line(p8_help.l2_segment);
  const p8 = p8_help.point;
  l_help = line_between_points(h, p8);
  let g_to_h = line_between_points(g, h);
  vec_length = g_to_h.get_length();
  let vec_i = l_help.get_line_vector().normalize().scale(vec_length).add(h);
  const i = add_point(new Point(vec_i.x, vec_i.y));
  let f_to_i = line_between_points(f,i);
  let h_to_i = line_between_points(h,i);

  remove_point(p1);
  remove_point(p2);
  remove_point(p3);
  remove_point(p4);
  remove_point(p7);
  remove_point(p8);

  //front_p5 = p5_2.copy();
  //front_p6 = p6.copy();

  //const armpit = armpit_new(c_to_d, c, p5_2, p6, e, e_to_f);
  //console.log(f_to_i.get_length() + b_to_g.get_length());

  const neck = neckline(c_to_d, a_to_b);

  return {
    shoulder: c_to_d,
    neckline: neck,
    armpit: 0,
    fold: a_to_b,
    dart_inner: g_to_h.swap_orientation(),
    dart_outer: h_to_i,
    side: e_to_f,
    waist_inner: b_to_g,
    waist_outer: f_to_i,
    p1: p5_2,
    p2: p6
  }

};


function back(mea, x, y){
  const p1 = add_point(new Point(x,y));
  const b = add_point(new Point(x, y + mea.shoulder_height_back));
  let a_to_b = line_with_length(b, mea.center_height_back, 180).swap_orientation();
  const a = a_to_b.p1;
  let p1_to_p4 = line_with_length(p1, mea.bust_width_back/2, -90);
  const p4 = p1_to_p4.p2;
  let p1_to_p3 = line_with_length(p1, mea.shoulder_width * (1/2), -90);
  const p3 = p1_to_p3.p2;
  let p1_to_p2 = line_with_length(p1, mea.across_back/2, -90);
  const p2 = p1_to_p2.p2;

  let p5_1 = get_point_on_other_line(p1_to_p3, mea.shoulder_w_point/2, p1_to_p3.get_line_vector().get_orthonormal().scale(-1));
  let l = line_between_points(p5_1, p1);
  let d_h = point_at(l, mea.shoulder_length/l.get_length());
  const d = d_h.point;
  let c_h = point_at(d_h.l1_segment, 1/3);
  const c = c_h.point;
  const c_to_d = c_h.l2_segment;


  remove_point(p5_1);
  remove_line(d_h.l2_segment);

  let p5_2 = get_point_on_other_line2(p2, c.subtract(p2), 10, p1_to_p3.get_line_vector().get_orthonormal().scale(-1)).set_color("blue");

  const vec_p6 = p1_to_p2.get_line_vector().get_orthonormal().scale(-(mea.arm - 20) * (3/5)).add(p5_2).subtract(p2).add(p3);
  const p6 = add_point(new Point(vec_p6.x, vec_p6.y)).set_color("blue");
  const e = add_point(new Point(vec_p6.subtract(p3).add(p4).x, vec_p6.subtract(p3).add(p4).y));
  let e_to_f = line_with_length(e, mea.side_height, 0);
  let f = e_to_f.p2;

  let b_to_g = line_with_length(b, mea.shoulderblade_width/2, -90);
  const g = b_to_g.p2;
  let vec_p7 = a.subtract(b).normalize().scale(mea.shoulderblade_height).add(b);
  const p7 = add_point(new Point(vec_p7.x, vec_p7.y));
  p7.set_color("blue");
  let vec_h = p7.subtract(b).add(g);
  let h = add_point(new Point(vec_h.x, vec_h.y));

  let l_help = line_between_points(f,g);
  length_b_g = b_to_g.get_length();
  supposed_length = mea.tai_width_back /2 - length_b_g;
  let p8_help =  point_at(l_help, supposed_length/l_help.get_length());
  remove_line(p8_help.l2_segment);
  const p8 = p8_help.point;
  l_help = line_between_points(h, p8);
  let g_to_h = line_between_points(g, h);
  vec_length = g_to_h.get_length();
  let vec_i = l_help.get_line_vector().normalize().scale(vec_length).add(h);
  const i = add_point(new Point(vec_i.x, vec_i.y));
  let f_to_i = line_between_points(f,i);
  let h_to_i = line_between_points(h,i);

  remove_point(p1);
  remove_point(p2);
  remove_point(p3);
  remove_point(p4);
  remove_point(p7);
  remove_point(p8);

  //back_p5 = p5_2;
  //back_p6 = p6;

  //const armpit = armpit_new(c_to_d, c, p5_2, p6, e, e_to_f, 1);
  //console.log(f_to_i.get_length() + b_to_g.get_length());

  const neck = back_neckline(c_to_d, a_to_b);

  return {
    shoulder: c_to_d,
    neckline: neck,
    armpit: 0,
    fold: a_to_b,
    dart_inner: g_to_h.swap_orientation(),
    dart_outer: h_to_i,
    side: e_to_f,
    waist_inner: b_to_g,
    waist_outer: f_to_i,
    p1: p5_2,
    p2: p6,
    first: true
  }


}


function get_point_on_other_line(a, len_b, vec){
  len_a = a.get_length();
  len_c = Math.sqrt(Math.abs((len_b * len_b) - (len_a * len_a)));
  //console.log(len_a);
  //console.log(len_c);
  vec_p = vec.scale(len_c).add(a.p2);
  p = add_point(new Point(vec_p.x, vec_p.y));
  return p;
}

function get_point_on_other_line2(a, ve, len_b, vec){

  len_c = Math.sqrt(Math.abs((len_b * len_b) - (ve.x * ve.x)));

  ve.x = 0;
  vec_p = vec.scale(len_c).add(a).add(ve);
  p = add_point(new Point(vec_p.x, vec_p.y));
  return p;
}


function armpit_new(ln1, a, p1, p2, b, ln2, r = -1){
  let len = a.distance(p1);
  let vec = ln1.get_line_vector().get_orthonormal().scale(len * r).add(a);
  let h1 = add_point(new Point(vec.x, vec.y));
  let l1 = line_between_points(a, h1);
  let l2 = line_with_length(p1, len, 180);

  let test1 = interpolate_lines(l1, l2, 2);
  remove_point(h1);
  remove_point(l2.p2);

  len = p1.distance(p2);
  //p2.set_color("green")
  //console.log(len);
  l1 = line_with_length(p1, len, 0);
  l2 = line_with_length(p2, len, 90 *r);

  let test2 = interpolate_lines(l1, l2,2);
  remove_point(l1.p2);
  remove_point(l2.p2);

  let test3 = interpolate_lines(test1, test2, 0, (x) => Math.sqrt(x, 2));
  remove_point(p1);
  l1 = line_between_points(p2, b);
  let test4 = merge_lines(test3, l1);
  remove_point(p2);
  return test4.set_color("black");
}

// ln1 is shoulder
// ln2 is Middleline
function neckline(ln1, ln2){
  let len = ln1.p2.distance(ln2.p1);
  let vec = ln1.get_line_vector().get_orthonormal().scale(-len).add(ln1.p2);
  let p1 = add_point(new Point(vec.x, vec.y));
  let l1 = line_between_points(ln1.p2, p1);
  let l2 = line_with_length(ln2.p1, len, 90);

  let temp1 = interpolate_lines(l1, l2, 2, (x) => Math.pow(x,1), (x) => Math.pow(x, 1), (x) => Math.pow(x,0.7));
  remove_point(p1);
  remove_point(l2.p2);
  return temp1;
}

function back_neckline(ln1, ln2){
  let len = ln1.p2.distance(ln2.p1);
  let vec = ln1.get_line_vector().get_orthonormal().scale(len).add(ln1.p2);
  let p1 = add_point(new Point(vec.x, vec.y));
  let l1 = line_between_points(ln1.p2, p1);
  let l2 = line_with_length(ln2.p1, len, -90);


  let temp = intersect_lines(l1, l2);
  remove_point(temp.l1_segments[1].p2);
  remove_point(temp.l2_segments[1].p2);
  let temp1 = interpolate_lines(temp.l1_segments[0], temp.l2_segments[0], 2, (x) => Math.pow(x, 3));
  remove_point(temp.intersection_points[0]);
  return temp1;
}

function redraw_armpit(pattern, r = -1){
    let p1 = add_point(pattern.p1);
    let p2 = add_point(pattern.p2);

    let a = pattern.shoulder.p1;
    let b = pattern.side.p1;
    let ln1 = pattern.shoulder;
    let ln2 = pattern.side;

    let len = a.distance(p1);
    let vec = ln1.get_line_vector().get_orthonormal().scale(len * r).add(a);
    let h1 = add_point(new Point(vec.x, vec.y));
    let l1 = line_between_points(a, h1);
    let l2 = line_with_length(p1, len, 180);

    let test1 = interpolate_lines(l1, l2, 2);
    remove_point(h1);
    remove_point(l2.p2);

    len = p1.distance(p2);
    l1 = line_with_length(p1, len, 0);
    l2 = line_with_length(p2, len, 90 *r);

    let test2 = interpolate_lines(l1, l2,2);
    remove_point(l1.p2);
    remove_point(l2.p2);

    let test3 = interpolate_lines(test1, test2, 0, (x) => Math.sqrt(x, 2));
    remove_point(p1);
    l1 = line_between_points(p2, b);
    let test4 = merge_lines(test3, l1).set_color("black");
    remove_point(p2);
    //remove_line(pattern.armpit);
    pattern.armpit = test4;


}


//sovoh4raNe!

//save.svg(`out.svg`, 500, 500);
//save.a4();

export default {front, back, redraw_armpit};