const { Vector, vec_angle_clockwise, rotation_fun } = require("../../Geometry/geometry.js");
const { Sketch } = require("../../StoffLib/sketch.js");
const { Point } = require("../../StoffLib/point.js");
const {ConnectedComponent} = require("../../StoffLib/connected_component.js");

const {line_with_length} = require("../basic/basicFun.js");


const utils = require("../change/utils.js");


function armpit_new(s){
  let lines_comp = s.data.comp.lines_by_key("type");

  let shoulder = lines_comp.shoulder[0];
  let side = lines_comp.side[0];
  let c = shoulder.p2;
  let e = side.p1;
  let p5 = s.data.p5;
  let p6 = s.data.p6;

  let len = c.distance(p5);
  let vec = shoulder.get_line_vector().get_orthonormal().scale(len * s.data.direction).add(c);

  let hp1 = s.add_point(new Point(vec.x, vec.y));
  let l1 = s.line_between_points(c, hp1);
  let l2 = line_with_length(s, p5, len, 180);

  let temp1 = s.interpolate_lines(l1, l2, 2);
  s.remove_point(hp1);
  s.remove_point(l2.p2);

  len = p5.distance(p6);

  l1 = line_with_length(s, p5, len, 0);
  l2 = line_with_length(s, p6, len, 90 * s.data.direction);

  let temp2 = s.interpolate_lines(l1, l2,2);
  s.remove_point(l1.p2);
  s.remove_point(l2.p2);

  let temp3 = s.interpolate_lines(temp1, temp2, 0, (x) => Math.sqrt(x, 2));
  s.remove_point(p5);
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
}

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









module.exports = {armpit_new, shorten_length};
