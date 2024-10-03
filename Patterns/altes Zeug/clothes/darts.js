import { Vector, affine_transform_from_input_output, vec_angle, rotation_fun } from '../StoffLib/geometry.js';
import { add_point, line_between_points, Point, intersection_points, intersect_lines, remove_point, remove_line, interpolate_lines, _get_sketch, debug, copy_line , point_on_line, merge_lines} from '../StoffLib/main.js';
import { get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, lotpunkt2, armpit, round_neckline} from './basicFun_new.js';


function deg(degree){
  // Degree to rad
  return ((degree*Math.PI)/ 180);
}

function rad_to_deg(r){
  return r*180/Math.PI
}


// umbenennen zu draw_dart
function draw_abnaeher(p1, p2, p3, ln){
  const l1 = line_between_points(p1, p2);
  const l2 = line_between_points(p1, p3);

  const inter1 = intersect_lines(l1, ln);
  const inter2 = intersect_lines(l2, inter1.l2_segments[1]);

  remove_point(inter1.l1_segments[1].get_endpoints()[1]);

  remove_point(inter2.l1_segments[1].get_endpoints()[1]);
  const segments = [inter1.l2_segments[0], inter2.l2_segments[0], inter2.l2_segments[1]];

  return {
    l_segments: segments,
    abnaeher: [inter1.l1_segments[0], inter2.l1_segments[0]]
  }
};


// distance wird immer rechts vom scalierten p1 gesetzt
function tai_sho_dart(p_rot, p1, ln, degree, distance = 3){
  // rotate and scale p1
  const p1_rotated = rotate_point(p1, p_rot, degree);
  const p1_scaled = scale_line(p1_rotated, p_rot, ln);

// zweiten Punkt setzen
  const vec = ln.p2.subtract(ln.p1).normalize().scale(-distance).add(p1_scaled);
  const p2 = add_point(new Point(vec.x, vec.y));
//  console.log(debug.sketch_has_line(ln));

  const dart = draw_abnaeher(p1_rotated, p2, p1_scaled, ln);
  remove_line(dart.l_segments[1]);
  return {
    l_segments: [dart.l_segments[0], dart.l_segments[2]],
    dart: dart.abnaeher
  };
}


function scale_line(p1, p_rot, ln){
  const vec1_h1 = p1.subtract(ln.get_endpoints()[0]);
  const vec1_h2 = p1.subtract(ln.get_endpoints()[1]);
  const vec_max = Math.max(vec1_h1.length(), vec1_h2.length());

  const vec2_h = p1.subtract(p_rot);
  const vec2 = p1.add(vec2_h.normalize().scale(vec_max));

  // neue Punkte setzen
  const p2 = add_point(new Point(vec2.x, vec2.y));

 // alte Punkte löschen
  //remove_point(p1);
  return p2;
}

function rotate_point(pt, rot_p, degree){
  const fun = rotation_fun(rot_p, deg(degree));
  const p_h = fun(pt);
  const p = add_point(new Point(p_h.x, p_h.y));

  return p;
}


function dart_new(pt, ln1, ln2, shoulder, abnaeher, ct){

  // konstruiere Linie in Richtung l1 vom BP aus
    const vec = pt.add(ln1.p2.subtract(ln1.p1));
    const help = add_point(new Point(vec.x, vec.y));
    let l_h = line_between_points(pt, help);
  // Punkt der Kreuzung der neuen Linie und l2 finden
    let l_h2 = point_at(l_h, 0.2);
    let p2 = l_h2.point;
    const inter = intersect_lines(l_h2.l2_segment, ln2);
    remove_point(inter.l1_segments[1].p2);
    dart_l2 = inter.l1_segments[0];

    // verdopple den Punkt, um ihn spaeter mit einer der Katheten bewegen zu koennen
    const p = add_point(new Point(inter.intersection_points[0].x, inter.intersection_points[0].y));
    inter.l2_segments[0].set_endpoints(inter.l2_segments[0].p1, p);

    //Irgendwelche lustige Rechnungen, durch die ich einen ersten Winkel bekomme
    const l_H = line_with_length(shoulder.p1, shoulder.get_length(), 68);
    degree = rad_to_deg(vec_angle(l_H.p2.subtract(l_H.p1), shoulder.p2.subtract(l_H.p1)));
    remove_point(l_H.p2);

    // rotieren der Brustlinie
  //  let p_h = rotate_point(ln1.p2, ln1.p1, degree);
  //  ln1.p2.moveTo(p_h.x, p_h.y);
    //remove_point(p_h);

    // zeichnen des zweiten Schenkels des Abnaehers
    dart_l1 = line_between_points(p2, p);


    // den Winkel ganz neu berechnen -
    l_h = get_orth_line_length(dart_l2, p, -1, abnaeher);
    let nDeg = rad_to_deg(vec_angle(l_h.p2.subtract(p2), p.subtract(p2)));
    let p_h = rotate_point(p, p2, nDeg);
    let li = line_between_points(p, p_h);
    let p_h3;
    let leng = li.get_length();
    while (leng < abnaeher){
      nDeg = nDeg + 1;
      p_h3 = rotate_point(p, p2, nDeg);
      p_h.moveTo(p_h3.x, p_h3.y);
      remove_point(p_h3);
      leng = li.get_length();
    }


    p.moveTo(p_h.x, p_h.y);
    remove_point(l_h.p2);
    remove_point(p_h);



    // lustige rechnungen, durch die ich unter anderem die Schulter kuerze und die
    // schulter linie generell nach oben drehen kann

    // Brustlinie verschieben
    degree = rad_to_deg(vec_angle(dart_l2.p2.subtract(ln1.p1), p.subtract(ln1.p1)));
    p_h = rotate_point(ln1.p2, ln1.p1, degree);
    ln1.p2.moveTo(p_h.x, p_h.y);
    remove_point(p_h);

    degree = rad_to_deg(vec_angle(dart_l2.p2.subtract(ln1.p1), p.subtract(ln1.p1)));
    degr = Math.max(degree, 15);
    p_h = rotate_point(shoulder.p2, shoulder.p1, degr);
    l_h = line_between_points(shoulder.p1, p_h);

  //  console.log(degree)


    p_h2 = rotate_point(shoulder.p2, ln1.p1, degree/2);
    lpv = lotpunkt2(shoulder.p2, dart_l2, l_h, -1);

    remove_point(p_h);
    remove_point(p_h2)

    shoulder.p2.moveTo(lpv.x,lpv.y);




    // Bewege die Abnaeherspitze um den Brustpunkt nach oben und verlaengere damit
    // ebenfalls die Seiten des Abnaehers um etwas Gleichgewicht herzusttellen
    if (ct.front_dart_rotation){
      const n2Deg = rad_to_deg(vec_angle(inter.intersection_points[0].subtract(l_h2.l1_segment.p1), p.subtract(l_h2.l1_segment.p1)));
      p_h = rotate_point(p2, l_h2.l1_segment.p1, n2Deg);
      p2.moveTo(p_h.x, p_h.y);
      remove_point(p_h)
      required_len = dart_l2.get_length();
      n_vec = p2.add(dart_l1.get_line_vector().normalize().scale(required_len));
      p.moveTo(n_vec.x, n_vec.y);
    }


    return {
      side: inter.l2_segments,
      dart: [dart_l1, dart_l2]
    }

}



function side_to_tai(front, ct){
  tip = front.dart[0].p1;
  temp = point_at(front.tai, ct.part_front_dart);
  p = temp.point;
  p2 = add_point(new Point(p.x, p.y));
  //line_between_points




}

// top_to_tai()

function side_to_top(front_part, dart){
  rot_p = dart[0].p1;
  p = dart[0].p2;
  let p_h = dart[1].p2;
  degree = rad_to_deg(vec_angle(p.subtract(rot_p), p_h.subtract(rot_p)));

  p.moveTo(p_h.x, p_h.y);
  remove_point(p_h);

  remove_point(rot_p);
  vec = lotpunkt(front_part.middle, p, -1);
  lot = add_point(new Point(vec.x, vec.y));

  temp = point_on_line(lot, front_part.middle);
  rot_p = temp.point;

  p_h = rotate_point(front_part.armpit.p1, rot_p, -degree*2/3);
  front_part.armpit.p1.moveTo(p_h.x, p_h.y);
  remove_point(p_h);


  p_h = rotate_point(front_part.armpit.p2, rot_p, -degree*2/3);
  front_part.armpit.p2.moveTo(p_h.x, p_h.y);
  remove_point(p_h);


  p_h = rotate_point(front_part.shoulder.p1, rot_p, -degree*2/3);
  front_part.shoulder.p1.moveTo(p_h.x, p_h.y);
  remove_point(p_h);

  p_h = rotate_point(front_part.tai.p1, rot_p, degree/3);
  front_part.tai.p1.moveTo(p_h.x, p_h.y);
  remove_point(p_h);

  p_h = rotate_point(front_part.tai.p2, rot_p, degree/3);
  front_part.tai.p2.moveTo(p_h.x, p_h.y);
  remove_point(p_h);


  remove_point(p);

  ln = side(front_part.armpit.p2, front_part.tai.p2, temp.line_segments[1]);
  front_part.side = ln;
  front_part.middle = merge_lines(temp.line_segments[0], temp.line_segments[1]);
  remove_point(temp.point);


}


export default {dart_new, tai_sho_dart, rotate_point, side_to_tai, side_to_top};