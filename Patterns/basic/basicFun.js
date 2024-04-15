const { Vector, affine_transform_from_input_output, vec_angle_clockwise, rotation_fun, deg_to_rad } = require("../../Geometry/geometry.js");

const { Point } = require("../../StoffLib/point.js");
const { Sketch } = require("../../StoffLib/sketch.js");

// Gets point, length of the line and the degree of the line,
// returns endpoint of the line
function line_with_length(s, pt, len, degree){
  const vec = new Vector(0,len);
  const newVec = vec.rotate(deg_to_rad(degree));
  const newPt = pt.add(newVec);

  const p = s.add_point(new Point(newPt.x,newPt.y));
  const line = s.line_between_points(pt,p);
  return line;
};

function point_at(s, ln, part){
  const pt1 = ln.get_endpoints()[0];
  const pt2 = ln.get_endpoints()[1];
  //console.log(pt1,pt2);
  const vec = pt2.subtract(pt1);
  const vsc = vec.scale(part);
  const vec2 = vec.get_orthogonal();
  const p1n = vec2.add(pt1).add(vsc);
  const p2n = p1n.add(vec2.scale(-2)); // didn't used substract because the scale of 2
  const p1nn = s.add_point(new Point(p1n.x,p1n.y));
  const p2nn = s.add_point(new Point(p2n.x,p2n.y));

  const line = s.line_between_points(p1nn,p2nn);
  const bla = s.intersect_lines(line, ln);


  s.remove_point(p1nn);
  s.remove_point(p2nn);

  return {
    point: bla.intersection_points[0],
    l1_segment: bla.l2_segments[0],
    l2_segment: bla.l2_segments[1]
  };
};



function dublicate_line(s, ln){
  let p1 = s.add_point(ln.p1.copy());
  let p2 = s.add_point(ln.p2.copy());
  return s.copy_line(ln, p1, p2);
};

// folgende funktionen noch überarbeiten

function get_point_on_other_line(s, a, len_b, vec){
  len_a = a.get_length();
  len_c = Math.sqrt(Math.abs((len_b * len_b) - (len_a * len_a)));
  //console.log(len_a);
  //console.log(len_c);
  vec_p = vec.scale(len_c).add(a.p2);
  p = s. add_point(new Point(vec_p.x, vec_p.y));
  return p;
}

function get_point_on_other_line2(s, a, ve, len_b, vec){

  len_c = Math.sqrt(Math.abs((len_b * len_b) - (ve.x * ve.x)));

  ve.x = 0;
  vec_p = vec.scale(len_c).add(a).add(ve);
  p = s.add_point(new Point(vec_p.x, vec_p.y));
  return p;
}


function neckline(s, ln1, ln2){
  let len = ln1.p2.distance(ln2.p1);
  let vec = ln1.get_line_vector().get_orthonormal().scale(-len).add(ln1.p2);
  let p1 = s.add_point(new Point(vec.x, vec.y));
  let l1 = s.line_between_points(ln1.p2, p1);
  let l2 = line_with_length(s, ln2.p1, len, 90);

  let temp1 = s.interpolate_lines(l1, l2, 2, (x) => Math.pow(x,1), (x) => Math.pow(x, 1), (x) => Math.pow(x,0.7));
  s.remove_point(p1);
  s.remove_point(l2.p2);
  return temp1;
}

function back_neckline(s, ln1, ln2){
  let len = ln1.p2.distance(ln2.p1);
  let vec = ln1.get_line_vector().get_orthonormal().scale(len).add(ln1.p2);
  let p1 = s.add_point(new Point(vec.x, vec.y));
  let l1 = s.line_between_points(ln1.p2, p1);
  let l2 = line_with_length(s, ln2.p1, len, -90);


  let temp = s.intersect_lines(l1, l2);
  s.remove_point(temp.l1_segments[1].p2);
  s.remove_point(temp.l2_segments[1].p2);
  let temp1 = s.interpolate_lines(temp.l1_segments[0], temp.l2_segments[0], 2, (x) => Math.pow(x, 3));
  s.remove_point(temp.intersection_points[0]);
  return temp1;
}



module.exports = {line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline};
