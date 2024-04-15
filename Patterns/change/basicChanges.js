const { Vector } = require("../../Geometry/geometry.js");
const { Sketch } = require("../../StoffLib/sketch.js");
const { Point } = require("../../StoffLib/point.js");

const utils = require("./utils.js");


// Todo: Remodel all below


function armpit_new(s, pattern){
  let shoulder = utils.get_lines(pattern.comp, "shoulder");
  let side = utils.get_lines(pattern.comp, "side");
  let c = shoulder.p2;
  let e = side.p1;
  let p5 = pattern.p5;
  let p6 = pattern.p6;

  let len = c.distance(p5);
  let vec = shoulder.get_line_vector().get_orthonormal().scale(len * pattern.direction).add(c);

  let hp1 = s.add_point(new Point(vec.x, vec.y));
  let l1 = s.line_between_points(c, hp1);
  let l2 = line_with_length(s, p5, len, 180);

  let temp1 = s.interpolate_lines(l1, l2, 2);
  s.remove_point(h1);
  s.remove_point(l2.p2);

  len = p5.distance(p6);

  l1 = line_with_length(s, p5, len, 0);
  l2 = line_with_length(s, p6, len, 90 * pattern.direction);

  let temp2 = s.interpolate_lines(l1, l2,2);
  s.remove_point(l1.p2);
  s.remove_point(l2.p2);

  let temp3 = s.interpolate_lines(temp1, temp2, 0, (x) => Math.sqrt(x, 2));
  s.remove_point(p5);
  l1 = s.line_between_points(p6, e);
  let temp4 = s.merge_lines(temp3, l1);
  s.remove_point(p6);
  pattern.p5 = 0;
  pattern.p6 = 0;
  temp4.data.type = "armpit";
  temp4.data.curve = true;
  temp4.data.direction = pattern.direction * -1;
  return s;
}




// geht davon aus, dass der Abnaeher noch unten ist
function merge_sides(s){
  // zusammenführen der beiden Seiten
  let front_side = utils.get_lines(s.data.front.comp, "side");
  let back_side = utils.get_lines(s.data.back.comp, "side");
  let vec = front_side[0].p1.subtract(back_side[0].p1);

  s.data.back.comp.transform(pt => pt.offset_by(vec));
  s.data.back.p5.offset_by(vec);
  s.data.back.p6.offset_by(vec);

// "kleben" der beiden seiten
  let back_waist = utils.get_lines(s.data.back.comp, "waistline");
  let waist_outer = back_waist.filter(arr_entry => {
    return arr_entry.data.part == back_waist.length() +1;
  });
  waist_outer[0].set_endpoints(front_side.p2, waist_outer[0].p2);
  s.remove_point(back_side.p1);
  s.remove_point(back_side.p2);
  return s;
};


function extend_shoulder(comp, addition){
  const line = utils.get_lines(comp, "shoulder")[0];
  let vec = line.get_line_vector().normalize().scale(addition).add(line.p2);
  line.p2.moveTo(vec.x, vec.y);
}
