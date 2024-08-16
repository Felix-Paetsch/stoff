import { debug, add_point, remove_point, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_line, intersection_points , merge_lines, point_on_line} from '../StoffLib/main.js';
import { Vector , vec_angle_clockwise, rotation_fun} from '../StoffLib/geometry.js';
import { get_orth_line, get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, armpit, round_neckline, smooth_out} from './basicFun_new.js';
import { dart_new, rotate_dart, tai_sho_dart, cut_line, rotate_point, scale_line, rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart} from './darts.js';
import { front, back, redraw_armpit} from './basicPattern2.js';


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
  tai_width_front: 40,// G
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

fr = front(measurements, 0, 0);
//front(measurements, 0, 0)
ba = back(measurements, -measurements.bust_width_front/2 - measurements.bust_width_back/2 -2, 0);

//merge_sides(fr, ba);
//test(fr)
redraw_armpit(fr);
redraw_armpit(ba, 1);
//split_dart_to_side(fr, 0);
//split_dart_to_side(ba, 0);
//merge_sides(fr, ba)

//px = get_point_on_line_percent(fr.neckline, 0.8, true, -1);
px = get_point_on_line_percent(fr.shoulder, 0.5);
//close_first_split(
split_pattern_waist_dart(fr, px, "shoulder");

//remove_line(ba.side);

//py = get_point_on_line_percent(ba.shoulder, 0.2);
//split_pattern_waist_dart(ba, py, "shoulder")



// Ich will weinen -.-
function close_first_split(obj){
  let outer = obj.outer;
  let inner = obj.inner;
  outer.first = false;
  inner.first = false;

  let angle = vec_angle_clockwise(inner.dart_inner.get_line_vector(), outer.dart_outer.get_line_vector());
  let fun = rotation_fun(outer.dart_outer.p1, -angle);
  rotate_zsk(outer.dart_outer, fun);
  remove_point(outer.dart_outer.p2);
  remove_point(inner.dart_inner.p2);
  let line = line_between_points(inner.fold.p2, outer.side.p2);
  return line;

}

function rotate_zsk(ln, fun){
  let list = list_points_zhk(ln);
  let vec;
  list.forEach((elem) => {
    vec = fun(elem);
    elem.moveTo(vec.x, vec.y);
  });
  return ln;
}



function get_point_on_line_percent(ln, percent, kurve =false, r = 1){
  if (percent <= 0.05){
    return ln.p1;
  } else if (percent >= 0.95){
    return ln.p2;
  }
  if (kurve){
    let vec = ln.p2.subtract(ln.p1);
    let len = vec.length();
    let vec2 = vec.get_orthogonal().scale(r);
    vec = vec.normalize().scale(len * percent).add(ln.p1);
    const p1 = add_point(new Point(vec.x, vec.y));
    vec2 = vec2.add(p1);
    const p2 = add_point(new Point(vec2.x, vec2.y));
    let l = line_between_points(p1, p2);
    let points = intersection_points(l, ln);
    remove_point(p1);
    remove_point(p2);
    return add_point(points[0]);
  } else {
    let vec = ln.get_line_vector().normalize().scale(ln.get_length() * percent).add(ln.p1);
    return add_point(new Point(vec.x, vec.y));
  }
};


// Wir nehmen an, dass dies die erste Funktion ist, welche gemacht wird
// Abnäher werden später erst verschoben
// sides sollten exakt gleich lang sein, denn so ist das programmiert ...
// und auch Senkrecht!
function merge_sides(front, back){
  if (front.first && back.first){
    vec = front.side.p1.subtract(back.side.p1);
    reposition_zhk(back.side, vec);

    back.armpit.set_endpoints(back.armpit.p1, front.side.p1);
    back.waist_outer.set_endpoints(back.waist_outer.p2, front.side.p2);
    remove_point(back.side.p1);
    remove_point(back.side.p2);
    //remove_line(front.side);
    back.side = front.side;
  }
  return front, back;
};

function split_dart_to_side(pattern, percent){
  l = line_between_points(pattern.dart_inner.p2, pattern.dart_outer.p2);
  len1 = l.get_length() * percent;
  len2 = l.get_length() - len1;
  len3 = pattern.dart_inner.get_length();
  len4 = pattern.side.get_length();

  vec = l.p1.add(l.get_line_vector().normalize().scale(len1));
  p = add_point(new Point(vec.x, vec.y));

  vec = p.subtract(pattern.dart_inner.p1).normalize().scale(len3).add(pattern.dart_inner.p1);
  p2 = add_point(new Point(vec.x, vec.y));
  remove_point(p);
  remove_line(l);
  pattern.dart_outer.p2.moveTo(p2.x, p2.y);
  vec = pattern.waist_outer.get_line_vector().normalize().scale(len2).add(pattern.side.p2);
  pattern.side.p2.moveTo(vec.x, vec.y);
  vec = pattern.side.get_line_vector().normalize().scale(len4).add(pattern.side.p1);
  pattern.side.p2.moveTo(vec.x, vec.y);
}

function split_pattern_waist_dart(pattern, pt, type = "shoulder"){
  let i_shoulder = 0;
  let o_shoulder = 0;
  let i_side = 0;
  let o_side = 0;
  let i_armpit = 0;
  let o_armpit = 0;
  let i_neckline = 0;
  let o_neckline = 0;
  let i_fold = 0;
  let o_fold = 0;
  let o_p1 = 0;
  let o_p2 = 0;
  let i_p1 = 0;
  let i_p2 = 0;
  let temp;
  let pos_vec = new Vector(5, 0);


  let p = pattern.dart_inner.p1;
  let l = line_between_points(pt, p);
  let l2 = dublicate_line(l);
  pattern.dart_outer.set_endpoints(l2.p2, pattern.dart_outer.p2)


  switch (type) {
    case "shoulder":
      if (pt == pattern.shoulder.p1) {
        pattern.armpit.set_endpoints(l2.p1, pattern.armpit.p2);
        //reposition_zhk(pattern.shoulder, pos_vec);
        i_shoulder = pattern.shoulder;
        o_shoulder = 0;
      } else if (pt == pattern.shoulder.p2){
        pattern.shoulder.set_endpoints(pattern.shoulder.p1, l2.p1);
        //reposition_zhk(pattern.neckline, pos_vec);
        i_shoulder = 0;
        o_shoulder = pattern.shoulder;
      } else {
        temp = point_on_line(pt, pattern.shoulder);
        temp.line_segments[0].set_endpoints(temp.line_segments[0].p1, l2.p1);
        pos_vec.x = 5;
        reposition_zhk(temp.line_segments[1], pos_vec);
        i_shoulder = temp.line_segments[1];
        o_shoulder = temp.line_segments[0];
      }

      i_side = 0;
      o_side = pattern.side;
      i_armpit = 0;
      o_armpit = pattern.armpit;
      i_neckline = pattern.neckline;
      o_neckline = 0;
      i_fold = pattern.fold;
      o_fold = 0;
      o_p1 = pattern.p1;
      o_p2 = pattern.p2;
      i_p1 = 0;
      i_p2 = 0;
      break;
    case "side":
      if (pt == pattern.side.p1) {
        pattern.side.set_endpoints(l2.p1, pattern.side.p2);
        pos_vec.y = -5;
        //reposition_zhk(pattern.dart_inner, pos_vec);
        i_side = pattern.side;
        o_side = 0;
      } else if (pt == pattern.side.p2){
        pattern.waist_outer.set_endpoints(l2.p1, pattern.waist_outer.p2);
        pos_vec.x = -1;
        pos_vec.y = 6;
        //reposition_zhk(pattern.dart_outer, pos_vec);
        i_side = 0;
        o_side = pattern.side;
      } else {
        temp = point_on_line(pt, pattern.side);
        temp.line_segments[1].set_endpoints(l2.p1, temp.line_segments[1].p2);
        pos_vec.y = -5;
        //reposition_zhk(temp.line_segments[0], pos_vec);
        i_side = temp.line_segments[0];
        o_side = temp.line_segments[1];
      }

      i_shoulder = pattern.shoulder;
      o_shoulder = 0;
      i_armpit = pattern.armpit;
      o_armpit = 0;
      i_neckline = pattern.neckline;
      o_neckline = 0;
      i_fold = pattern.fold;
      o_fold = 0;
      o_p1 = pattern.p1;
      o_p2 = pattern.p2;
      i_p1 = 0;
      i_p2 = 0;
      break;
    case "armpit":
      if (pt == pattern.armpit.p1) {
        pattern.armpit.set_endpoints(l2.p1, pattern.armpit.p2);
        pos_vec.y = -5;
        //reposition_zhk(pattern.dart_inner, pos_vec);
        i_armpit = pattern.armpit;
        o_armpit = 0;
      } else if (pt == pattern.armpit.p2){
        pattern.armpit.set_endpoints(pattern.armpit.p1, l2.p1);
        let h = pattern.dart_inner.p1;
        pattern.dart_inner.set_endpoints(l2.p2, pattern.dart_inner.p2);
        l.set_endpoints(l.p1, h);
        pattern.dart_outer.set_endpoints(h, pattern.dart_outer.p2);
        pos_vec.y = -5;
        //reposition_zhk(pattern.dart_inner, pos_vec);
        i_armpit = 0;
        o_armpit = pattern.armpit;
      } else {
        temp = point_on_line(pt, pattern.armpit);
        temp.line_segments[1].set_endpoints(l2.p1, temp.line_segments[1].p2);
        pos_vec.y = -5;
        //reposition_zhk(temp.line_segments[0], pos_vec);
        i_armpit = temp.line_segments[0];
        o_armpit = temp.line_segments[1];
      }

      i_shoulder = pattern.shoulder;
      o_shoulder = 0;
      i_side = 0;
      o_side = pattern.side;
      i_neckline = pattern.neckline;
      o_neckline = 0;
      i_fold = pattern.fold;
      o_fold = 0;
      o_p1 = 0;
      o_p2 = 0;
      i_p1 = 0;
      i_p2 = 0;
      break;
    case "neckline":
      if (pt == pattern.armpit.p1) {
        pattern.armpit.set_endpoints(l2.p1, pattern.armpit.p2);
        pos_vec.y = -5;
        //reposition_zhk(pattern.dart_inner, pos_vec);
        i_armpit = pattern.armpit;
        o_armpit = 0;
      } else if (pt == pattern.armpit.p2){
        pattern.armpit.set_endpoints(pattern.armpit.p1, l2.p1);
        let h = pattern.dart_inner.p1;
        pattern.dart_inner.set_endpoints(l2.p2, pattern.dart_inner.p2);
        l.set_endpoints(l.p1, h);
        pattern.dart_outer.set_endpoints(h, pattern.dart_outer.p2);
        pos_vec.y = -5;
        //reposition_zhk(pattern.dart_inner, pos_vec);
        i_neckline = 0;
        o_neckline = pattern.neckline;
      } else {
        temp = point_on_line(pt, pattern.neckline);
        temp.line_segments[0].set_endpoints(temp.line_segments[0].p1, l2.p1);
        pos_vec.y = 5;
        //reposition_zhk(temp.line_segments[1], pos_vec);
        i_neckline = temp.line_segments[1];
        o_neckline = temp.line_segments[0];
      }


      i_shoulder = 0;
      o_shoulder = pattern.shoulder;
      i_side = 0;
      o_side = pattern.side;
      i_armpit = 0;
      o_armpit = pattern.armpit;
      i_fold = pattern.fold;
      o_fold = 0;
      o_p1 = pattern.p1;
      o_p2 = pattern.p2;
      i_p1 = 0;
      i_p2 = 0;
      break;
    case "fold":
      temp = point_on_line(pt, pattern.fold);
      temp.line_segments[0].set_endpoints(temp.line_segments[0].p1, l2.p1);
      pos_vec.y = 5;
      //reposition_zhk(temp.line_segments[1], pos_vec);

      i_shoulder = 0;
      o_shoulder = pattern.shoulder;
      i_side = 0;
      o_side = pattern.side;
      i_armpit = 0;
      o_armpit = pattern.armpit;
      i_neckline = 0;
      o_neckline = pattern.neckline;
      i_fold = temp.line_segments[1];
      o_fold = temp.line_segments[0];
      o_p1 = pattern.p1;
      o_p2 = pattern.p2;
      i_p1 = 0;
      i_p2 = 0;
      break;
    default:

  }

  return {
    outer: {
      shoulder: o_shoulder,
      neckline: o_neckline,
      armpit: o_armpit,
      fold: o_fold,
      dart_inner: 0,
      dart_outer: pattern.dart_outer,
      side: o_side,
      waist_inner: 0,
      waist_outer: pattern.waist_outer,
      p1: o_p1,
      p2: o_p2
    },
    inner: {
      shoulder: i_shoulder,
      neckline: i_neckline,
      armpit: i_armpit,
      fold: i_fold,
      dart_inner: pattern.dart_inner,
      dart_outer: 0,
      side: i_side,
      waist_inner: pattern.waist_inner,
      waist_outer: 0,
      p1: i_p1,
      p2: i_p2
    }
  }
}

function dublicate_line(ln){
  const p1 = add_point(new Point(ln.p1.x, ln.p1.y));
  const p2 = add_point(new Point(ln.p2.x, ln.p2.y));
  return line_between_points(p1, p2);
}

function test(front){
  const vec = front.shoulder.get_line_vector().normalize().scale(3);
  const p = front.shoulder.p1.subtract(vec);
  front.shoulder.p1.moveTo(p.x, p.y);

}


// repositions a whole line
function reposition_line(ln, vec){
  let temp = ln.p1.add(vec);
  ln.p1.moveTo(temp.x, temp.y);
  temp = ln.p2.add(vec);
  ln.p2.moveTo(temp.x, temp.y);
};

function reposition_zhk(ln, vec){
  let list = list_points_zhk(ln);
  list.forEach((p) => {
    let pos_v = vec.add(p);
    p.moveTo(pos_v.x, pos_v.y)
  });
};


function list_points_zhk(ln){
  let vorhanden = [ln.p1];
  let suchend = [ln.p2];
  let lines;

  while (suchend.length > 0){
    elem = suchend.pop();
    lines = elem.get_adjacent_lines();
    lines.forEach((ln) => {
      if(!vorhanden.includes(ln.p1)){
        vorhanden.push(ln.p1);
        if(!suchend.includes(ln.p1)){
          suchend.push(ln.p1);
        }
      }
      if(!vorhanden.includes(ln.p2)){
        vorhanden.push(ln.p2);
        if(!suchend.includes(ln.p2)){
          suchend.push(ln.p2);
        }
      }
    });
  }
  return vorhanden;
}

save.svg(`out.svg`, 500, 500);
