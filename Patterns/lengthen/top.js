import { Vector, vec_angle_clockwise, rotation_fun , rad_to_deg} from '../../Geometry/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import utils from '../funs/utils.js';
import {line_with_length} from '../funs/basicFun.js';
import { spline } from "../../StoffLib/curves.js";


function lengthen_top_without_dart(s, mea, shorten){
  const lines = s.data.comp.lines_by_key("type");
  let fold = lines.fold[0];
  let waist = lines.waistline[0];
  let p = fold.p2;
  let vec = fold.get_line_vector().normalize().scale(mea.waist_height).add(p);

  let p2 = s.add_point(new Point(vec));
  if (s.data.front){
    vec = waist.get_line_vector().normalize().scale(mea.bottom_width_front/2).add(p2);
  } else {
    vec = waist.get_line_vector().normalize().scale(mea.bottom_width_back/2).add(p2);
  }
  let p3 = s.add_point(new Point(vec));

  let fold2 = s.line_between_points(p, p2).set_color("green");
  let bottom = s.line_between_points(p2, p3);
  let side2 = s.line_between_points(waist.p2, p3);

  vec = fold2.get_line_vector().scale(shorten).add(fold2.p1);
  let vec2 = bottom.get_line_vector().scale(2);
//console.log(vec)
  fold2.p2.move_to(new Vector(vec));

  let p_help = s.add_point(new Point(vec2.add(fold2.p2)));
  let l_help = s.line_between_points(fold2.p2, p_help);
  let inter = s.intersection_positions(side2, l_help);

  side2.p2.move_to(inter[0]);

  s.remove_point(p_help);
  /*
*/

};

function lengthen_top_without_dart_new(s, mea, shorten){
  const lines = s.data.comp.lines_by_key("type");
  let fold = lines.fold[0];
  let waist = lines.waistline[0];
  lengthen_top(s, mea, shorten, waist, fold)
  correct_belly(s, mea);
  return s;
};

function lengthen_top_with_dart(s, mea, shorten, dart = s.data.comp.lines_by_key("type").dart){
  const lines = s.data.comp.lines_by_key("type");
  let fold = lines.fold[0];
  let waistlines = lines.waistline;
  waistlines = utils.sort_lines(s, waistlines);

  lengthen_top(s, mea, shorten, waistlines[0], fold)
  opposite_dart2(s, dart);
  correct_belly_waistline_dart(s, mea);
  //curve_line(s);
  return s;
};


function curve_line(s){
  const lines = s.data.comp.lines_by_key("type");
  let side = utils.sort_lines(s, lines.side)[0];
  let side_bottom = utils.sort_lines(s, lines.side_bottom).reverse();

  let l = s.line_from_function_graph(side.p1, side_bottom[1].p2, spline.catmull_rom_spline(
    [side.p1, side_bottom[0].p1, side_bottom[0].p2, side_bottom[1].p2]));

  s.remove_point(side_bottom[0].p2)
}

function correct_belly(s, mea){
  const lines = s.data.comp.lines_by_key("type");

  const p_upper = lines.side_bottom[0].p1;
  const p_lower = lines.side_bottom[0].p2;


  if (s.data.front){
    mea.ratio = mea.waist_width_front/mea.waist_width_back;
  } else {
    mea.ratio = mea.waist_width_back/mea.waist_width_front;
  }

  const width = mea.belly*mea.ratio/4;

  let side_bottom = lines.side_bottom[0];
  let fold_bottom = lines.fold_bottom[0];

  let p1 = s.add_point(side_bottom.get_line_vector().scale(0.5).add(side_bottom.p1));
  let p2 = s.add_point(fold_bottom.get_line_vector().scale(0.5).add(fold_bottom.p1));

  let ln_h = s.line_between_points(p1, p2);

  if (s.data.front){
    console.log("front");
  } else {
    console.log("back");
  }
  console.log(ln_h.get_length() - width)

  let width_diff = ln_h.get_length() - width;
  // wenn zu wenig, dann negative zahl. Wenn zu viel
  // aktuell vorhanden, dann positive Zahl.

  let vec;

  if (width_diff > 1.5 && width_diff < 3){
    vec = ln_h.get_line_vector().normalize().scale(width_diff * 0.7);
    s.point_on_line(p1, side_bottom);
    p1.move_to(p1.add(vec));

//    s.remove_point(p2);

} else if (width_diff < -1.5 && width_diff > -4){
    vec = ln_h.get_line_vector().normalize().scale(width_diff);
    s.point_on_line(p1, side_bottom);
    p1.move_to(p1.add(vec));

    let side = utils.sort_lines(s, lines.side);
    vec = get_vec(fold_bottom.p1, side[0].p1, lines.waistline[0].get_length()+(Math.abs(width_diff)*0.4), side[0].get_length());
    side[0].p2.move_to(vec);

  //  s.remove_point(p2);

  } else if (width_diff <= 1.5 && width_diff >= -1.5){
    vec = ln_h.get_line_vector().normalize().scale(width_diff);
    s.point_on_line(p1, side_bottom);
    p1.move_to(p1.add(vec));

    //s.remove_point(p2);
  } else {
    console.log("Das ist noch nicht implementiert, das braucht eine deutlichere Veränderung im Schnittmuster!");
  }

  p1.data.type = "middle_bottom_side";
  let len = ln_h.get_length();

  let vec_h
  if (s.data.front){
    vec_h = get_vec(p2, p_upper, len, mea.waist_height/2);
    p1.move_to(vec_h);

    len = lines.bottom[0].get_length();
    vec_h = get_vec(fold_bottom.p2, p1, len, mea.waist_height/2);
    p_lower.move_to(vec_h);
  } else {

    vec_h = get_vec(p_upper, p2, mea.waist_height/2, len);
    p1.move_to(vec_h);

    len = lines.bottom[0].get_length();
    vec_h = get_vec(p1, fold_bottom.p2, mea.waist_height/2, len);
    p_lower.move_to(vec_h);

  }
  s.remove_point(p2);
  /*
  */

};


function correct_belly_waistline_dart(s, mea){
  const lines = s.data.comp.lines_by_key("type");

  const p_upper = lines.side_bottom[0].p1;
  const p_lower = lines.side_bottom[0].p2;

  if (s.data.front){
    mea.ratio = mea.waist_width_front/mea.waist_width_back;
  } else {
    mea.ratio = mea.waist_width_back/mea.waist_width_front;
  }

  const width = mea.belly*mea.ratio/4;

  let side_bottom = lines.side_bottom[0];
  let fold_bottom = lines.fold_bottom[0];

  let p1 = s.add_point(side_bottom.get_line_vector().scale(0.5).add(side_bottom.p1));
  let p2 = s.add_point(fold_bottom.get_line_vector().scale(0.5).add(fold_bottom.p1));

  let ln_h = s.line_between_points(p1, p2);

  let temp = s.intersection_positions(ln_h, lines.dart1[0]);
  let p3 = s.add_point(temp[0]);
  temp = s.intersection_positions(ln_h, lines.dart2[0]);
  let p4 = s.add_point(temp[0]);
  let ln_h2 = s.line_between_points(p3, p4);

if (s.data.front){
  console.log("front");
} else {
  console.log("back");
}
console.log(ln_h.get_length() - width)
console.log(ln_h2.get_length());

let width_diff = ln_h.get_length() - width;
// wenn zu wenig, dann negative zahl. Wenn zu viel
// aktuell vorhanden, dann positive Zahl.
let diff = width_diff + ln_h2.get_length();
console.log(diff)
let len;
if (width_diff <= 0.2 && width_diff >= -0.2){
  opposite_dart(s, mea);
  //s.remove_point(p1);
  //s.remove_point(p2);
  s.point_on_line(p1, lines.side_bottom[0]);

  s.remove_point(p3);
  s.remove_point(p4);
  s.remove_point(lines.dart1[0].p1);
} else if (diff <= 0.2 && diff >= -0.2){
  len = Math.min(Math.abs(width_diff), Math.abs(ln_h2.get_length()));
  let vec = ln_h.get_line_vector().normalize().scale(len*0.7);
  //s.remove_point(p2);
  s.point_on_line(p1, lines.side_bottom[0]);
  p1.move_to(p1.add(vec));

  s.remove_point(p3);
  s.remove_point(p4);
  s.remove_point(lines.dart1[0].p1);
  opposite_dart(s, mea);
} else if (diff > 0.2 && diff < 7){
  opposite_dart(s, mea, 0.65);
  let vec = ln_h.get_line_vector().normalize().scale(Math.abs(width_diff)*0.4);
  //s.remove_point(p2);
  s.point_on_line(p1, lines.side_bottom[0]);
  p1.move_to(p1.add(vec));

  s.remove_point(p3);
  s.remove_point(p4);
  s.remove_point(lines.dart1[0].p1);

} else if (diff < -0.2 && diff > -6){
  opposite_dart(s, mea, 0.35);
  let vec = ln_h.get_line_vector().normalize().scale(Math.abs(diff)*-0.55);
  //s.remove_point(p2);
  s.point_on_line(p1, lines.side_bottom[0]);
  p1.move_to(p1.add(vec));

  s.remove_point(p3);
  s.remove_point(p4);
  s.remove_point(lines.dart1[0].p1);
}
p1.data.type = "middle_bottom_side";

len = ln_h.get_length();

let vec_h

if (s.data.front){
  vec_h = get_vec(p2, p_upper, len, mea.waist_height/2);
  p1.move_to(vec_h);

  len = lines.bottom[0].get_length();
  vec_h = get_vec(fold_bottom.p2, p1, len, mea.waist_height/2);
  p_lower.move_to(vec_h);
} else {

  vec_h = get_vec(p_upper, p2, mea.waist_height/2, len);
  p1.move_to(vec_h);

  len = lines.bottom[0].get_length();
  vec_h = get_vec(p1, fold_bottom.p2, mea.waist_height/2, len);
  p_lower.move_to(vec_h);

}

s.remove_point(p2);

};


function opposite_dart(s, mea, scale = 0.45){
  const lines = s.data.comp.lines_by_key("type");
  let darts = utils.get_waistline_dart(s);
  darts[0].set_color("green")

  let vec = darts[0].p2.add(darts[1].p2).scale(0.5);
  //s.add_point(vec);
  let len = mea.waist_height * (scale);
  //console.log(len)
  let vec2 = vec.subtract(darts[0].p1).normalize().scale(len);
  vec2 = vec2.add(vec);
  const p = s.add_point(vec2);
//  s.remove_point()
s.line_between_points(p, darts[0].p2).data.type = "dart_bottom";
s.line_between_points(p, darts[1].p2).data.type = "dart_bottom";

};

function opposite_dart2(s, darts){
  const lines = s.data.comp.lines_by_key("type");
//  let darts = lines.dart;
  darts[0].set_color("green")
  let vec = darts[0].p2.add(darts[1].p2).scale(0.5);
  let p1 = s.add_point(vec);
  let vec2 = vec.subtract(darts[0].p1).scale(4);
  vec2 = vec2.add(vec);
  let p2 = s.add_point(vec2);
  let ln = s.line_between_points(p1, p2);
  let bottom = lines.bottom[0];


  let temp = s.intersection_positions(ln, bottom);
  let p3 = s.add_point(temp[0]);

  s.remove_point(p1);
  s.remove_point(p2);

  s.line_between_points(p3, darts[1].p2).data.type = "dart1";
  s.line_between_points(p3, darts[0].p2).data.type = "dart2";

  /*
*/

}

function lengthen_top(s, mea, shorten, waist, fold){
//  const lines = s.data.comp.lines_by_key("type");
//  let fold = lines.fold[0];
  //let waist = lines.waistline[0];
  let p = fold.p2;
  let vec = fold.get_line_vector().normalize().scale(mea.waist_height + 2).add(p);

  let p2 = s.add_point(new Point(vec));
  let fold2 = s.line_between_points(p, p2).set_color("green");
  fold2.data.type = "fold_bottom";


  let a = p2.subtract(waist.p2).length();
  let c = mea.waist_height;

  if (s.data.front){

    let b = mea.bottom_width_front / 2;
    let angle = get_angle_cos(a, b, c);

    let fun = rotation_fun(waist.p2, angle);
    let p3 = s.add_point(p2.copy());
    p3.move_to(fun(p3));

    p3.move_to(waist.p2.subtract(p3).normalize().scale(-mea.waist_height).add(waist.p2));
    let side_bottom = s.line_between_points(waist.p2, p3);
    side_bottom.data.type = "side_bottom";
    s.line_between_points(p2, p3).data.type = "bottom";
  } else {
    let b = mea.bottom_width_back / 2;
    let angle = get_angle_cos(a, b, c);
    let fun = rotation_fun(waist.p2, -angle);

    let p3 = s.add_point(p2.copy());
    p3.move_to(fun(p3));

    p3.move_to(waist.p2.subtract(p3).normalize().scale(-mea.waist_height).add(waist.p2));
    let side_bottom = s.line_between_points(waist.p2, p3);
    side_bottom.data.type = "side_bottom";
    s.line_between_points(p2, p3).data.type = "bottom";
  }

};

// a ist differenz zwischen Punkten
function get_angle_cos(a, b, c){
  let sum = Math.pow(a, 2) + Math.pow(c, 2) - Math.pow(b, 2);
  let mult = 2 * a * c;
  let div = sum / mult;
  let cos = Math.acos(div);
  return cos;
}

function get_vec(p1, p2, len1, len2){
  let diff = p1.subtract(p2).length();

  let angle = get_angle_cos(diff, len2, len1);
  let fun = rotation_fun(p1, -angle);

  return fun(p2).subtract(p1).normalize().scale(len1).add(p1);

}

// Funktion wird erst aufgerufen, nachdem bereits gemerged wurde
// (main_merge bereits aufgerufen)
// entweder [back inner, middle, front inner]
// oder [back inner, back outer, front outer, front inner]
function lengthen_styleline(arr, closed = false){
  
}

export default {lengthen_styleline, lengthen_top_with_dart, lengthen_top_without_dart_new};
