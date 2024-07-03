import { Vector, vec_angle_clockwise, rotation_fun } from '../../Geometry/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { spline } from "../../StoffLib/curves.js";
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import { line_with_length } from '../funs/basicFun.js';


import utils from '../funs/utils.js';


function slim_neckline(s, distance){
  let lines = s.data.comp.lines_by_key("type");
  let shoulder = lines.shoulder[0];
  let vec = shoulder.get_line_vector();
  let percent = 1 - distance/shoulder.get_length();

  shoulder.p2.move_to(vec.scale(percent).add(shoulder.p1));

  //s.save_as_png("Debug.png", 500, 500);
};



function new_curve_v_line(s){
  //const pt1 = s.point(0,0);
  //const pt2 = s.point(30, 0);
  let line = s.data.comp.lines_by_key("type").neckline[0];
  const pt1 = line.p1;
  const pt2 = line.p2;

  /*s.line_from_function_graph(pt1, pt2, spline.catmull_rom_spline([
      pt1, new Vector(6,-2),  new Vector(24,-2), pt2
  ]).plot_control_points(s));*/
  let vec = pt2.subtract(pt1).scale(0.5);
  let vec2 = vec.get_orthonormal();
  let vec3;
  //let p = s.point(vec2.add(pt2))
  if (s.data.front){
    vec3 = vec.add(vec2.scale(1));
    vec2 = vec.add(vec2.scale(-1));
  } else {
    vec3 = vec.add(vec2.scale(-1));
    vec2 = vec.add(vec2.scale(1));
  }
  let l = s.line_from_function_graph(pt1, pt2, spline.bezier([
      pt1, vec2.add(pt1), pt2
  ], [
      new Vector(0,vec2.y), vec, new Vector(vec3.x,0)
  ], true)); //.plot_control_points(s));

    l.data.type = "neckline";
    s.remove_line(line);
}


function v_line(s, design){
  let lines = s.data.comp.lines_by_key("type");
  let shoulder = lines.shoulder[0];
  let fold = lines.fold[0];
  let percent_s;
  let percent_f;
  let vec;

  if (design === "deep"){
    if (s.data.front){
      percent_s = 1 - 1/shoulder.get_length();
      percent_f = 1 - 12/fold.get_length();
      vec = fold.get_line_vector();
      fold.p1.move_to(vec.scale(-percent_f).add(fold.p2));
    } else {
      percent_s = 1 - 1/shoulder.get_length();
    }

    vec = shoulder.get_line_vector();
    shoulder.p1.move_to(vec.scale(-percent_s).add(shoulder.p2));
  } else if (design === "wide"){
    if (s.data.front){
      percent_s = 0.6;
      percent_f = 1 - 7/fold.get_length();
    } else {
      percent_s = 0.6;
      percent_f = 1 - 1/fold.get_length();
    }

    let vec = shoulder.get_line_vector();
    shoulder.p1.move_to(vec.scale(-percent_s).add(shoulder.p2));

    vec = fold.get_line_vector();
    fold.p1.move_to(vec.scale(-percent_f).add(fold.p2));
  }

  new_curve_v_line(s);
  return s;
}

function round_wide(s){
  let lines = s.data.comp.lines_by_key("type");
  let shoulder = lines.shoulder[0];
  let fold = lines.fold[0];
  let percent_s;
  let percent_f;
  let vec;
  if (s.data.front){
    percent_s = 0.6;
    percent_f = 1 - 7/fold.get_length();
  } else {
    percent_s = 0.6;
    percent_f = 1 - 1/fold.get_length();
  }

  vec = shoulder.get_line_vector();
  shoulder.p1.move_to(vec.scale(-percent_s).add(shoulder.p2));

  vec = fold.get_line_vector();
  fold.p1.move_to(vec.scale(-percent_f).add(fold.p2));
};


function square(s){
  let lines = s.data.comp.lines_by_key("type");
  let shoulder = lines.shoulder[0];
  let fold = lines.fold[0];
  let neckline = lines.neckline[0];
  let percent_s;
  let percent_f;
  let vec;
  if (s.data.front){
    percent_s = 0.6;
    percent_f = 1 - 4/fold.get_length();
  } else {
    percent_s = 0.6;
    percent_f = 1 - 1.5/fold.get_length();
  }

  vec = shoulder.get_line_vector();
  shoulder.p1.move_to(vec.scale(-percent_s).add(shoulder.p2));

  vec = fold.get_line_vector();
  fold.p1.move_to(vec.scale(-percent_f).add(fold.p2));

  let p = s.point(neckline.p1.x, neckline.p2.y);
  let ln1 = s.line_between_points(neckline.p1, p);
  let ln2 = s.line_between_points(p, neckline.p2);
  let percent;
  if(s.data.front){
    percent = 1 - 1/ln2.get_length();
  } else {
    percent = 1 - 1.5/ln2.get_length();
  }
  vec = ln2.get_line_vector().scale(-percent);
  p.move_to(vec.add(neckline.p2));

  s.remove_line(neckline);
}

function square_shoulder_dart(s){
  let lines = s.data.comp.lines_by_key("type");
  let shoulder = lines.shoulder[0];
  let fold = lines.fold[0];
  let neckline = lines.neckline[0];
  let percent;
  let vec;

  if (s.data.front){
    percent = 1 - 4/fold.get_length();
  } else {
    percent = 1 - 1.5/fold.get_length();
  }
  vec = fold.get_line_vector();
  fold.p1.move_to(vec.scale(-percent).add(fold.p2));

  let len = fold.p1.y - shoulder.p2.y;



  let adjacent = shoulder.p2.get_adjacent_lines();
  let line = adjacent.filter(elem =>{
    return elem.data.type != "shoulder";
  })[0];
  percent = len / line.get_length();
  vec = line.get_line_vector().scale(-percent).add(line.p2);
  line.p2.move_to(vec);

  s.line_between_points(line.p2, neckline.p2);
  s.remove_point(neckline.p1);

  //let p = s.point(neckline.p1.x, neckline.p2.y);



}


function boat(s){
  let lines = s.data.comp.lines_by_key("type");
  let shoulder = lines.shoulder[0];
  let fold = lines.fold[0];
  let neckline = lines.neckline[0];
  let percent_s;
  let percent_f;
  let vec;
  if (s.data.front){
    percent_s = 0.6;
    percent_f = 1 - 0.5/fold.get_length();
  } else {
    percent_s = 0.6;
    percent_f = 1 - 2.5/fold.get_length();
  }

  vec = shoulder.get_line_vector();
  shoulder.p1.move_to(vec.scale(-percent_s).add(shoulder.p2));

  vec = fold.get_line_vector();
  fold.p1.move_to(vec.scale(-percent_f).add(fold.p2));

  let p = s.point(neckline.p1.x, neckline.p2.y);
  let p2 = s.point(neckline.p1.x, neckline.p2.y);
  vec = p.subtract(neckline.p1).scale(0.7);
  p.move_to(vec.add(neckline.p1));
  vec = p2.subtract(neckline.p2).scale(0.5);
  p2.move_to(vec.add(neckline.p2));

  let l = s.line_from_function_graph(neckline.p1, neckline.p2, spline.bezier(
      [neckline.p1, p, p2, neckline.p2]
  )); //.plot_control_points(s));
  s.remove_line(neckline);
  s.remove_point(p);
  s.remove_point(p2);
  return s;
};

export default {slim_neckline, v_line, round_wide, square, boat, square_shoulder_dart};
