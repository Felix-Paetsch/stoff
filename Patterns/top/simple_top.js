import { Vector, vec_angle, rotation_fun } from '../../StoffLib/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import utils from '../funs/utils.js';

import { line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline} from '../funs/basicFun.js';


import { split, split_tip} from '../funs/simple_split.js';


// schliesst zu part teilen den gegebenen Abnaeher, ohne dass er an einer anderen
// stelle wieder geoeffnet wird (wird "an die Seite" geschoben)
function without_dart(s, part = 1){
  let lines = s.lines_by_key("type");

  // Linien raus suchen
  let darts = lines.dart;

  darts = utils.sort_dart_lines(darts);
  let side = lines.side[0];
  let fold = lines.fold[0];
  // Abmessungen
  let len1 = darts[0].p2.subtract(darts[1].p2).length() * part;
  let len4 = side.get_length();

  // Seitenlinie korrigieren
  let vec = darts[1].p2.subtract(side.p2).normalize().scale(len1);
  utils.correct_point(side.p2, vec);
  utils.correct_point(darts[0].p2, vec);

  vec = side.get_line_vector().normalize().scale(len4).add(side.p1);
  side.p2.move_to(vec);

  vec = darts[0].get_line_vector().normalize().scale(darts[1].get_length());
  darts[0].p2.move_to(vec.add(darts[0].p1));

  if (part === 1){
    // neue Taillenlinie
    let line = s.line_between_points(fold.p2, side.p2);
    line.data.type = "waistline";

    // Abnaeher aus der Mitte entfernen
    s.remove_points(darts[0].p2, darts[0].p1, darts[1].p2);
  }



  return s;
};



// Warning: Nicht überarbeitet, ggf. optimierbar
// nimmt seitenteile von styleline und merged diese an der seite zusammen.
// gibt neues Sketch zurueck
function styleline_merge(s1, s2){
  const s = new Sketch();
  utils.mirror_sketch(s1);
  utils.position_sketch(s, s1);
  s.remove_point(s.data.pt);
  delete s.data.pt;
  utils.position_sketch(s, s2);

  // console.log(s.points);
  let sketches = s.get_connected_components();

  let lines1 = sketches[0].lines_by_key("type");
  let lines2 = sketches[1].lines_by_key("type");

  let side1 = lines1.side[0];
  let side2 = lines2.side[0];

  let vec = side2.p1.subtract(side1.p1);
  /*
  sketches[0].transform((i) => {
    i.move_to(i.subtract(vec));
  })
*/
  utils.reposition_zhk(sketches[0], vec);
  utils.rotate_zshk_to_point(sketches[0], side1.p2, side2.p2, side1.p1);

  let waist1 = lines1.waistline[0];
  //console.log(waist1)
  let waist2 = lines2.waistline[0];

  let armpit1 = lines1.armpit[0];
  let armpit2 = lines2.armpit[0];

  s.remove_lines(side1, side2);


  let temp = s.merge_points(armpit1.p2, armpit2.p2);
  let temp2 = s.merge_lines(armpit1, armpit2);
  s.remove_point(temp);

  s.data.comp = new ConnectedComponent(temp2);

  // TODO:  ggf. hier noch abändern, falls es zu lang wurde
  temp = s.merge_points(waist1.p2, waist2.p2);
  s.merge_lines(waist1, waist2);
  s.remove_point(temp);
  /*
*/


  return s;
};


function a_line(s){
  let lines = s.lines_by_key("type");
  let darts = lines.dart;
  let side = lines.side[0];


  let angle = vec_angle(darts[0].p2.subtract(darts[0].p1), darts[1].p2.subtract(darts[0].p1));
  let fun;
  if (s.data.front){
    fun = rotation_fun(side.p1, angle * 0.5);
  } else {
    fun = rotation_fun(side.p1, -angle * 0.5);
  }
  side.p2.move_to(fun(side.p2));

  let line = s.line_between_points(lines.fold[0].p2, side.p2);
  line.data.type = "waistline";

  let p = darts[0].p1;

  s.remove_point(darts[0].p2);
  s.remove_point(darts[1].p2);
  s.remove_point(p);

  return s;
};


// Teilt an der Linie type bei percent das Schnittmuster entlang des
// vorhandenen Abnähers und gibt zwei verschiedene Sketches zurück
// [outer, inner]
function split_pattern(s, type, percent){

  let lines = s.lines_by_key("type");
  /*
  */
  if (percent > 0.95){
    percent = 0.95
  } else if (percent < 0.05){
    percent = 0.05
  }
  let line = lines[type][0];
  let p = s.add_point(s.position_at_length(line, line.get_length() * percent));
  split(s, line, p);


  return utils.set_comp_to_new_sketches(s);
};

// armpit oder side oder shoulder oder neckline
// nimmt eine Sketch, die beinhaltet auf welcher Linie der Abnäher kommen soll,
// und rotiert zu percent anteile den Abnäher an die gegebene Position
function simple_middle_dart(s, type, percent){
  let lines_comp = s.lines_by_key("type");


  if (percent > 0.95){
    percent = 0.95
  } else if (percent < 0.05){
    percent = 0.05
  }

  let line = lines_comp[type][0];
  let p = s.add_point(s.position_at_length(line, percent * line.get_length()));
  let angle = split(s, line, p);

  let outer = s.lines_by_key("type").dart.filter(ln => ln.data.side === "outer");
  let inner = s.lines_by_key("type").dart.filter(ln => ln.data.side === "inner");
  // ist egal welche von zwei Möglichkeiten hier genommen wird, da
  // beide den selben Punkt als p1 haben
  utils.rotate_zhk(s, -angle, outer[0].p1);

  let side = utils.sort_lines(s, s.lines_by_key("type").side)[0];
  let fold = utils.sort_lines(s, s.lines_by_key("type").fold)[0];

  inner = inner.filter(ln => (
    ln.data.dartposition !== line.data.type
  ))[0];
  outer = outer.filter(ln => (
    ln.data.dartposition !== line.data.type
  ))[0];
  s.merge_points(inner.p1, outer.p1);

  if (type !== "waistline"){
    line = s.line_between_points(fold.p2, side.p2);
    line.data.type = "waistline";
    s.remove_points(inner.p2, outer.p2);
  } else {
    let temp = s.merge_points(inner.p2, outer.p2);
    s.remove_lines(inner, outer);
    temp = temp.get_adjacent_lines();
    s.merge_lines(temp[0], temp[1], true);
  }

  /*
*/

  return s;
};

// bereits kopiert
// einfaches unterscheiden der Arten des Abnähers und entsprechende
// ausführung weiterer Funktionen (z.B. simple_middle_dart)
function simple_dart_web(s, pos){

  if(pos === "waistline"){
    simple_waistline_web(s);
  } else if(pos === "side middle"){
    simple_middle_dart(s, "side", 0.3);
  } else if(pos === "french"){
    simple_middle_dart(s, "side", 0.9);
  } else if(pos === "shoulder"){
    simple_middle_dart(s, "shoulder", 0.5);
  }
};

// bereits kopiert
// berechnet wo das Bein des Abnähers liegen muss, damit dieser genau Senkrecht
// zur Taille verläuft und ruft waistline_simple_dart auf
function simple_waistline_web(s){
  // finden, bei wie viel % der Abnäher liegen muss, damit er genau Senkrecht liegt
  let lines = s.lines_by_key("type").dart;

  lines = utils.sort_dart_lines( lines); // [0] ist am weitesten außen
  let dist = lines[0].p2.subtract(lines[1].p2).length();
  if(s.data.dartposition !== "waistline"){
    dist = dist/2;
  }

  let waist_inner = s.lines_by_key("type").waistline;
  let waist_width = waist_inner[0].get_length() + waist_inner[1].get_length();
  waist_inner = waist_inner.filter(ln => ln.data.side === "inner")[0];

  let val = waist_inner.get_length() - (dist / 2);
  let percent = val/waist_width;

  waistline_simple_dart(s, percent);

  return s;
};


// bereits uebernommen
// halbiert den Abnäher auf beide angegebene Positionen. Wenn nur eine
// Position angegeben wird, wird die andere Hälfte wie bei without dart
// an die seite "geschoben"
function double_dart_web(s, pos){
  const single_dart = ["waistline", "side middle", "french", "shoulder"];
  const waist_dart = ["waistline and side middle", "waistline and french", "waistline and shoulder"];

  let lines;
  let percent;
  let line;
  let side_shoulder = false;
  if (single_dart.includes(pos)){
    // erst hälfte an Seite klemmen
    without_dart(s, 0.5);
    simple_dart_web(s, pos);
    return s;
  } else if (waist_dart.includes(pos)){
    simple_waistline_web(s);
    lines = s.lines_by_key("type");
    if (pos === waist_dart[0]){
      line = lines.side[0];
      percent = 0.3;
    } else if (pos === waist_dart[1]){
      line = lines.side[0];
      percent = 0.9;
    } else {
      line = lines.shoulder[0];
      percent = 0.5;
    }
  } else if (pos === "side middle and shoulder"){
    simple_middle_dart(s, "side", 0.3);
    lines = s.lines_by_key("type");
    line = lines.shoulder[0];
    percent = 0.5;
    side_shoulder = true;
    utils.switch_inner_outer_dart(s.lines_by_key("type").dart);
  } else {
    simple_middle_dart(s, "side", 0.9);
    lines = s.lines_by_key("type");
    line = lines.shoulder[0];
    percent = 0.5;
    side_shoulder = true;
    utils.switch_inner_outer_dart(s.lines_by_key("type").dart);
  }


  let dart_parts = lines.dart;
  // sollte genau die zwei Schenkel vom Abnäher enthalten von simple_dart_web o.ä.

  let p = s.add_point(s.position_at_length(line, line.get_length() * percent));
  let angle = split(s, line, p);


  let outer = s.lines_by_key("type").dart.filter(ln => ln.data.side === "outer")[0];
  let inner = s.lines_by_key("type").dart.filter(ln => ln.data.side === "inner")[0];
  // ist egal welche von zwei Möglichkeiten hier genommen wird, da
  // beide den selben Punkt als p1 haben
  if (angle > Math.PI){
    utils.rotate_zhk(s, -(angle/2) + Math.PI , outer.p1);
  } else {
    utils.rotate_zhk(s, -(angle/2) , outer.p1);
  }
  s.merge_points(inner.p1, outer.p1);
  let point = s.add_point(outer.p1.copy());
  dart_parts[0].set_endpoints(point, dart_parts[0].p2);
  dart_parts[1].set_endpoints(point, dart_parts[1].p2);

  if(side_shoulder){
    utils.switch_inner_outer_dart(dart_parts);
  }

  return s;
};


// nutzt simple_middle_dart und rotiert den Abnäher erst zur Seite und dann
// an die richtige Position nach unten
// korrigiert zum Schluss die Taillenlinie
function waistline_simple_dart(s, percent){

  s = simple_middle_dart(s, "side", 0.5);

  if (percent > 0.95){
    percent = 0.95
  } else if (percent < 0.05){
    percent = 0.05
  }


// ggf. wird hier in die falsche Richtung rotiert?
  s = simple_middle_dart(s, "waistline", percent);

  correct_waistline(s);

  return s;
};


// korrigiert die Taillenlinie wenn sich dort der Abnäher befindet.
function correct_waistline(s){
  let lines = s.lines_by_key("type");
  let darts = utils.sort_dart_lines(lines.dart);
  let outer = darts[0];
  let inner = darts[1];

  let side = lines.side[0];
  let fold = lines.fold[0];
  let ln = s.line_between_points(fold.p2, side.p2);

  let vec = inner.get_line_vector().add(inner.p2);
  inner.p2.move_to(vec.x, vec.y);
  let pt = s.intersection_positions(ln, inner);
  inner.p2.move_to(pt[0]);

  let len = inner.get_length();
  vec = outer.get_line_vector().normalize().scale(len).add(outer.p1);
  outer.p2.move_to(vec.x, vec.y);

  s.remove_line(ln);

  return s;
}



//--------------------------------------------------------------------------------------------------------


// Wo benutzt??
function merge_lines(s, pattern_left, pattern_right, line_type){

   let line_left = pattern_left.comp.lines_by_key("type")[line_type][0];
   let line_right = pattern_right.comp.lines_by_key("type")[line_type][0];

   let vec = line_left.p1.subtract(line_right.p1);

   utils.reposition_zhk(pattern_right.comp, vec);

   let angle = vec_angle(line_left.p2.subtract(line_left.p1), line_right.p2.subtract(line_left.p1));
   utils.rotate_outer_zhk_new(s, pattern_left.comp, angle, line_left.p1, 0.5);
   utils.rotate_outer_zhk_new(s, pattern_right.comp, angle, line_left.p1, -0.5);

   s.merge_points(line_left.p1, line_right.p1);
   s.merge_points(line_left.p2, line_right.p2);
   s.remove_line(line_left);
   s.remove_line(line_right);
return s;
}


// wofür???
function simple_dart_tip(s, type1, type2){
  let lines_comp = s.data.comp.lines_by_key("type");

  let line1 = lines_comp[type1][0];
  let line2 = lines_comp[type2][0];

  let angle = split_tip(s, [line1, line2]);
  let comp_sorted = utils.sort_comp(s);
  /*
  if(type == "fold"){
    comp_sorted.reverse();
  }
  */
  let dart_o = comp_sorted[0].lines_by_key("type").dart[0];
  if (s.data.front){
    utils.rotate_outer_zhk_new(s, comp_sorted[0], angle, dart_o.p1);
  } else {
    utils.rotate_outer_zhk_new(s, comp_sorted[0], angle, dart_o.p1, -1);
  }
  let dart_i = comp_sorted[1].lines_by_key("type").dart[0];


  let side = comp_sorted[0].lines_by_key("type").side[0];

  let fold = comp_sorted[1].lines_by_key("type").fold[0];
  let line = s.line_between_points(fold.p2, side.p2);
  line.data.type = "waistline";

  s.merge_points(dart_o.p1, dart_i.p1);
  s.remove_point(dart_i.p2);
  s.remove_point(dart_o.p2);

  return s;
};



export default {a_line, simple_dart_web, styleline_merge, simple_waistline_web, double_dart_web, without_dart, split_pattern, simple_middle_dart, waistline_simple_dart, merge_lines};
