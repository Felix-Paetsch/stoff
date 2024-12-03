import { Vector, vec_angle, rotation_fun , triangle_data} from '../../StoffLib/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import utils from '../funs/utils.js';

import { line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline} from '../funs/basicFun.js';


import { split, split_tip} from '../funs/simple_split.js';
import eva from '../funs/basicEval.js';
import annotate from '../annotate/annotate.js';



function dart(s, type){
  s.data.dart = type;
  let lines = s.data.comp.lines_by_key("type").dart;
  let i = lines.length / 2;
  if (i === 1){
    //s.remove_point(single_dart(s, lines));
    if (!eva.eval_waistline_dart(type)){
    /*
    */
      dart_trim(s, lines, single_dart(s, lines));

    } else {
      s.remove_point(single_dart(s, lines));
      if (s.data.shortened){
        dart_trim_bottom(s, s.lines_by_key("type").dart_bottom);
      }
    }
    annotate.annotate_dart(s, lines);
  } else if (i === 2){
    let [pair1, pair2] = split_dart(lines);
    dart_trim(s, pair1, single_dart(s, pair1));
    dart_trim(s, pair2, single_dart(s, pair2));

    if(eva.eval_waistline_dart(type) && s.data.shortened){
      dart_trim_bottom(s, s.lines_by_key("type").dart_bottom);
    }

    annotate.annotate_dart(s, pair2);
    annotate.annotate_dart(s, pair1);
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
    /*
    */
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
  s.data.dart = type;

  s.data.tuck = true;
  let lines = s.data.comp.lines_by_key("type").dart;
  let i = lines.length / 2;
  if (i === 1){
    let p = single_dart(s, lines);

    if (!eva.eval_waistline_dart(type)){
      dart_trim(s, lines, p);
    } else {
      s.remove_point(p);
      if (s.data.shortened){
        dart_trim_bottom(s, s.lines_by_key("type").dart_bottom);
      }
    }
    simple_tuck(s, lines);

    annotate.annotate_tuck(s, lines);

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
    annotate.annotate_tuck(s, pair1);
    annotate.annotate_tuck(s, pair2);
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
// bei dart_trim_new abgedeckt
  lines.reverse();
  let adjacent = lines[0].p2.get_adjacent_lines();
  let line = adjacent.filter(elem =>{
  return elem.data.type != "dart";
})[0];

  if (line.data.type === "waistline"){
      s.remove_point(p_dart);
    return;
  }
  /*
*/

  let pts = line.get_endpoints();
//  let pt1; // adjacent
//  let pt2;

  let p1 = lines[0].p1;
  let p2 = lines[0].p2;


  let angle = vec_angle(lines[0].get_line_vector(), lines[1].get_line_vector());
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
  //s.dev.at_url("/wha")
  s.copy_line(segment, lines[1].p2, p2_new).data.type = "trim";
  line = s.copy_line(segment, lines[0].p2, p2_new);
  line.mirror();
  line.data.type = "trim";


  s.remove_point(p_dart);
  s.remove_point(p_new);
  s.remove_line(temp.l2_segments[0]);
  s.merge_lines(temp.l1_segments[0], temp.l1_segments[1]);

  s.remove_point(temp.intersection_points[0]);
  /*
*/


};

function dart_trim_new(s, lines, p_dart){

//    lines.reverse();
    let adjacent = lines[1].p2.get_adjacent_lines();
    let line = adjacent.filter(elem =>{
      return elem.data.type != "dart";
    })[0];

    if (line.data.type === "waistline"){
        s.remove_point(p_dart);
      return;
    }

// Ich gehe davon aus, dass wenn es eine Kurve ist, die Linie rechts und Links
// von dem Abnäher noch lang genug ist, die Kurve zu kopieren
// (halbe Abnäherbreite muss auf der entsprechend verwendeten Seite noch vorhanden sein)
    if (line.data.curve){
      return dart_trim;
    }

let vec;
    if (s.data.front){
      vec = line.get_tangent_vector(lines[0].p2);
    } else {
      vec = line.get_tangent_vector(lines[1].p2);
    }

    vec = vec.scale(-2);


    let pt = s.add_point(lines[0].p2.add(vec));
    //TODO!!!!


}

function dart_trim_bottom(s, lines){
  let lines_all = s.lines_by_key("type");
  let vec;
  let vec2;
  let adj;
  let bool;
  if (!lines){
    bool = true;
    let temp = lines_all.bottom;
    let temp2 = [];
    temp.forEach((elem) => {
      temp2 = temp2.concat(elem.p2.get_adjacent_lines());
      temp2 = temp2.concat(elem.p1.get_adjacent_lines());
    });
    lines = temp2.filter(elem => {
      return elem.data.type === "dart";
    });

    vec2 = lines[0].p1;
    lines[0].swap_orientation();
    lines[1].swap_orientation();
    lines.reverse();
  } else {
    if(lines[0].p1 === lines[1].p1){
      return;
    }
  //  console.log(lines[0].common_endpoint(lines.bottom_side[0]))
  //  if (!(lines[0].common_endpoint(lines.bottom_side[0]) || lines[0].common_endpoint(lines.bottom_side[1]))){
    //  return;
  //  }


    vec2 = lines[0].p2.subtract(lines[1].p2).scale(0.5).add(lines[1].p2);
  }

  vec = lines[0].p1.subtract(lines[1].p1).scale(0.5).add(lines[1].p1);
  adj = lines[0].p1.get_adjacent_lines();

  let bottom = adj.filter(elem =>{
    return elem.data.type === "bottom";
  })[0];

  let angle = vec_angle(lines[0].p1.subtract(vec2), lines[1].p1.subtract(vec2)) / 2;
  let angle2 = vec_angle(lines[0].p2.subtract(lines[0].p1), bottom.p2.subtract(lines[0].p1));
  let len = lines[0].p1.subtract(vec2).length();
  let vec_haupt = vec.subtract(vec2);

  let tri = {
    a: len,
    beta: angle,
    gamma: angle2
  };
  let new_tri = triangle_data(tri);
  vec_haupt = vec_haupt.to_len(new_tri.c);
  let p_main = s.add_point(vec_haupt.add(vec2));


    s.line_between_points(p_main, lines[1].p1).data.type = "trim";
    s.line_between_points(p_main, lines[0].p1).data.type = "trim";



    if (bool){
      lines.forEach((elem) => {
        elem.reverse();
      });

    }

return s;
  /*
  */
}

function close_styleline_side(s){
  let lines = s.lines_by_key("type");
  let darts = lines.dart;

  let vec = darts[0].p2.subtract(darts[1].p2);
  let len = vec.length();
  //console.log(lines.waistline[0])

  let p = utils.lotpunkt(s, darts[0].p1, lines.waistline[0]);
  let p_waist = lines.waistline[0].p2;
  s.point_on_line(p, lines.waistline[0]);

  darts[1].p2.move_to(darts[0].p2);
  vec = darts[0].p2.subtract(p_waist).normalize().scale(len*0.7);
  p_waist.move_to(p_waist.add(vec));
  lines = s.lines_by_key("type");
  s.merge_lines(lines.waistline[0], lines.waistline[1], true);
  s.merge_points(darts[0].p2, darts[1].p2);
  s.data.comp = new ConnectedComponent(lines.armpit[0].p1);
  delete s.data.comp2;
  s.remove_point(darts[0].p1);

  s.merge_lines(lines.side[0], lines.side[1], true);
  return s;
}


export default {dart, tuck_dart, simple_tuck, split_dart, single_dart, close_styleline_side};
