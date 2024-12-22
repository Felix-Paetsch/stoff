import { Vector, vec_angle_clockwise, rotation_fun , triangle_data} from '../../../StoffLib/geometry.js';
import { Sketch } from '../../../StoffLib/sketch.js';
import { Point } from '../../../StoffLib/point.js';
import { ConnectedComponent} from '../../../StoffLib/connected_component.js';

import { assert } from '../../../Debug/validation_utils.js';

import utils from '../funs/utils.js';

import { line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline} from '../funs/basicFun.js';


import { split, split_tip} from '../funs/simple_split.js';
import eva from '../funs/basicEval.js';
import annotate from '../annotate/annotate.js';


// rückt den punkt nach "unten" mit single dart um anschliessend mit
// dart_trim die Schnittlinien als aussenkanten zu malen
function dart(s, type){

  let lines = s.lines_by_key("type").dart;
  let i = lines.length / 2;
  lines = utils.sort_dart_lines(lines);
  while(lines.length > 0){
    if (!eva.eval_waistline_dart(type)){
      dart_trim(s, [lines[0], lines[1]],single_dart(s, [lines[0], lines[1]]));

    } else {
      s.remove_point(single_dart(s, [lines[0], lines[1]]));
      if (s.data.shortened){
        dart_trim_bottom(s, s.lines_by_key("type").dart_bottom);
      }
    }
    if (!s.data.tuck){
      annotate.annotate_dart(s, [lines[0], lines[1]]);
    }
    lines.splice(0, 2);
  }
};

// bewegt den Punkt nach "unten"
function single_dart(s, [line1, line2]){
    assert(line1.is_adjacent(line2), "Expect dart lines to be adjacent");

    const common = line1.common_endpoint(line2);
    let p1 = line1.other_endpoint(common);
    let p2 = line2.other_endpoint(common);
    
    let vec = p1.subtract(p2).scale(0.5).add(p2);
    vec = vec.subtract(common).normalize().scale(2.5).add(common);
    common.move_to(vec);
};

// nutzt dart() und wandelt danach alle "normalen" Abnäher des sketches in
// Tuck darts um mit simple_tuck
function tuck_dart(s, type){
  s.data.tuck = true;
  dart(s, type);
  let lines = s.lines_by_key("type").dart;
  lines = utils.sort_dart_lines(lines);
  while(lines.length > 0){
    /*
    */
    simple_tuck(s, [lines[0], lines[1]]);
    annotate.annotate_tuck(s, [lines[0], lines[1]]);
    lines.splice(0, 2);
  }

  return s;
}

function simple_tuck(s, [line1, line2]){
  let pt = s.add_point(line1.p1.copy());
  s.line_between_points(line1.p1, pt);
  line1.set_endpoints(pt, line1.p2);

  let vec = line1.get_line_vector().scale(0.5).add(line1.p1);
  line1.p1.move_to(vec);
  vec = line2.get_line_vector().scale(0.5).add(line2.p1);
  line2.p1.move_to(vec);

}


function fill_in_dart(s, inner_line, outer_line){
  /*
      We fill in the dart with the line sgement adjacent to the outer one.
      If that segment is to short we take the next line, we expect the next line then to be well defined.
      #madeByFelix
  */

  // 1, Constructing (half of) the line with which to fill the dart at the correct position
  const center_pt = inner_line.common_endpoint(outer_line);

  const outer_pt = outer_line.other_endpoint(center_pt);
  const original_line_to_mirror = outer_pt.other_adjacent_line(outer_line);
  const copy_line_to_mirror = s.copy_line(
          original_line_to_mirror,
          ...original_line_to_mirror.get_endpoints()
  );

  const outer_outer_pt = copy_line_to_mirror.other_endpoint(outer_pt);
  const original_line_to_mirror_extension = outer_outer_pt.other_adjacent_line(copy_line_to_mirror, original_line_to_mirror);
  const copy_line_to_mirror_extension = s.copy_line(
          original_line_to_mirror_extension,
          ...original_line_to_mirror_extension.get_endpoints()
  );

  const full_line_to_mirror = s.merge_lines(copy_line_to_mirror, copy_line_to_mirror_extension);
  const most_outer_pt = full_line_to_mirror.other_endpoint(outer_pt);

  // Create Half Line
  const dart_full_angle = vec_angle_clockwise(outer_pt, inner_line.other_endpoint(center_pt), center_pt);
  const half_line_at_angle = s.line_at_angle(center_pt, dart_full_angle/2, 100, outer_pt);

  const mirror_center_vec = half_line_at_angle.line.closest_position(most_outer_pt);
  const most_outer_pt_mirrored = s.add(most_outer_pt.mirror_at(mirror_center_vec));
  full_line_to_mirror.set_endpoints(outer_pt, most_outer_pt_mirrored).mirror();

  // Cut the line at the right position
  const intersections = s.intersect_lines(full_line_to_mirror, half_line_at_angle.line);
  const target_line = intersections.l1_segments[0];

  s.remove(
      intersections.l1_segments[1],
      ...intersections.l2_segments,
      most_outer_pt_mirrored,
      half_line_at_angle.other_endpoint
  );

  const fill_in_center_pt = target_line.other_endpoint(outer_pt);

  // Copy the line over
  const target_line_mirror = s.copy_line(
      target_line,
      inner_line.other_endpoint(center_pt),
      fill_in_center_pt,
  ).mirror();

  const merged = s.merge_lines(target_line, target_line_mirror);
  s.remove(fill_in_center_pt);

  // merges has on the side of merge.p1 the "outer" side and on merge.p2 the "inner" site
  return merged;
}



// Warnung: Noch nicht überarbeitet
// bei zu kurzen Linien ein großes Problem, wodurch man erst noch
// eine Fallunterscheidung zu kurven oder so machen muss (fuer kurven dieses hier)
// ansonsten reicht bestimmt die Tangente und macht einiges einfacher
// Bildet die Schneidelinien die ein Abnäher braucht
function dart_trim(s, lines, p_dart){
// bei dart_trim_new abgedeckt

  lines.reverse();
  let adjacent = lines[0].p2.get_adjacent_lines();
  let line = adjacent.filter(elem =>{
    return elem.data.type != "dart";
  })[0];

//  if (line.data.type === "waistline"){
      s.remove_point(p_dart);
      s.line_between_points(lines[0].p2, lines[1].p2).data.type = "trim";
    return;
//  }
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

  fun = rotation_fun(lines[0].p1, angle);



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
    if (s.data.is_front){
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


// Warning: wird vermutlich noch falsch berechnet!
    vec2 = lines[0].p2.subtract(lines[1].p2).scale(0.5).add(lines[1].p1);
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
  // irgendwie ist vec2 falsch berechnet
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

/*function close_styleline_side(s){
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
}*/


export default {dart, tuck_dart, simple_tuck, single_dart, fill_in_dart};
