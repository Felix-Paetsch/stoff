import { Vector, affine_transform_from_input_output, vec_angle, rotation_fun } from '../StoffLib/geometry.js';
import { debug, add_point, line_between_points, Point, intersection_points, intersect_lines, remove_point, remove_line, interpolate_lines, _get_sketch } from '../StoffLib/main.js';

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
function line_with_length(pt, len, degree){
  const vec = new Vector(0,len);
  const newVec = vec.rotate(deg(degree));
  const newPt = pt.add(newVec);

  const p = add_point(new Point(newPt.x,newPt.y));
  const line = line_between_points(pt,p);
  return line;
}


function point_at(ln, part){
  const pt1 = ln.get_endpoints()[0];
  const pt2 = ln.get_endpoints()[1];
  //console.log(pt1,pt2);
  const vec = pt2.subtract(pt1);
  const vsc = vec.scale(part);
  const vec2 = vec.get_orthogonal();
  const p1n = vec2.add(pt1).add(vsc);
  const p2n = p1n.add(vec2.scale(-2)); // didn't used substract because the scale of 2
  const p1nn = add_point(new Point(p1n.x,p1n.y));
  const p2nn = add_point(new Point(p2n.x,p2n.y));

  const line = line_between_points(p1nn,p2nn);
  const bla = intersect_lines(line, ln);


  remove_point(p1nn);
  remove_point(p2nn);

  return {
    point: bla.intersection_points[0],
    l1_segment: bla.l2_segments[0],
    l2_segment: bla.l2_segments[1]
  };
}

// Hilfsfunktion fuer alle Kurven um die Ecke arbeiten
function get_triangle(pt1, pt2, d1, d2){
  const line = line_between_points(pt1,pt2);
  const length = pt1.distance(pt2);
  const ln1 = line_with_length(pt1, length, d1);
  const ln2 = line_with_length(pt2, length, d2);
  const ret = intersect_lines(ln1.line, ln2.line);

  remove_point(ret.l1_segments[1].get_endpoints()[1]);
  remove_point(ret.l2_segments[1].get_endpoints()[1]);


  return {
    point: ret.intersection_points[0],
    l1 : ret.l1_segments[0],
    l2 : ret.l2_segments[0],
    l3 : line
  }

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

// 2/3 is  the point where there all meet ...
function armpit(line_bust, line_shoulder, scale, s){
  const sho = line_shoulder.p2;
  const lot = lotpunkt(line_bust, sho, s);
//  const p = add_point(new Point(lot.x, lot.y));
  const vec = lot.subtract(sho).scale((2/3));
  const vec_scale = vec.get_orthonormal().mult(scale);
  const p_vec = sho.add(vec).add(vec_scale);

  const p = add_point(new Point(p_vec.x, p_vec.y));

  const ln1 = line_between_points(sho, p);
  const ln2 = line_between_points(line_bust.get_endpoints()[1], p);

  const interp = interpolate_lines(ln1, ln2, 2, (x) => Math.pow(x, 5), (x) => Math.pow(x, 0.7), (x) => Math.pow(x, 1.3));

  const line = smooth_out(interp, line_bust, 0, 0, 5);
  //const line = smooth_out(line_2, ln1, 1, 0);
  //console.log(debug.sketch_has_line(line));

  remove_point(p);
  remove_line(interp);
  //console.log(debug.sketch_has_line(line));

  return line;

}
/*
// von Punkt 1 zu Punkt 2 eine Linie ziehen, welche dem Armausschnitt entspricht
function armhole(pt1, pt2, d1, d2){
  const tri = get_triangle(pt1, pt2, d1, d2);
  const interp = interpolate_lines(tri.l1, tri.l2, 2, (x) => x*x*x, (x) => x, (x) => x);

  remove_point(tri.point);
  remove_line(tri.l3);
  return interp;
}
*/



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



// ggf. stark mit der orientierung aufpassen!
function side(pt1, pt2, ln){
  const ln_p = ln.get_endpoints();
  const h_vec1 = ln_p[1].add(pt1.subtract(ln_p[0]));
  const h_vec2 = ln_p[0].add(pt2.subtract(ln_p[1]));
  const h_p1 = add_point(new Point(h_vec1.x,h_vec1.y));
  const h_p2 = add_point(new Point(h_vec2.x,h_vec2.y));
  const h_l1 = line_between_points(pt1, h_p1);
  const h_l2 = line_between_points(pt2, h_p2);
  let line = interpolate_lines(h_l1, h_l2, 2, (x) => x, (x) => Math.pow(x, 0.6), (x) => Math.pow(x, 1.2));

  let line_old = line;
  //line = smooth_out(line, h_l2, 2, 0, 2);
  //remove_line(line_old);

  remove_point(h_p1);
  remove_point(h_p2);
  return line_old;
}




// ausschnitt funktion hiervon noch trennen
// degree = -72 für hinten, 0.12
// degree = -68 für vorne, 0.29
function shoulder(start, sh_length, h_length, type){
  distance = 0.12;
  if (type) {
    degree = -72;
  } else {
    distance = 0.12;
    degree = 51; //68 // 51
  //  distance = 0.12; // 0.29
  }
  const help = line_with_length(start, (h_length * distance), 180);

  const sh_l = line_with_length(help.get_endpoints()[1], (sh_length/2), degree);

//  const aus = ausschnitt(start, sh_l);
  remove_line(help);
  return sh_l;
}

function deepen_neckline(ln, n){
  const p = point_at(ln, n);
  remove_point(p.l1_segment.get_endpoints()[0]);
  return p.l2_segment;
}

/*
// runder (enger) Ausschnitt etwas mehr als 1/3 einer halben Seite der Schulter
function ausschnitt(start, sh_l){
  const ausschnitt_p = point_at(start, sh_l.point, sh_l.line, (2/5));
  const tri = get_triangle(start, ausschnitt_p.point, -90, 0);
  const ausschnitt = interpolate_lines(tri.l1, tri.l2, 2, (x) => x*x, (x) => x, (x) => x);

  remove_point(tri.point);
  remove_line(tri.l3);

  return ausschnitt;
}*/

function round_neckline(ct, type, start_ln, ln, r){
  let distance;
  let len = ln.get_length();
  if (type == "back"){
    distance = ct.back_shoulder_procentage;
  } else {
    distance = ct.front_shoulder_procentage;
  }
  const m = Math.max(distance, 0.36);

  const cut = point_at(ln, m);
  remove_point(cut.l1_segment.get_endpoints()[0]);

/*  const newln_o = cut.l2_segment.get_orthogonal();
  const ln_o = ln.get_orthogonal();
  const p_nln_o = add_point(new Point(newln_o.x, newln_o.y));
  const p_ln_o = add_point(new Point(ln_o.x, ln_o.y));
*/
  const n_ln = get_orth_line(start_ln, start_ln.get_endpoints()[0], r);
  const n_ln2 = get_orth_line_length(cut.l2_segment, cut.point, len, -r);

  const intersect = intersect_lines(n_ln, n_ln2);
  remove_point(intersect.l1_segments[1].get_endpoints()[1]);
  remove_point(intersect.l2_segments[1].get_endpoints()[1]);

  const inter = interpolate_lines(intersect.l1_segments[0], intersect.l2_segments[0], 2);


  remove_point(intersect.intersection_points[0]);

  return {
    shoulder: cut.l2_segment,
    neckline: inter
  };


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







export default { smooth_out, get_orth_line, get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, lotpunkt2, armpit, round_neckline};