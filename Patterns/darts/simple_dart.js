import { Vector, vec_angle_clockwise, rotation_fun } from '../../StoffLib/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import utils from '../funs/utils.js';

import { line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline} from '../funs/basicFun.js';


import { split, split_tip} from '../funs/simple_split.js';
import eva from '../funs/basicEval.js';




function dart(s, type){
  let lines = s.data.comp.lines_by_key("type").dart;
  let i = lines.length / 2;
  if (i === 1){
    //s.remove_point(single_dart(s, lines));
    if (!eva.eval_waistline_dart(type)){
      dart_trim(s, lines, single_dart(s, lines));
    } else {
      s.remove_point(single_dart(s, lines));
    }

  } else if (i === 2){
    let [pair1, pair2] = split_dart(lines);
    dart_trim(s, pair1, single_dart(s, pair1));
    dart_trim(s, pair2, single_dart(s, pair2));
  //  s.remove_point(single_dart(s, pair1));
  //  s.remove_point(single_dart(s, pair2));
  }
};

function single_dart(s, [line1, line2]){
  let p_ret = s.add_point(line1.p1.copy());
  if (line1.is_adjacent(line2)){
    let p1 = line1.p2;
    let p2 = line2.p2;
    let p3 = line1.p1;

    let vec = p1.subtract(p2).scale(0.5).add(p2);
    let pt = s.add_point(new Point(vec));

    vec = pt.subtract(p3).normalize().scale(2.5).add(p3);
    p3.move_to(vec);
    s.remove_point(pt);
  }
  return p_ret;
};


function split_dart(lines){
  let pair1_1 = lines.splice(0,1)[0];
  let pair1_2 = lines.filter(elem => {
    return pair1_1.is_adjacent(elem);
  })[0];
  let pair2 = lines.filter(elem => {
    return !(pair1_1.is_adjacent(elem));
  });

  return [[pair1_1, pair1_2], pair2];
};

function tuck_dart(s, type){
  s.data.tuck = true;
  let lines = s.data.comp.lines_by_key("type").dart;
  let i = lines.length / 2;
  if (i === 1){
    let p = single_dart(s, lines);

    if (!eva.eval_waistline_dart(type)){
      dart_trim(s, lines, p);
    } else {
      s.remove_point(p);
    }
    simple_tuck(s, lines);

    //dart_trim(s, lines, single_dart(s, lines));


  } else if (i === 2){
    let [pair1, pair2] = split_dart(lines);
    let p1 = single_dart(s, pair1);
    let p2 = single_dart(s, pair2);
    dart_trim(s, pair1, p1);
    dart_trim(s, pair2, p2);

    simple_tuck(s, pair1);
    simple_tuck(s, pair2);
    //s.remove_point(p1);
    //s.remove_point(p2);
    //dart_trim(s, pair1, p1);
    //dart_trim(s, pair2, p2);
  }
}

function simple_tuck(s, [line1, line2]){
  let pt = s.add_point(line1.p1.copy());
  s.line_between_points(line1.p1, pt).set_color("red");
  line1.set_endpoints(pt, line1.p2);

  let vec = line1.get_line_vector().scale(0.5).add(line1.p1);
  line1.p1.move_to(vec);
  vec = line2.get_line_vector().scale(0.5).add(line2.p1);
  line2.p1.move_to(vec);

}


function dart_trim(s, lines, p_dart){

  lines.reverse();
  let adjacent = lines[0].p2.get_adjacent_lines();
  let line = adjacent.filter(elem =>{
    return elem.data.type != "dart";
  })[0];

  if (line.data.type === "waistline"){
      s.remove_point(p_dart);
    return;
  }

  let pts = line.get_endpoints();
  let pt1; // adjacent
  let pt2;

let p1 = lines[0].p1;
let p2 = lines[0].p2;


let angle = vec_angle_clockwise(lines[0].get_line_vector(), lines[1].get_line_vector());
angle = angle/2;
let fun;
/*
if (line.data.type === "waistline"){
  angle = angle * -1;
}
*/
if (s.data.front){
  fun = rotation_fun(lines[0].p1, angle);
} else {
  fun = rotation_fun(lines[0].p1, -angle);
}


let p_new = s.add_point(lines[0].p2.copy());
p_new.move_to(fun(p_new))

let vec_new = p_new.subtract(lines[0].p1);
p_new.move_to(p_new.add(vec_new));

let l_new = s.line_between_points(lines[0].p1, p_new);


let vec = lines[1].p2.subtract(lines[0].p2).scale(0.5).add(lines[0].p2);
vec = vec.subtract(lines[1].p1);

let temp = s.intersect_lines(line, l_new);

let vec2_new = vec.normalize().scale(temp.l2_segments[0].get_length()).add(lines[0].p1);
let p2_new = s.add_point(new Point(vec2_new));

let segment;
if (temp.l1_segments[0].is_adjacent(lines[0].p2)){
  segment = temp.l1_segments[0];
} else {
  segment = temp.l1_segments[1];
}

  s.copy_line(segment, lines[1].p2, p2_new);
  line = s.copy_line(segment, lines[0].p2, p2_new);
  line.mirror();

  s.remove_point(p_dart);
  s.remove_point(p_new);
  s.remove_line(temp.l2_segments[0]);

  s.merge_lines(temp.l1_segments[0], temp.l1_segments[1]);

  s.remove_point(temp.intersection_points[0]);
  /*
*/


};





export default {dart, tuck_dart, simple_tuck, split_dart};
