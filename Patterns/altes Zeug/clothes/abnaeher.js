import { Vector, affine_transform_from_input_output, vec_angle, rotation_fun } from '../StoffLib/geometry.js';
import { add_point, line_between_points, Point, intersection_points, intersect_lines, remove_point, remove_line, interpolate_lines, _get_sketch, debug, copy_line } from '../StoffLib/main.js';
import { get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, lotpunkt2, armpit, round_neckline} from './basicFun_new.js';


function deg(degree){
  // Degree to rad
  return ((degree*Math.PI)/ 180);
}

function rad_to_deg(r){
  return r*180/Math.PI
}




// unbedingt noch einmal neue Funktionen zu Abnähern schreiben!!!

// Abnaeher fuer die Seite (empfohlen abnaeher auf 3 bis 6 setzen, aber
// genaueres muss noch ausprobiert werden)

// pt ist von wo aus es konstruiert wird,
// ln1 ist die Linie, an dem die Richtung des Abnähers orientiert wird
// ln2 ist die Linie, mit dem wir das ganze "kreuzen" wollen
// abnaeher ist die Entfertung, die der Abnaeher an l2 haben soll
function add_abnaeher_side(pt, ln1, ln2, abnaeher){

// konstruiere Linie in Richtung l1 vom BP aus
  const vec = pt.add(ln1.p2.subtract(ln1.p1));
  const help = add_point(new Point(vec.x, vec.y));
  let l_h = line_between_points(pt, help);
// Punkt der Kreuzung der neuen Linie und l2 finden
  const inter = intersection_points(l_h, ln2);
  //console.log(debug.sketch_has_line(l_h));
  //console.log(debug.sketch_has_line(ln2));
//  remove_line(ln2);

  const p = add_point(new Point(inter[0].x, inter[0].y));

// Punkt bei 35% finden als Spitze des Abnähers
  l_h = line_between_points(pt, p);
  const start = point_at(l_h, 0.35);
start.l2_segment.set_color("red")

  // anderes Ende des Abnähers finden
  const l_help = get_orth_line_length(ln1, p, 1, abnaeher);
  const points = l_help.get_endpoints();

// alle unnötigen konstruktionslinien entfernen
  remove_point(help);
  remove_line(l_help);
  remove_line(start.l1_segment);
  remove_line(start.l2_segment);


  return {
    p1: start.point,
    p2: points[0],
    p3: points[1]
  };
}




// entfernt auch den Punkt um den rotiert werden soll
function rotate_abnaeher(ps, rot_p, degree, ln){
  const fun = rotation_fun(rot_p, deg(degree));
  const p1_h = fun(ps.p1);
  const p2_h = fun(ps.p2);
  const p3_h = fun(ps.p3);

  const vec2_h = p2_h.subtract(p1_h);
  const vec3_h = p3_h.subtract(p1_h);

  const vec1_h1 = p1_h.subtract(ln.get_endpoints()[0]);
  const vec1_h2 = p1_h.subtract(ln.get_endpoints()[1]);
  const vec_max = Math.max(vec1_h1.length(), vec1_h2.length());

  const vec2 = p1_h.add(vec2_h.normalize().scale(vec_max));
  const vec3 = p1_h.add(vec3_h.normalize().scale(vec_max));
//  const p_test = add_point(new Point(vec.x, vec2.y));
  const p1 = add_point(new Point(p1_h.x, p1_h.y));
  const p2 = add_point(new Point(vec2.x, vec2.y));
  const p3 = add_point(new Point(vec3.x, vec3.y));

  let ab;/*
  if (degree > 0){
    ab = draw_abnaeher(p1, p2, p3, ln);
  } else {*/
    ab = draw_abnaeher(p1, p2, p3, ln);
  //}

  remove_point(ps.p1);
  remove_point(ps.p2);
  remove_point(ps.p3);
  remove_point(rot_p);

  return ab;
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
    abnaeher: dart.abnaeher
  };
}


// degree have to be >= 20!!!
// Ich gehe davon aus, dass -x genutzt wird, wenn die untere Seite von lines_height
// verwendet wird, und +x wenn der obere Teil genutzt werden soll.

// wenn degree = 0, wird alles dahinter als argumente nicht gebraucht
function bust_dart(p_rot, abstand, l_richtung, l_seite, degree = 0, l_schnitt = 0, richtung_linie = 1){
  let temp = false;
  //console.log(l_seite_)
  if(l_seite == l_schnitt){
    temp = true;
  }

  let ps = add_abnaeher_side(p_rot, l_richtung, l_seite, abstand);
  ps = scale_dart(ps, l_seite);
  const dart = draw_abnaeher(ps.p1, ps.p2, ps.p3, l_seite);
  remove_line(dart.l_segments[1]);
  let cutting_line;

  if (degree){

    if(temp){
      cutting_line = draw_cutting_line(ps.p1, p_rot, degree, dart.l_segments[2], l_richtung, richtung_linie);
    } else {
      cutting_line = draw_cutting_line(ps.p1, p_rot, degree, l_schnitt, l_richtung, richtung_linie);
    }



  return {
    dart_tip: ps.p1,
    dart_ends: [dart.l_segments[0].p2, dart.l_segments[2].p1],
    dart_lines: dart.abnaeher,
    cutted_left: cutting_line.c_left,
    cutted_right: cutting_line.c_right,
    side_upper: dart.l_segments[0],
    side_lower: dart.l_segments[2]
    // ggf. hier noch was ändern
  }
} else {
  return {
    dart_tip: ps.p1,
    dart_ends: [dart.l_segments[0].p2, dart.l_segments[2].p1],
    dart_lines: dart.abnaeher,
  }
}
}


function draw_cutting_line(p1, p_rot, degree, ln, ln2, nr = 1){
  const p1_rotated = rotate_point(p1, p_rot, degree);
//  console.log(debug.sketch_has_line(ln))
  const p1_scaled = scale_line(p1_rotated, p_rot, ln);
  remove_point(p1_rotated);
  //console.log(debug.sketch_has_line(ln));
  const cutted_first = cut_line(p1, p1_scaled, ln, -1);
  /*
  let cutted_left;
  let cutted_right;
  let right_cut = cutted_first.l1_segments[0];
  remove_line(cutted_first.l1_segments[0]);
  if(degree > 18){
    const cutted_final = cut_line(p1, cutted_first.point, ln2);
    if (nr > 0){
      cutted_left = [cutted_first.l2_segments[1], cutted_final.l2_segments[1]];
      cutted_right = [cutted_first.l2_segments[0], cutted_final.l2_segments[0]];
    } else {
      cutted_left = [cutted_first.l2_segments[0], cutted_final.l2_segments[1]];
      cutted_right = [cutted_first.l2_segments[1], cutted_final.l2_segments[0]];
    }
    //left_cut = ;
    // wie mache ich das hier mit der Brustlinie? Wenn ich das jetzt rotiere,
    // was kommt da mit? Viel zu viel, oder?
    // genauso der anderen noch geschlossenen linie (im beispiel line_armpit)

  } else {
  //  const second_line = line_between_points(p1, cutted_first.point);
    cutted_left = [cutted_first.l2_segments[1]];
    cutted_right = [cutted_first.l2_segments[0]];
    if(nr < 0){
      cutted_left = [cutted_first.l2_segments[0]];
      cutted_right = [cutted_first.l2_segments[1]];
    }
  //  left_cut = second_line;
  }

  return {
    c_left: cutted_left,
    c_right: cutted_right,
    right_cut
  }*/
}

// Hier wird an sich nicht gedreht, also das ganze drehen fällt weg

function scale_dart(ps, ln){

// laengste Distanz von p1 zu ln bestimmen
  const vec1_h1 = ps.p1.subtract(ln.get_endpoints()[0]);
  const vec1_h2 = ps.p1.subtract(ln.get_endpoints()[1]);
  const vec_max = Math.max(vec1_h1.length(), vec1_h2.length());

// scalieren des Punktes
  const vec2_h = ps.p2.subtract(ps.p1);
  const vec3_h = ps.p3.subtract(ps.p1);
  const vec2 = ps.p1.add(vec2_h.normalize().scale(vec_max));
  const vec3 = ps.p1.add(vec3_h.normalize().scale(vec_max));

// neue Punkte setzen
  const p2 = add_point(new Point(vec2.x, vec2.y));
  const p3 = add_point(new Point(vec3.x, vec3.y));

// alte Punkte löschen
  remove_point(ps.p2);
  remove_point(ps.p3);

  // später wieder löschen!
//  draw_abnaeher(ps.p1, p2, p3, ln);
  return {
    p1: ps.p1,
    p2,
    p3
  }

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

function cut_line(p1, p2, ln, fall = 0){
  const l_h = line_between_points(p1, p2);
//  console.log(debug.sketch_has_line(ln));
  const inter = intersect_lines(l_h, ln);
  //console.log(debug.sketch_has_line(inter.l2_segments[0]));

  let l1_segments = inter.l1_segments;

  if (fall > 0){
    remove_point(inter.l1_segments[0].p1);
    l1_segments = [inter.l1_segments[1]];
  } else if (fall < 0) {
  //  remove_point(inter.l1_segments[1].p2);
    l1_segments = [inter.l1_segments[0]];
  }

  return {
    point: inter.intersection_points[0],
    l1_segments,
    l2_segments: inter.l2_segments
  }
}

function rotate_dart(abnaeher, l_height, lines_between = [], richtung_linie = 1, richtung_rotierend = 1){
/*  dart_tip: ps.p1,
  dart_ends: [dart.l_segments[0].p2, dart.l_segments[2].p1],
  dart_lines: dart.abnaeher,
  cutted_left: cutting_line.c_left,
  cutted_right: cutting_line.c_right*/

//  remove_point(abnaeher.cutted_left[1].p1);
  //remove_point(abnaeher.cutted_left[0].p1);

  const a = abnaeher.dart_lines[0].get_line_vector();
  const b = abnaeher.dart_lines[1].get_line_vector();
  const alpha = vec_angle(a, b);

  let fun;
  if(richtung_rotierend > 0){
    fun = rotation_fun(abnaeher.dart_tip, -alpha);
  } else {
    fun = rotation_fun(abnaeher.dart_tip, alpha);
  }
  let vec_h = fun(abnaeher.dart_ends[0]);
  abnaeher.dart_ends[0].moveTo(vec_h.x, vec_h.y);
  let p1;
  if (richtung_linie > 0){
    p1 = add_point(abnaeher.cutted_left[0].p1.copy());
    abnaeher.cutted_left[0].set_endpoints(p1, abnaeher.cutted_left[0].p2);
    vec_h = fun(p1);
    abnaeher.cutted_left[0].p1.moveTo(vec_h.x, vec_h.y);
  } else {
    p1 = add_point(abnaeher.cutted_left[0].p2.copy());
    abnaeher.cutted_left[0].set_endpoints(abnaeher.cutted_left[0].p1, p1);
    vec_h = fun(p1);
    abnaeher.cutted_left[0].p2.moveTo(vec_h.x, vec_h.y);
  }


  if(abnaeher.cutted_left[1] ){
    vec_h = fun(abnaeher.cutted_left[1].p2);
    abnaeher.cutted_left[1].p2.moveTo(vec_h.x, vec_h.y);
    const p2 = add_point(abnaeher.cutted_left[1].p1.copy());
    abnaeher.cutted_left[1].set_endpoints(p2, abnaeher.cutted_left[1].p2);
    vec_h = fun(p2);
    abnaeher.cutted_left[1].p1.moveTo(vec_h.x, vec_h.y);
    const l1 = line_between_points(p1, p2);
    const l2 = line_between_points(p2, abnaeher.dart_tip);
  } else {
    const l1 = line_between_points(p1, abnaeher.dart_tip);
  }

  if(richtung_rotierend <= 0){
    lines_between[0].swap_orientation();
  }
    lines_between.forEach(line => {
      let vec = fun(line.p1);
      line.p1.moveTo(vec.x, vec.y);
    });

  if(richtung_rotierend <= 0){
    lines_between[0].swap_orientation();
  }





// neue linie fuer die Seite ziehen
  const p_vec = lotpunkt(l_height, abnaeher.side_upper.p1, -1);
  const p = add_point(new Point(p_vec.x, p_vec.y));
  const l_h = line_between_points(p, l_height.p2);

  const l_side = side(abnaeher.side_upper.p1, abnaeher.side_lower.p2 , l_h);
  remove_point(p);

// den ganzen alten Abnaeher Mist entfernen
  remove_point(abnaeher.dart_ends[0]);
  remove_point(abnaeher.dart_ends[1]);
  //remove_line(abnaeher.cutted_left[0]);

return {
  line_side: l_side,
  line_bust: [abnaeher.cutted_left[1], abnaeher.cutted_right[1]],
  line_cutted: [abnaeher.cutted_left[0], abnaeher.cutted_right[0]]
  // hier fehlt noch einiges
}

  //const p = abnaeher.dart_ends[1];
}


function dart_new(pt, ln1, ln2, shoulder, abnaeher){

  // konstruiere Linie in Richtung l1 vom BP aus
    const vec = pt.add(ln1.p2.subtract(ln1.p1));
    const help = add_point(new Point(vec.x, vec.y));
    let l_h = line_between_points(pt, help);
  // Punkt der Kreuzung der neuen Linie und l2 finden
    let l_h2 = point_at(l_h, 0.2);
    let p2 = add_point(new Point(l_h2.point.x, l_h2.point.y));
    const inter = intersect_lines(l_h2.l2_segment, ln2);


    const p = add_point(new Point(inter.intersection_points[0].x, inter.intersection_points[0].y));
    inter.l2_segments[0].set_endpoints(inter.l2_segments[0].p1, p);
    remove_point(inter.l1_segments[1].p2);

    const l_H = line_with_length(shoulder.p1, shoulder.get_length(), 68);

  // Verschieben um alte Schulter zu neuer Schulter
  /*  const vec_h = shoulder.p2.subtract(l_H.p2);

    let p_h = shoulder.p2.subtract(vec_h);
    shoulder.p2.moveTo(p_h.x, p_h.y);

    p_h = ln1.p2.subtract(vec_h);
    ln1.p2.moveTo(p_h.x, p_h.y);

    p_h = p.subtract(vec_h);
    p.moveTo(p_h.x, p_h.y);

    line_between_points(pt, p);*/


    // drehen um p1 von der Brustlinie
  /*  degree = rad_to_deg(vec_angle(l_H.p2.subtract(l_H.p1), shoulder.p2.subtract(l_H.p1)));
    console.log(degree);

    let p_h = rotate_point(shoulder.p2, l_H.p1, degree);
    shoulder.p2.moveTo(p_h.x, p_h.y);

    p_h = rotate_point(ln1.p2, ln1.p1, degree);
    p_h2 = p.add(p_h.subtract(ln1.p1).subtract(ln1.p2.subtract(ln1.p1)));
    ln1.p2.moveTo(p_h.x, p_h.y);

    p.moveTo(p_h2.x, p_h2.y);

    l = line_between_points(p2, p);

    remove_point(l_H.p2); */

    // drehen um p1 von der Brustlinie V2
    degree = rad_to_deg(vec_angle(l_H.p2.subtract(l_H.p1), shoulder.p2.subtract(l_H.p1)));

    let p_h = rotate_point(shoulder.p2, ln1.p1, degree/2);
    lpv = lotpunkt2(shoulder.p2, ln1, l_H, -1);
  //  lp = add_point(new Point(lpv.x, lpv.y));
    const newDegree = rad_to_deg(vec_angle(lpv.subtract(l_H.p1), shoulder.p2.subtract(l_H.p1)));

    console.log(degree, newDegree, "degree");
  //  shoulder.p2.moveTo(lpv.x,lpv.y);

    remove_point(p_h);
    p_h = rotate_point(ln1.p2, ln1.p1, degree);
    p_h2 = p.add(p_h.subtract(ln1.p1).subtract(ln1.p2.subtract(ln1.p1)));
    //ln1.p2.moveTo(p_h.x, p_h.y);

    //p.moveTo(p_h2.x, p_h2.y);

    l = line_between_points(inter.l1_segments[0].p1, p);
    remove_point(p2);

    remove_point(l_H.p2);
    remove_point(p_h);



    // den Winkel ganz neu berechnen -
    l_h = get_orth_line_length(inter.l1_segments[0], p, -1, abnaeher);
    const nDeg = rad_to_deg(vec_angle(l_h.p2.subtract(inter.l1_segments[0].p1), p.subtract(inter.l1_segments[0].p1)));
    //remove_point(inter.l1_segments[0].p1)
    console.log(nDeg, "neue Gradzahl");
    p_h = rotate_point(p, inter.l1_segments[0].p1, nDeg);
    let movVec = p.subtract(p_h);

    p.moveTo(p_h.x, p_h.y);
    remove_point(l_h.p2);
    remove_point(p_h);
    p_h = ln1.p2.subtract(movVec);
    p_h3 = add_point(new Point(p_h.x, p_h.y));

    degree = rad_to_deg(vec_angle(p_h3.subtract(ln1.p1), ln1.p2.subtract(ln1.p1)));
  //  remove_line(inter.l1_segments[0])
    console.log(degree, "die ganz neue Art, Winkel zu messen!");
  line_between_points(ln1.p1, p_h3).set_color("blue")
    p_h4 = rotate_point(ln1.p2, ln1.p1, degree);
    line_between_points(ln1.p1, p_h4).set_color("red")
    degree = rad_to_deg(vec_angle(p_h4.subtract(ln1.p1), inter.l1_segments[0].p2.subtract(ln1.p1)));
    console.log(degree, "die ganz neue Art, Winkel zu messen!");
    ln1.p2.moveTo(p_h4.x, p_h4.y);

    remove_point(p_h3);
    remove_point(p_h4);

    p_h = rotate_point(shoulder.p2, shoulder.p1, degree );
    l_h = line_between_points(shoulder.p1, p_h);
    //l_h.p2.moveTo(p_h.x, p_h.y);
    p_h = rotate_point(shoulder.p2, ln1.p1, degree/2);
    lpv = lotpunkt2(shoulder.p2, inter.l1_segments[0], l_h, -1);
  //  lp = add_point(new Point(lpv.x, lpv.y));
    remove_point(l_h.p2);
    remove_point(p_h);

    shoulder.p2.moveTo(lpv.x,lpv.y);

   const n2Deg = rad_to_deg(vec_angle(inter.intersection_points[0].subtract(l_h2.l1_segment.p1), p.subtract(l_h2.l1_segment.p1)));


    p_h = rotate_point(inter.l1_segments[0].p1, l_h2.l1_segment.p1, n2Deg);
    inter.l1_segments[0].p1.moveTo(p_h.x, p_h.y);
    required_len = inter.l1_segments[0].get_length();
    n_vec = l.p1.add(l.get_line_vector().normalize().scale(required_len));
    l.p2.moveTo(n_vec.x, n_vec.y);

    //remove_point(l_h2.l1_segment.p1)
  //  inter.l1_segments[1].p1.set_color("green")





    return {
      side: inter.l2_segments,
      dart: [l, inter.l1_segments[0]]
    }

}



export default {dart_new, rotate_dart, tai_sho_dart, cut_line, rotate_point, scale_line, rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart};
