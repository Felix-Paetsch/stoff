import { Vector, vec_angle, rotation_fun } from '../../../StoffLib/geometry.js';
import { Sketch } from '../../../StoffLib/sketch.js';
import { Point } from '../../../StoffLib/point.js';
import { ConnectedComponent} from '../../../StoffLib/connected_component.js';

import { line_with_length} from '../funs/basicFun.js';
import { spline } from "../../../StoffLib/curves.js";


import utils from '../funs/utils.js';

function armpit(s){
  let lines_comp = s.lines_by_key("type");
  let shoulder = lines_comp.shoulder[0];
  let side = lines_comp.side[0];
  let c = shoulder.p2;
  let e = side.p1;
  let p5 = s.data.base_p5;
  let p6 = s.data.base_p6;
  p6.move_to(p6.add(new Vector(0, -1)))
  let len = c.distance(p5);
  let vec1 = shoulder.get_line_vector().get_orthonormal().scale(len).add(c).add(shoulder.get_line_vector().scale(0.1));
  let vec2 = side.get_line_vector().get_orthonormal().scale(-len).add(e);

  let temp = s.add_point(p5.add(new Vector(0, 20)));
  let l1 = s.line_between_points(p5, temp);
  let temp2 = s.add_point(p6.add(new Vector(20, 0)));
  let l2 = s.line_between_points(p6, temp2);
  let p = s.intersection_positions(l1, l2)[0];
  let len1 = p.subtract(c).length() / 3;
  let len2 = p.subtract(e).length() /3;

  p5.move_to(p.add(new Vector(0,  -len1)));
  p6.move_to(p.add(new Vector(-len2, 0)));

  let curve = s.line_from_function_graph(c, e, spline.catmull_rom_spline(
    [c, p5, p6, e], vec1, vec2
  )); //.plot_control_points(s));

  s.remove(temp, temp2, p5, p6);
  delete s.data.base_p5;
  delete s.data.base_p6;
  curve.data.type = "armpit";
  return s;
}

/* function armpit_new(s){
  let lines_comp = s.lines_by_key("type");
  let shoulder = lines_comp.shoulder[0];
  let side = lines_comp.side[0];
  let c = shoulder.p2;
  let e = side.p1;
  let p5 = s.data.p5;
  let p6 = s.data.p6;
  let len = c.distance(p5);
  let vec = shoulder.get_line_vector().get_orthonormal().scale(len).add(c);

  let hp1 = s.add_point(new Point(vec.x, vec.y));
  let l1 = s.line_between_points(c, hp1);
  let l2 = line_with_length(s, p5, len, 180);
  s.dev.at_url("/bla")

  let temp1 = s.interpolate_lines(l1, l2, 2);
  s.remove_point(hp1);
  s.remove_point(l2.p2);

  len = p5.distance(p6);

  l1 = line_with_length(s, p5, len, 0);
  l2 = line_with_length(s, p6, len, 90 * s.data.direction);

  let temp2 = s.interpolate_lines(l1, l2,2);
  s.remove_point(l1.p2);
  s.remove_point(l2.p2);

  let temp3 = s.interpolate_lines(temp1, temp2, 0, (x) => 1/(x+0.3));
  s.remove_point(p5);
  temp1.set_color("green")
  temp3.set_color("red")
  //s.at_url("miau");
  l1 = s.line_between_points(p6, e);
  let temp4 = s.merge_lines(temp3, l1);
  s.remove_point(p6);
  s.data.p5 = 0;
  s.data.p6 = 0;
  temp4.data.type = "armpit";
  temp4.data.curve = true;
  temp4.data.direction = s.data.direction * -1;
  temp4.data.direction_split = s.data.direction * -1;
  s.data.length_sleeve = temp4.get_length();

  return s;
}*/

function shorten_length(s, percent){
    let lines_comp = s.data.comp.lines_by_key("type");
    let sides = lines_comp.side;
    if (percent == 0){
      s.line_between_points(sides[0].p1, sides[1].p1);
      s.remove_point(sides[0].p2);
      s.remove_point(sides[1].p2);
      return s;
    }
    if (percent == 1){
      return s;
    }
    let wrist = lines_comp.wrist[0];
    let len = s.data.length * (1- percent);
    let vec_line = wrist.get_line_vector();
    let vec = wrist.p1.add(vec_line.scale(-1)).add(new Vector(0, -len));
    let p1 = s.add_point(new Point(vec));
    vec = wrist.p2.add(vec_line).add(new Vector(0, -len));
    let p2 = s.add_point(new Point(vec));
    let line = s.line_between_points(p1, p2);


    let inter = s.intersection_positions(line, sides[0]);
    sides[0].p2.move_to(inter[0]);
    inter = s.intersection_positions(line, sides[1]);
    sides[1].p2.move_to(inter[0]);

    s.remove_point(p1);
    s.remove_point(p2);

  return s;
};

//function puffy_top(s, )









export default {armpit, shorten_length};
