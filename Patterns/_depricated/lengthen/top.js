import { Vector, vec_angle, rotation_fun , rad_to_deg} from '../../../Core/StoffLib/geometry.js';
import Sketch from '../../../Core/StoffLib/sketch.js';
import Point from '../../../Core/StoffLib/point.js';
import ConnectedComponent from '../../../Core/StoffLib/connected_component.js';
import { Ray, DOWN } from '../../../Core/StoffLib/geometry.js';

import utils from '../funs/utils.js';
import {line_with_length} from '../funs/basicFun.js';
import { spline } from "../../../Core/StoffLib/curves.js";


function lengthen_top_without_dart(s, mea, shorten){
  const lines = s.lines_by_key("type");
  let fold = lines.fold[0];
  let waist = lines.waistline[0];
  let p = fold.p2;
  let vec = fold.get_line_vector().normalize().scale(mea.waist_height).add(p);

  let p2 = s.add_point(new Point(vec));
//  if (s.data.is_front){
    vec = waist.get_line_vector().normalize().scale(mea.bottom_width_front/2).add(p2);
  /*} else {
    vec = waist.get_line_vector().normalize().scale(mea.bottom_width_back/2).add(p2);
  }*/
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
  const lines = s.lines_by_key("type");
  let fold = lines.fold[0];
  let waist = lines.waistline[0];
  lengthen_top(s, mea, shorten, waist, fold)

  correct_belly(s, mea);
  shorten_length_new(s, shorten);
  return s;
};

function lengthen_top_with_dart(s, mea, shorten, dart = null){
    let lines = s.lines_by_key("type");
    lengthen_top(s, mea, shorten, lines.waistline[1], lines.fold[0]);
    lines = s.lines_by_key("type");

    const bottom = lines["bottom"][0];
    dart = dart || lines.dart;
    const common_pt = dart[0].common_endpoint(dart[1]);
    const down_ray = new Ray(common_pt, DOWN);

    const intersection = s.add(down_ray.intersect(bottom.get_endpoints()));
    const bottom_pt = s.point_on_line(intersection, lines["bottom"][0]).point;
    const dart_endpoints = dart.map(l => l.other_endpoint(common_pt));

    s.line_between_points(dart_endpoints[0], bottom_pt);
    s.line_between_points(dart_endpoints[1], bottom_pt);

    
    correct_belly_waistline_dart(s, mea);
    shorten_with_dart(s, shorten);
    return s;
};


function curve_line(s){
  const lines = s.lines_by_key("type");
  let side = utils.sort_lines(s, lines.side)[0];
  let side_bottom = utils.sort_lines(s, lines.side_bottom).reverse();

  let l = s.line_from_function_graph(side.p1, side_bottom[1].p2, spline.catmull_rom_spline(
    [side.p1, side_bottom[0].p1, side_bottom[0].p2, side_bottom[1].p2]));

  s.remove_point(side_bottom[0].p2)
}

function correct_belly(s, mea, percent = 1){
  const lines = s.lines_by_key("type");

  const p_upper = lines.side_bottom[0].p1;
  const p_lower = lines.side_bottom[0].p2;

  const len_side = lines.side_bottom[0].get_length();


    mea.ratio = percent * mea.waist;

  const width = mea.belly*mea.ratio/4;

  let side_bottom = lines.side_bottom[0];
  let fold_bottom = lines.fold_bottom[0];

  let p1 = s.add_point(side_bottom.get_line_vector().scale(0.5).add(side_bottom.p1));
  let p2 = s.add_point(fold_bottom.get_line_vector().scale(0.5).add(fold_bottom.p1));

  let ln_h = s.line_between_points(p1, p2);
  if (s.data.is_front){
    console.log("front");
  } else {
    console.log("back");
  }
//  console.log(ln_h.get_length() - width)

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

//    vec = get_vec(fold_bottom.p1, side[0].p1, lines.waistline[0].get_length()+(Math.abs(width_diff)*0.4), side[0].get_length());
//    side[0].p2.move_to(vec);

  //  s.remove_point(p2);

  } else if (width_diff <= 1.5 && width_diff >= -1.5){
    vec = ln_h.get_line_vector().normalize().scale(width_diff);
    s.point_on_line(p1, side_bottom);
    p1.move_to(p1.add(vec));

    //s.remove_point(p2);
  } else {
    s.point_on_line(p1, side_bottom);

    console.log("Das ist noch nicht implementiert, das braucht eine deutlichere Veränderung im Schnittmuster!");
  }

  p1.data.type = "middle_bottom_side";
  let len = ln_h.get_length();

  let vec_h
//  if (s.data.is_front){
    vec_h = get_vec(p2, p_upper, len, len_side/2);
    p1.move_to(vec_h);

    len = lines.bottom[0].get_length();
    vec_h = get_vec(fold_bottom.p2, p1, len, len_side/2);
    p_lower.move_to(vec_h);
/*  } else {

    vec_h = get_vec(p_upper, p2, len_side/2, len);
    p1.move_to(vec_h);

    len = lines.bottom[0].get_length();
    vec_h = get_vec(p1, fold_bottom.p2, len_side/2, len);
    p_lower.move_to(vec_h);

  } */
  s.remove_point(p2);
  /*
  */

};


function correct_belly_waistline_dart(s, mea){
  const lines = s.lines_by_key("type");

  const p_upper = lines.side_bottom[0].p1;
  const p_lower = lines.side_bottom[0].p2;

  if (s.data.is_front){
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

  if (s.data.is_front){
    console.log("front");
  } else {
    console.log("back");
  }
  //console.log(ln_h.get_length() - width)
  //console.log(ln_h2.get_length());

  let width_diff = ln_h.get_length() - width;
  // wenn zu wenig, dann negative zahl. Wenn zu viel
  // aktuell vorhanden, dann positive Zahl.
  let diff = width_diff + ln_h2.get_length();
  //console.log(diff)
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
  } else {
    opposite_dart(s, mea, 0.55);
    s.point_on_line(p1, lines.side_bottom[0]);
    s.remove_points(p3, p4);
    s.remove_point(lines.dart1[0].p1);
    console.log("Das ist noch nicht implementiert, das braucht eine deutlichere Veränderung im Schnittmuster!");

  }
  p1.data.type = "middle_bottom_side";

  len = ln_h.get_length();

  let vec_h

//  if (s.data.is_front){
    vec_h = get_vec(p2, p_upper, len, mea.waist_height/2);
    p1.move_to(vec_h);

    len = lines.bottom[0].get_length();
    vec_h = get_vec(fold_bottom.p2, p1, len, mea.waist_height/2);
    p_lower.move_to(vec_h);
/*  } else {

    vec_h = get_vec(p_upper, p2, mea.waist_height/2, len);
    p1.move_to(vec_h);

    len = lines.bottom[0].get_length();
    vec_h = get_vec(p1, fold_bottom.p2, mea.waist_height/2, len);
    p_lower.move_to(vec_h);

  } */
  s.remove_point(p2);
};


function set_ratio(s, mea, ratio_f = 1, ratio_b = 1, both = false){
  if(both){
    mea.ratio = ratio_f * mea.waist_width_front/mea.waist_width_back;
    mea.ratio = mea.ratio + ratio_b * mea.waist_width_back/mea.waist_width_front;

  } else {
    if(s.data.is_front){
      mea.ratio = ratio_f * mea.waist_width_front/mea.waist_width_back;
    } else {
      mea.ratio = ratio_b * mea.waist_width_back/mea.waist_width_front;
    }
  }
};


function correct_belly_middle(s, mea, percent = 0.35){
    const lines = s.lines_by_key("type");
    const width = mea.belly*mea.ratio/4;


    let side_bottom = lines.side_bottom[0];
    let fold_bottom = lines.fold_bottom[0];
    let fold_len = fold_bottom.get_length();
    let side_len = side_bottom.get_length();
    let p1 = s.add_point(side_bottom.get_line_vector().scale(0.5).add(side_bottom.p1));
    let p2 = s.add_point(fold_bottom.get_line_vector().scale(0.5).add(fold_bottom.p1));

    let ln_h = s.line_between_points(p1, p2);

    let width_diff = ln_h.get_length() - width;
      // wenn zu wenig, dann negative zahl. Wenn zu viel
      // aktuell vorhanden, dann positive Zahl.

    let vec;

  if (width_diff > 2 && width_diff < 5){
        vec = ln_h.get_line_vector().normalize().scale(width_diff * 0.7* (1- percent));
        s.point_on_line(p1, side_bottom);
        p1.move_to(p1.add(vec));

        vec = ln_h.get_line_vector().normalize().scale(width_diff * 0.7* -percent);
        s.point_on_line(p2, fold_bottom);
        p2.move_to(p2.add(vec));

  //      s.remove_line(ln_h);

  } else if (width_diff < -2 && width_diff > -6){
        vec = ln_h.get_line_vector().normalize().scale(width_diff * (1-percent));
        s.point_on_line(p1, side_bottom);
        p1.move_to(p1.add(vec));

        vec = ln_h.get_line_vector().normalize().scale(width_diff * -percent);
        s.point_on_line(p2, fold_bottom);
        p2.move_to(p2.add(vec));

        let side = utils.sort_lines(s, lines.side);

        vec = get_vec(lines.waistline[0].p1, side[0].p1, lines.waistline[0].get_length()+(Math.abs(width_diff)*0.4), side[0].get_length());
        side[0].p2.move_to(vec);

    //    s.remove_point(p2);

    } else if (width_diff <= 2 && width_diff >= -2){
        vec = ln_h.get_line_vector().normalize().scale(width_diff * (1-percent));
        s.point_on_line(p1, side_bottom);
        p1.move_to(p1.add(vec));

        vec = ln_h.get_line_vector().normalize().scale(width_diff * -percent);
        s.point_on_line(p2, fold_bottom);
        p2.move_to(p2.add(vec));
        //s.remove_point(p2);
      } else {
        s.point_on_line(p1, side_bottom);
        s.point_on_line(p2, fold_bottom);
        console.log("Das ist noch nicht implementiert, das braucht eine deutlichere Veränderung im Schnittmuster!");
      }



    p1.data.type = "middle_bottom_side";
    p2.data.type = "middle_bottom_fold";

    let len = ln_h.get_length();

    let waistline = lines.waistline[0];
    let vec_h;
    if(!s.data.closed){
      vec_h = get_vec(p2, waistline.p2, len, side_len/2);
      p1.move_to(vec_h);

      vec_h = get_vec(waistline.p1, p1, fold_len/2, len);
      p2.move_to(vec_h);


      len = lines.bottom[0].get_length();
      vec_h = get_vec(lines.bottom[0].p1, p1, len, side_len/2);
      lines.bottom[0].p2.move_to(vec_h);

      len = lines.bottom[0].get_length();
      vec_h = get_vec(p2, lines.bottom[0].p2,fold_len/2, len);
      lines.bottom[0].p1.move_to(vec_h);
    } else {
      vec_h = get_vec(waistline.p2, p2, side_len/2, len);
      p1.move_to(vec_h);

      vec_h = get_vec(p1, waistline.p1, len, fold_len/2);
      p2.move_to(vec_h);


      len = lines.bottom[0].get_length();
      vec_h = get_vec(p1, lines.bottom[0].p1, side_len/2, len);
      lines.bottom[0].p2.move_to(vec_h);

      len = lines.bottom[0].get_length();
      vec_h = get_vec(lines.bottom[0].p2, p2, len, fold_len/2);
      lines.bottom[0].p1.move_to(vec_h);
    }


 s.remove_line(ln_h);
 /*
 console.log(width)
*/


};

function opposite_dart(s, mea, scale = 0.45){
  const lines = s.lines_by_key("type");
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
  let ln = s.line_between_points(p, darts[0].p2)
  ln.data.type = "dart_bottom";
  ln.data.dartside = darts[0].data.dartside;
  ln = s.line_between_points(p, darts[1].p2);
  ln.data.type = "dart_bottom";
  ln.data.dartside = darts[1].data.dartside;
};

function opposite_dart2(s, darts){
  const lines = s.lines_by_key("type");
//  let darts = lines.dart;
  darts[0].set_color("green")
  const center = darts[0].other_endpoint(darts[1]).add(darts[1].other_endpoint(darts[0])).scale(0.5);
  let p1 = s.add_point(center);
  let vec2 = center.subtract(darts[0].p1).scale(-4);
  s.add(center);
  vec2 = vec2.add(center);
  let p2 = s.add_point(vec2);
  p2.data.pt2 = "pt2"
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
//  const lines = s.lines_by_key("type");
//  let fold = lines.fold[0];
  //let waist = lines.waistline[0];
  let p = fold.p2;
  let vec = fold.get_line_vector().normalize().scale(mea.waist_height + 2).add(p);

  let p2 = s.add_point(new Point(vec));
  let fold2 = s.line_between_points(p, p2).set_color("green");
  fold2.data.type = "fold_bottom";


  let a = p2.subtract(waist.p2).length();
  let c = mea.waist_height;
  let b;
  if (s.data.is_front){
    b = mea.bottom_width_front / 2;
  } else {
    b = mea.bottom_width_back / 2;
  }
    let angle = get_angle_cos(a, b, c);

    let fun = rotation_fun(waist.p2, angle);
    let p3 = s.add_point(p2.copy());
    p3.move_to(fun(p3));

    p3.move_to(waist.p2.subtract(p3).normalize().scale(-mea.waist_height).add(waist.p2));
    let side_bottom = s.line_between_points(waist.p2, p3);
    side_bottom.data.type = "side_bottom";
    s.line_between_points(p2, p3).data.type = "bottom";
    /*
    let angle = get_angle_cos(a, b, c);
    let fun = rotation_fun(waist.p2, -angle);

    let p3 = s.add_point(p2.copy());
    p3.move_to(fun(p3));

    p3.move_to(waist.p2.subtract(p3).normalize().scale(-mea.waist_height).add(waist.p2));
    let side_bottom = s.line_between_points(waist.p2, p3);
    side_bottom.data.type = "side_bottom";
    s.line_between_points(p2, p3).data.type = "bottom";*/
};

// a ist differenz zwischen Punkten
function get_angle_cos(a, b, c){
  let sum = Math.pow(a, 2) + Math.pow(c, 2) - Math.pow(b, 2);
  let mult = 2 * a * c;
  let div = sum / mult;
  let cos = Math.acos(div);
  return cos;
};

function get_vec(p1, p2, len1, len2){
  let diff = p1.subtract(p2).length();

  let angle = get_angle_cos(diff, len2, len1);
  let fun = rotation_fun(p1, -angle);

  return fun(p2).subtract(p1).normalize().scale(len1).add(p1);

};

// Funktion wird erst aufgerufen, nachdem bereits gemerged wurde
// (main_merge bereits aufgerufen)
// entweder [back inner, middle, front inner]
// oder [back inner, back outer, front outer, front inner]
function lengthen_styleline(arr, mea, percent, closed = false){
  const len_side_bottom = mea.waist_height;
  let len_front = mea.bottom_width_front/2;
  let len_back = mea.bottom_width_back/2;

  let ratio_front;
  let ratio_back;
  let vec;
  let back_i, back_o, front_o, front_i, middle;

  if (!closed){
    [back_i, back_o, front_o, front_i] = arr;
  } else {
    [back_i, middle, front_i] = arr;
  }

// Hier ist das für front
  let lines = front_i.lines_by_key("type");
  let darts = lines.dart;
  if(darts){
    darts.forEach(elem =>{
      elem.data.type = "side";
    });
  }
  let waistline = lines.waistline[0];
  ratio_front = waistline.get_length()/(mea.waist_width_front/2);
  let add_len_f = 2 * (1- ratio_front);

  let ln1_len_f = len_front * ratio_front;
  let ln2_len_f = len_front - ln1_len_f;
  let fold_bottom = line_with_length(front_i, waistline.p1, len_side_bottom + 2, 0).set_color("green");
  fold_bottom.data.type = "fold_bottom";
  vec = get_vec(fold_bottom.p2, waistline.p2, ln1_len_f, len_side_bottom + add_len_f);
  let p1 = front_i.add_point(vec);
  let bottom = front_i.line_between_points(fold_bottom.p2, p1);
  let side_bottom = front_i.line_between_points(waistline.p2, p1);
  bottom.data.type = "bottom";
  side_bottom.data.type = "side_bottom";
  correct_belly(front_i, mea, ratio_front);

  // ab hier für back

  lines = back_i.lines_by_key("type");

  if(darts){
    darts.forEach(elem =>{
      elem.data.type = "side";
    });
  }

  waistline = lines.waistline[0];
  ratio_back = waistline.get_length()/(mea.waist_width_back/2);
  let add_len_b = 2 * (1-ratio_back);

  let ln1_len_b = len_back * ratio_back;
  let ln2_len_b = len_back - ln1_len_b;
  fold_bottom = line_with_length(back_i, waistline.p1, len_side_bottom + 2, 0).set_color("green");
  fold_bottom.data.type = "fold_bottom";
  vec = get_vec( fold_bottom.p2, waistline.p2,  ln1_len_b, len_side_bottom + add_len_b);
  p1 = back_i.add_point(vec);
  bottom = back_i.line_between_points(fold_bottom.p2, p1);
  side_bottom = back_i.line_between_points(waistline.p2, p1);
  bottom.data.type = "bottom";
  side_bottom.data.type = "side_bottom";

correct_belly(back_i, mea, ratio_back);

// rest
let p2;

if (!closed){
  // front
  lengthen_middle(front_o, ln2_len_f, len_side_bottom + add_len_f, len_side_bottom);
  correct_belly_middle(front_o, mea);
    // back

  lengthen_middle(back_o, ln2_len_b, len_side_bottom + add_len_b, len_side_bottom);
  set_ratio(back_o, mea, 1 - ratio_front, 1 - ratio_back);
  correct_belly_middle(back_o, mea);


  front_o.data.type = "middle";
  back_o.data.type = "middle";


} else {
  middle.data.is_front = false;
  lengthen_middle(middle, ln2_len_b + ln2_len_f, len_side_bottom + add_len_b, len_side_bottom + add_len_f, 0.5);

  middle.data.type = "middle";
  set_ratio(middle, mea, 1 - ratio_front, 1 - ratio_back, true);
  correct_belly_middle(middle, mea, 0.5);

  //console.


  }

  let ln;
  arr.forEach((s) => {
    if (s.data.type === "middle"){
      ln = s.lines_by_key("type").fold_bottom;
      s.merge_lines(ln[0], ln[1], true);
    }
    shorten_length_new(s, percent);
  });



}


function lengthen_middle(s, len_bottom, len_height_i, len_height_o, percent = 0.35){
  const lines = s.lines_by_key("type");
  let waistline = lines.waistline[0];
  let diff = len_bottom - waistline.get_length();
  let diff_i = diff * percent;
  let ln_h = line_with_length(s, waistline.p1, len_height_i, 0);
  let vec;
  if (s.data.closed){
    vec = get_vec( waistline.p2, ln_h.p2, len_height_o, len_bottom - diff_i);
  } else {
    vec = get_vec(ln_h.p2, waistline.p2, len_bottom - diff_i, len_height_o);
  }
  let p1 = s.add_point(vec);
  let side_bottom = s.line_between_points(waistline.p2, p1);
  side_bottom.data.type = "side_bottom";


  s.remove_point(ln_h.p2);
  if (s.data.closed){
    vec = get_vec(p1, waistline.p1, len_bottom, len_height_i);
  } else {
    vec = get_vec(waistline.p1, p1, len_height_i, len_bottom);
  }
  let p2 = s.add_point(vec);
  let bottom = s.line_between_points(p2, p1);
  bottom.data.type = "bottom";
  let fold_bottom = s.line_between_points(waistline.p1, p2);
  fold_bottom.data.type = "fold_bottom";


}


function shorten_length(s, percent){
  let lines = s.lines_by_key("type");
  let side = s.merge_lines(lines.side_bottom[0], lines.side_bottom[1], true);

  if (percent === 1){

    return;
  }
  let fold = lines.fold_bottom[0];
  let len = fold.get_length();
  len = len * (1- percent);

  let bottom = lines.bottom[0];
  let new_bottom = s.line_with_offset(bottom, len, s.data.is_front);

  let vec = new_bottom.line.get_line_vector();
  new_bottom.line.p1.move_to(new_bottom.line.p1.add(vec.scale(-0.5)));
  new_bottom.line.p2.move_to(new_bottom.line.p2.add(vec.scale(0.5)));

  let temp;
  let temp2;
  if (percent > 0){
    temp = s.intersect_lines(fold, new_bottom.line);


    s.remove(temp.l1_segments[1].p2, temp.l2_segments[0].p1);
    temp.intersection_points[0].set_color("black")

    temp2 = s.intersect_lines(side, temp.l2_segments[1]);
  } else {
    new_bottom.line.p1.move_to(lines.fold[0].p2);
    s.merge_points(lines.fold[0].p2, new_bottom.line.p1);
    s.remove(fold.p2);
    temp2 = s.intersect_lines(side, new_bottom.line);
  }
    if (temp2.intersection_points.length === 0){
      //console.log(temp2.intersection_points)
      let points = s.points_by_key("type");

      let lns = points.f[0].get_adjacent_lines();
      let side = lns.filter(elem =>{
        return elem.data.type === "side";
      })[0];

      s.remove(temp2.l1_segments[0].p2);
      temp2 = s.intersect_lines(side, temp2.l2_segments[0]);
      //console.log(temp2.l1_segments[1].set_color("red"))
      s.remove(temp2.l1_segments[1].p2, temp2.l2_segments[1].p2);


    } else {
      s.remove(temp2.l1_segments[1].p2, temp2.l2_segments[1].p2);
    }

    return s;

}


function shorten_length_new(s, percent){

  let lines = s.lines_by_key("type");
  //let side = s.merge_lines(lines.side_bottom[0], lines.side_bottom[1], true);
  let side = lines.side;
  let waistline_dart = lines.waistline.length > 1;
  let side_len = lines.bottom[0].p2.other_adjacent_line(lines.bottom[0]).get_length() *2;
  if(side.length > 1){
    side = [side[1]];
  }

  side = utils.merge_to_curve(s, side.concat(lines.side_bottom));


  let fold = lines.fold_bottom[0];
  let darts = lines.dart_bottom;

  if (percent === 1){
    return;
  }
  percent = 1 - percent;
  let temp = side.position_at_length(percent * side_len, true);
  let pt = s.add_point(temp);
  let p = side.p2;
  s.point_on_line(pt, side);
  s.remove(p)

  if (percent === 0){
    lines.waistline.forEach((elem) => {
      elem.data.type = "bottom";
    });
    if(waistline_dart){
      let dart = lines.dart.filter(elem => elem.data.dartposition === "waistline").filter(elem => elem.data.dartside === "outer")[0];
      s.line_between_points(dart.p2, pt).data.type = "bottom";
  //    s.remove(lines.dart_bottom[0].p1);
    } else {
      s.line_between_points(fold.p1, pt).data.type = "bottom";
    }
    s.remove(fold.p2);
    return;
  }

  let ln = s.line_between_points(fold.p2, pt);
  ln.data.type = "bottom";
  temp = fold.position_at_length(percent * fold.get_length(), true);
  fold.p2.move_to(temp);


  {
      let lines = s.lines_by_key("type");
      let fold = lines.fold[0];
      let fold_bottom = lines.fold_bottom;

      if (fold_bottom){
          s.merge_lines(fold_bottom[0], fold, true);
      }
  }

  return s;
}


function shorten_with_dart(s, percent){
  shorten_length_new(s, percent);
  s.data.shortened = true;
  let lines = s.lines_by_key("type");
  let darts = lines.dart_bottom;
  darts = utils.sort_dart_lines(darts).reverse();
  if (percent === 0){
    s.remove_point(darts[0].p1);
    return;
  }
  let bottom = lines.bottom[0];

  darts = s.lines_by_key("type").dart;
  let vec1 = s.intersection_positions(darts[0], bottom);

  if (vec1.length === 0){
    return;
  }

    let pt1 = darts[0].p1;
//    let vec1 = s.intersection_positions(darts[0], bottom);
    let vec2 = s.intersection_positions(darts[1], bottom);

    let p1 = s.add_point(vec1[0]);
    let p2 = s.add_point(vec2[0]);

    s.point_on_line(p1, darts[0]);
    s.point_on_line(p2, darts[1]);



    let ln = s.line_between_points(bottom.p1, p1);
    ln.data.type = "bottom";
    ln = s.line_between_points(p2, bottom.p2);
    ln.data.type = "bottom";

    s.remove(pt1);

    lines = s.lines_by_key("type");
    darts = lines.dart_bottom;
    let vec;
    //if (s.data.is_front){
      vec = get_vec(darts[1].p2, bottom.p2, darts[0].get_length(), ln.get_length());
  /*  } else {
      vec = get_vec( bottom.p2, darts[0].p2, ln.get_length(), darts[1].get_length());
    }*/
    p2.move_to(vec)

    s.remove_line(bottom);
    return s;
    /*
*/
}

export default {lengthen_styleline, lengthen_top_with_dart, lengthen_top_without_dart_new,
   correct_belly, lengthen_middle, correct_belly_middle, shorten_length_new, shorten_with_dart};
