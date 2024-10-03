import { Vector, affine_transform_from_input_output, vec_angle, rotation_fun } from '../StoffLib/geometry.js';
//import { debug, add_point, line_between_points, Point, intersection_points, intersect_lines, remove_point, remove_line, interpolate_lines, _get_sketch } from '../StoffLib/main.js';
import { Point } from '../StoffLib/point.js';
import { Sketch } from '../StoffLib/sketch.js';

//const s = _get_sketch();
// s._has_lines(...lines)
function deg(degree){
  // Degree to rad
  return ((degree*Math.PI)/ 180);
}

function rad_to_deg(r){
  return r*180/Math.PI
}

    //Ich "brauche" eine Funktion, welcher ich einen Punkt, eine Länge und
    // eine Richtung gebe, die mir diese Linie malt und dort einen Punkt setzt

    // Ich brauche eine Funktion für Ausschnitte -> Welche Art von Parametern
    // muss ich dieser Übergeben?

    // Funktion bauen, welche an einer Stelle (z.B. x %) einer Linie einen
    // neuen Punkt setzt. -> Hilfsgerade + intersect_lines

// Gets point, length of the line and the degree of the line,
// returns endpoint of the line
function line_with_length(s, pt, len, degree){
  const vec = new Vector(0,len);
  const newVec = vec.rotate(deg(degree));
  const newPt = pt.add(newVec);

  const p = s.add_point(new Point(newPt.x,newPt.y));
  const line = s.line_between_points(pt,p);
  return line;
}


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
}

function lotpunkt(ln, pt, s){
  const ln_p = ln.get_endpoints();

  const a = pt.subtract(ln_p[0]);
  const c = ln.get_line_vector();

  const alpha = vec_angle(a, c);

  const b_scalar = Math.sin(alpha)*a.length();
  const norm = c.get_orthonormal().mult(b_scalar).scale(s);

  return pt.subtract(norm);
}

function lotpunkt2(pt, ln_orth_to, ln_on, s){

  const vec1_h1 = pt.subtract(ln_on.p1);
  const vec1_h2 = pt.subtract(ln_on.p2);
  const vec_max = Math.max(vec1_h1.length(), vec1_h2.length());

  const help_line = get_orth_line_length(ln_orth_to, pt, s, vec_max);
  const inter = intersection_points(help_line, ln_on);
  //console.log(debug.sketch_has_line(ln_on));
//  const p = add_point(new Point(inter[0].x, inter[0].y));

  remove_point(help_line.p2);
  return inter[0];
}



function smooth_out(l1, l2, r, b, n = 2){
  l_int = interpolate_lines(l1, l2, r);

  for (let i = 0; i < n; i++){
      l_int_old = l_int;
      l_int = interpolate_lines(l1, l_int_old, b);
      remove_line(l_int_old);
  }
//  console.log(debug.sketch_has_line(l_int));

  return l_int;
}





function get_orth_line_length(line, pt, n, len){
  const p = line.get_endpoints();
  const vec = p[1].subtract(p[0]).get_orthonormal().scale(len);
  const p_vec = pt.add(vec.scale(n));
  const np = add_point(new Point(p_vec.x, p_vec.y));
  const ln = line_between_points(pt, np);
  return ln;
}

function get_orth_line(line, pt, n){
  const p = line.get_endpoints();
  const vec = p[1].subtract(p[0]).get_orthogonal();
  const p_vec = pt.add(vec.scale(n));
  const np = add_point(new Point(p_vec.x, p_vec.y));
  const ln = line_between_points(pt, np);
  return ln;
}







export default { smooth_out, get_orth_line, get_orth_line_length, line_with_length, point_at, lotpunkt, lotpunkt2};