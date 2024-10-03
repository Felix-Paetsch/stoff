import { Vector, affine_transform_from_input_output, vec_angle_clockwise } from '../StoffLib/geometry.js';
import { add_point, line_between_points, Point, intersect_lines, remove_point, remove_line, interpolate_lines } from '../StoffLib/main.js';



function deg(degree){
  return ((degree*Math.PI)/ 180);
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
  const l = line_between_points(pt,p);
  return {
    point: p,
    line:  l
  };
}


function point_at(pt1, pt2, ln, part){
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
    line_segment_1: bla.l2_segments[0],
    line_segment_2: bla.l2_segments[1]
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



// von Punkt 1 zu Punkt 2 eine Linie ziehen, welche dem Armausschnitt entspricht
function armhole(pt1, pt2, d1, d2){
  const tri = get_triangle(pt1, pt2, d1, d2);
  const interp = interpolate_lines(tri.l1, tri.l2, 2, (x) => x*x*x, (x) => x, (x) => x);

  remove_point(tri.point);
  remove_line(tri.l3);
  return interp;
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

  const line = interpolate_lines(h_l1, h_l2, 2, (x) => x, (x) => Math.pow(x, 0.6), (x) => Math.pow(x, 1.2));

  remove_point(h_p1);
  remove_point(h_p2);
  return line;
}

// ausschnitt funktion hiervon noch trennen
function shoulder(start, sh_length, h_length, degree){
  const help = line_with_length(start, (h_length * 0.2), 180);
  const sh_l = line_with_length(help.point, ((sh_length/2)-(sh_length/18)), degree);

  const aus = ausschnitt(start, sh_l);
  remove_point(help.point);
  return {
    point: sh_l.point,
    line: sh_l.line,
    ausschnitt: aus
  }
}

function ausschnitt(start, sh_l){
  const ausschnitt_p = point_at(start, sh_l.point, sh_l.line, (2/5));
  const tri = get_triangle(start, ausschnitt_p.point, -90, 0);
  const ausschnitt = interpolate_lines(tri.l1, tri.l2, 2, (x) => x*x, (x) => x, (x) => x);

  remove_point(tri.point);
  remove_line(tri.l3);

  return ausschnitt;
}

export default { line_with_length, point_at, armhole, side , shoulder};