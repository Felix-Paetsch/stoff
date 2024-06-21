import { Vector, vec_angle_clockwise, rotation_fun } from '../../Geometry/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import utils from '../funs/utils.js';
import {line_with_length} from '../funs/basicFun.js';


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



export default {lengthen_top_without_dart};
