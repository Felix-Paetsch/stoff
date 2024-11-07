import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector } from '../../StoffLib/geometry.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import { line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline} from '../funs/basicFun.js';
import evaluate from '../funs/basicEval.js';

import utils from '../funs/utils.js';



function seam_allowance(s){
  let lines = s.data.comp.lines_by_key("type");
  let p = s.data.comp.points_by_key("type").middle_bottom_side[0];

  let bottom = lines.bottom[0];
  let bottom_sides = lines.side_bottom;
  let side = lines.side[0];


  if (bottom_sides.length > 1){ // ist dann automatisch 2
    bottom_sides = s.merge_lines(bottom_sides[0], bottom_sides[1]);
    s.remove(p);
  } else {
    bottom_sides = bottom_sides[0];
  }

//  side = s.merge_lines(bottom_sides, side);

  let ln1 = s.line_with_offset(bottom_sides, 2, s.data.front);
  let ln2 = s.line_with_offset(bottom, 2, !s.data.front);
  let ln3 = s.line_with_offset(side, 2, s.data.front);

//  [ln1, ln2] = close_lines(s, ln1.p2, ln2.p2, 2);

  close_lines(s, ln1.p1, ln3.p2, 2);


};

function close_lines(s, ln1_p, ln2_p, distance){

  ln1_p = lengthen_line(s, ln1_p, distance);
  ln2_p = lengthen_line(s, ln2_p, distance);
  let ln1 = ln1_p.get_adjacent_lines()[0];
  let ln2 = ln2_p.get_adjacent_lines()[0];

  let temp = s.intersection_positions(ln1, ln2)[0];

  /*
  ln1_p.move_to(temp);
  ln2_p.move_to(temp);

  s.merge_points(ln1_p, ln2_p);

  return [ln1, ln2];*/
};

function lengthen_line(s, p, distance){
  let ln = p.get_adjacent_lines()[0];
  let p2_bool = ln.p2 === p;
  let temp;
  temp = s.position_at_length(ln, 0.5, p2_bool);
  temp = temp.subtract(p).scale(-4 * distance).add(p);
  let p2 = s.add_point(temp);

  const ln2 = s.line_between_points(p, p2);
  let line = s.merge_lines(ln, ln2, true);

  return p2;
};


export default {seam_allowance};
