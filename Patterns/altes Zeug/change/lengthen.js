import { Vector, vec_angle_clockwise, rotation_fun } from '../../StoffLib/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';


import utils from './utils.js';
import evaluate from '../evaluation/basicEval.js';


function length_bottom(s, pattern, design, height, width){

  let parts = utils.get_lines(pattern.comp, "dart");
  if (parts.length > 1){
    //console.log(parts)
    // eine große zsh-komponente
    let waist = utils.get_lines(pattern.comp, "waistline");
    if (waist.length > 1){
      waist = utils.sort_lines(pattern, waist);
      let p_i = s.add_point(new Point(waist[1].p1.add(new Vector(0, height))));
      let p_o = s.add_point(new Point(waist[0].p2.add(new Vector(0, height))));
      let vec = p_o.subtract(p_i).normalize().scale(width/2).add(p_i);
      p_o.move_to(vec);
      let line = s.line_between_points(p_i, p_o);
      line.data.type = "bottom";
      let line1 = s.line_between_points(waist[0].p2, p_o);
      line1.data.type = "side";
      let line2 = s.line_between_points(waist[1].p1, p_i).set_color("green");
      line2.data.type = "fold";
      vec = waist[0].p1.subtract(waist[1].p2).scale(0.5).add(waist[1].p2);
      let vec2 = vec.subtract(parts[0].p1).scale(4).add(parts[0].p1);
      let p = s.add_point(new Point(vec2));
      let ln = s.line_between_points(parts[0].p1, p);
      let points = s.intersection_positions(line, ln);
      p.move_to(points[0]);
      s.remove_line(ln);
      let l_1 = s.line_between_points(waist[0].p1, p);
      l_1.data.type = "dart";
      let l_2 = s.line_between_points(waist[1].p2, p);
      l_2.data.type = "dart";

      vec = line.get_line_vector();

      vec = line.get_line_vector();
      let p_vec = line2.get_line_vector().scale(design["length till bottom"]).add(line2.p1);
      line2.p2.move_to(p_vec);
      let p_h = s.add_point(line2.p2.add(vec.scale(2)));
      let l_h = s.line_between_points(line2.p2, p_h);
      points = s.intersection_positions(line1, l_h);
      line1.p2.move_to(points[0]);
      s.remove_point(p_h);
      let temp1 = s.intersect_lines(line, l_1);
      let temp2 = s.intersect_lines(temp1.l1_segments[0], l_2);
      s.remove_line(temp2.l1_segments[1]);
      s.remove_point(temp2.l2_segments[1].p2);


    } else {
      let fold = utils.get_lines(pattern.comp, "fold");
      fold = utils.sort_lines(pattern, fold);
      if (waist[0].p1 != fold[0].p2){
        waist[0].swap_orientation();
      }
      let p_i = s.add_point(new Point(waist[0].p1.add(new Vector(0, height))));
      let p_o = s.add_point(new Point(waist[0].p2.add(new Vector(0, height))));
      let vec = p_o.subtract(p_i).normalize().scale(width/2).add(p_i);
      p_o.move_to(vec);
      let line = s.line_between_points(p_i, p_o);
      line.data.type = "bottom";
      let line1 = s.line_between_points(waist[0].p2, p_o);
      line1.data.type = "side";
      let line2 = s.line_between_points(waist[0].p1, p_i).set_color("green");
      line2.data.type = "fold";

      vec = line.get_line_vector();
      let p_vec = line2.get_line_vector().scale(design["length till bottom"]).add(line2.p1);
      line2.p2.move_to(p_vec);
      let p_h = s.add_point(line2.p2.add(vec.scale(2)));
      let l_h = s.line_between_points(line2.p2, p_h);
      let points = s.intersection_positions(line1, l_h);
      line1.p2.move_to(points[0]);
      s.remove_point(p_h);

    }
  } else {
    // zwei zsh-k
    let waist1 = utils.get_lines(pattern.comp2, "waistline");
    let waist2 = utils.get_lines(pattern.comp, "waistline");
    let waist = [waist1[0], waist2[0]];

    if (waist.length == 1){
      let p_i = s.add_point(new Point(waist[0].p1.add(new Vector(0, height))));
      let p_o = s.add_point(new Point(waist[0].p2.add(new Vector(0, height))));
      let vec = p_o.subtract(p_i).normalize().scale(width/2).add(p_i);
      p_o.move_to(vec);
      let line = s.line_between_points(p_i, p_o);
      line.data.type = "bottom";
      let line1 = s.line_between_points(waist[0].p2, p_o);
      line1.data.type = "side";
      let line2 = s.line_between_points(waist[0].p1, p_i).set_color("green");
      line2.data.type = "fold";
    } else {

      /// iiiiiiihhhhh .... ich muss sicherstellen,
      // dass die beiden darts wieder von der länge zusammen passen -.-

      /*
      let len1 = waist[0].get_length();
      let len2 = waist[1].get_length();
      let percent1 = len1/(len1 + len2);
      let percent2 = len2/(len1 + len2);
      len1 = (width/2) * percent1;
      len2 = (width/2) * percent1;

      let p_i = s.add_point(new Point(waist[0].p1.add(new Vector(0, height))));
      let p_o = s.add_point(new Point(waist[0].p2.add(new Vector(0, height))));
      let vec = p_o.subtract(p_i).normalize().scale(len1).add(p_i);
      p_o.move_to(vec);
      let line = s.line_between_points(p_i, p_o);
      line.data.type = "bottom";
      let line1 = s.line_between_points(waist[0].p2, p_o);
      line1.data.type = "side";
      let line2 = s.line_between_points(waist[0].p1, p_i).set_color("green");
      line2.data.type = "fold";

      vec = line.get_line_vector();
      let p_vec = line2.get_line_vector().scale(design["length till bottom"]).add(line2.p1);
      line2.p2.move_to(p_vec);
      let p_h = s.add_point(line2.p2.add(vec.scale(2)));
      let l_h = s.line_between_points(line2.p2, p_h);
      let points = s.intersection_positions(line1, l_h);
      line1.p2.move_to(points[0]);
      s.remove_point(p_h);
      */

    }

  }
};


function length_dress(s, pattern, design){

};

export default {length_bottom, length_dress};