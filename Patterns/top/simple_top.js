import { Vector, vec_angle, rotation_fun } from '../../StoffLib/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import utils from '../funs/utils.js';

import { line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline} from '../funs/basicFun.js';


import { split, split_tip} from '../funs/simple_split.js';

function without_dart(s, part = 1){
  let lines_comp = s.data.comp.lines_by_key("type");

  // Linien raus suchen
  let darts = lines_comp.dart;
  darts = utils.sort_lines(s, darts);
  let side = lines_comp.side[0];
  let fold = lines_comp.fold[0];

  // Abmessungen
  let len1 = darts[0].p2.subtract(darts[1].p2).length() * part;

  let len4 = side.get_length();

  // Seitenlinie korrigieren
  let vec = darts[1].p2.subtract(side.p2).normalize().scale(len1);
  side.p2.move_to(vec.add(side.p2));
  darts[0].p2.move_to(vec.add(darts[0].p2));
  vec = side.get_line_vector().normalize().scale(len4).add(side.p1);
  side.p2.move_to(vec);
  vec = darts[0].get_line_vector().normalize().scale(darts[1].get_length());
  darts[0].p2.move_to(vec.add(darts[0].p1));

  if (part === 1){
    // neue Taillenlinie
    let line = s.line_between_points(fold.p2, side.p2);
    line.data.type = "waistline";

    // Abnaeher aus der Mitte entfernen
    let p = darts[0].p1;
    s.remove_point(darts[0].p2);
    s.remove_point(darts[1].p2);
    s.remove_point(p);

  }


  return s;
};


function styleline_panel(s, design, mea){
  let lines_comp = s.data.comp.lines_by_key("type");
  let line1 = lines_comp.armpit[0];
  let p1 = utils.get_point_on_line_percent(s, line1, 0.7);

  let line2 = lines_comp.waistline;
  line2 = utils.sort_lines(s, line2)[0];
  let p2 = utils.get_point_on_line_percent(s, line2, 0.3);

  let parts;
  parts = utils.split_at_points(s, p1, line1, p2, line2, "side");

  if (design === "panel side"){
    //parts = utils.split_at_points(s, p1, line1, p2, line2, "side");
    simple_middle_dart(parts[0], "side", 0.3);
  } else if (design === "panel shoulder"){

    simple_dart_web(parts[0], "shoulder", mea);
  }

  return parts;
}


function styleline_merge(s1, s2){
  const s = new Sketch();
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
  //waist1.set_color("green")
  //waist2.set_color("red")

  let armpit1 = lines1.armpit[0];
  let armpit2 = lines2.armpit[0];

  s.remove_line(side1);
  s.remove_line(side2);




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
  let lines = s.data.comp.lines_by_key("type");
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



function split_pattern(s, type, percent){
  let lines_comp = s.data.comp.lines_by_key("type");


  if (type == "fold"){
    let ln = lines_comp.shoulder[0];
    s.data.comp = new ConnectedComponent(ln);
  }
  if (percent > 0.95){
    percent = 0.95
  } else if (percent < 0.05){
    percent = 0.05
  }

  let line = lines_comp[type][0];
  let p = utils.get_point_on_line_percent(s, line, percent);
  split(s, line, p);

  let comp_sorted = utils.sort_comp(s);
  if(type == "fold"){
    comp_sorted.reverse();
  }

  const pattern_i = utils.set_comp_to_new_sketch(s, comp_sorted[0]);
  //pattern_i.data.comp.lines_by_key("type").waistline[0].set_color("red")
  const pattern_o = utils.set_comp_to_new_sketch(s, comp_sorted[1]);

  //console.log(pattern_i.data)
//console.log(pattern_o.data)
  //let test = pattern_o.comp.lines_by_key("type").dart[0];
  //test.p1.move_to(0,4);
/*
  */


  return [pattern_o, pattern_i];
};

// degree angeben ; armpit oder side oder shoulder oder neckline
function simple_middle_dart(s, type, percent){
  let lines_comp = s.data.comp.lines_by_key("type");

  if (type == "fold"){
    let ln = lines_comp.shoulder[0];
    s.data.comp = new ConnectedComponent(ln);
  }
  if (percent > 0.95){
    percent = 0.95
  } else if (percent < 0.05){
    percent = 0.05
  }

  let line = lines_comp[type][0];

  let p = utils.get_point_on_line_percent(s, line, percent);
  let angle = split(s, line, p);

  let comp_sorted = utils.sort_comp(s);
  if(type == "fold"){
    comp_sorted.reverse();
  }
  let dart_o = comp_sorted[0].lines_by_key("type").dart[0];
  if (s.data.front){
    utils.rotate_outer_zhk_new(s, comp_sorted[0], angle, dart_o.p1);
  } else {
    utils.rotate_outer_zhk_new(s, comp_sorted[0], angle, dart_o.p1, -1);
  }
  let dart_i = comp_sorted[1].lines_by_key("type").dart[0];


  let side = comp_sorted[0].lines_by_key("type").side[0];

  let fold = comp_sorted[1].lines_by_key("type").fold[0];
  line = s.line_between_points(fold.p2, side.p2);
  line.data.type = "waistline";

  s.merge_points(dart_o.p1, dart_i.p1);
  s.remove_point(dart_i.p2);
  s.remove_point(dart_o.p2);
  /*
*/

  return s;
};


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


function simple_dart_web(s, pos, mea){
  if(pos === "waistline"){
    simple_waistline_web(s, mea);
    // lengthen mit dart nach unten
  } else if(pos === "side middle"){
 // ToDO ! Schauen, ob hier der Winkel überprüft werden muss
    simple_middle_dart(s, "side", 0.3);
    //lengthen.lengthen_top_without_dart(s, mea, 0.75);
  } else if(pos === "french"){
    simple_middle_dart(s, "side", 0.9);
  } else if(pos === "shoulder"){
    simple_middle_dart(s, "shoulder", 0.5);
    s.data.shoulder_dart = true;

  }
};

function simple_waistline_web(s, mea){
  let lines = s.data.comp.lines_by_key("type").dart;
  lines = utils.sort_lines(s, lines); // [0] ist am weitesten außen
  let dist = lines[0].p2.subtract(lines[1].p2).length();
  let val;
  let percent;
  if(s.data.front){
    val = mea.bust_point_width - dist;
    percent = val/mea.waist_width_front
  } else {
    val = mea.shoulderblade_width - dist;
    percent = val/mea.waist_width_back;
  }



  waistline_simple_dart(s, percent);

  return s;
};


function double_dart_web(s, pos, mea){
  const single_dart = ["waistline", "side middle", "french", "shoulder"];
  const waist_dart = ["waistline and side middle", "waistline and french", "waistline and shoulder"];

  let lines;
  let percent;
  let line;


  if (single_dart.includes(pos)){
    // erst hälfte an Seite klemmen
    without_dart(s, 0.5);
    simple_dart_web(s, pos, mea);
    return s;
  } else if (waist_dart.includes(pos)){
    simple_waistline_web(s, mea);
    lines = s.data.comp.lines_by_key("type");
    if (pos === waist_dart[0]){
      line = lines.side[0];
      percent = 0.3;
    } else if (pos === waist_dart[1]){
      line = lines.side[0];
      percent = 0.9;
    } else {
      line = lines.shoulder[0];
      percent = 0.5;
      s.data.shoulder_dart = true;
    }
  } else if (pos === "side middle and shoulder"){
    simple_middle_dart(s, "side", 0.3);
    lines = s.data.comp.lines_by_key("type");
    line = lines.shoulder[0];
    percent = 0.5;
    s.data.shoulder_dart = true;
  } else {
    simple_middle_dart(s, "side", 0.9);
    lines = s.data.comp.lines_by_key("type");
    line = lines.shoulder[0];
    percent = 0.5;
    s.data.shoulder_dart = true;

  }


  let dart_parts = lines.dart;
  // sollte genau die zwei Schenkel vom Abnäher enthalten von simple_dart_web o.ä.


  let p = utils.get_point_on_line_percent(s, line, percent);
  let angle = split(s, line, p);

  let comp_sorted = utils.sort_comp(s);
  let dart_o = comp_sorted[0].lines_by_key("type").dart[0];
  let dart_i = comp_sorted[1].lines_by_key("type").dart[0];

  if (s.data.front){
    utils.rotate_outer_zhk_new(s, comp_sorted[0], angle/2, dart_o.p1);
  } else {
    utils.rotate_outer_zhk_new(s, comp_sorted[0], angle/2, dart_o.p1, -1);
  }

  s.merge_points(dart_o.p1, dart_i.p1);
  let point = s.add_point(dart_o.p1.copy());
  dart_parts[0].set_endpoints(point, dart_parts[0].p2);
  dart_parts[1].set_endpoints(point, dart_parts[1].p2);

  return s;
};

function waistline_simple_dart(s, percent){
  s = simple_middle_dart(s, "side", 0.5);

  if (percent > 0.95){
    percent = 0.95
  } else if (percent < 0.05){
    percent = 0.05
  }

  let line = s.data.comp.lines_by_key("type").waistline[0];
  let p = utils.get_point_on_line_percent(s, line, percent);
  let angle = split(s, line, p);

  let comp_sorted = utils.sort_comp(s);
  let dart_o = comp_sorted[0].lines_by_key("type").dart[0];

  if (s.data.front){
    utils.rotate_outer_zhk_new(s, comp_sorted[0], angle, dart_o.p1, -1);
  } else {
    utils.rotate_outer_zhk_new(s, comp_sorted[0], angle, dart_o.p1);
  }
  let dart_i = comp_sorted[1].lines_by_key("type").dart[0];

  let side1 = comp_sorted[1].lines_by_key("type").side[0];
  let side2 = comp_sorted[0].lines_by_key("type").side[0];

  line = s.line_between_points(side1.p1, side2.p2);
  line.data.type = "side";
  s.merge_points(dart_o.p1, dart_i.p1);
  s.remove_point(dart_i.p2);
  s.remove_point(dart_o.p2);
  correct_waistline(s);

  return s;
};


function wiener_naht(s){
  waistline_simple_dart(s, 0.4);
  let sketches = split_pattern(s, "armpit", 0.5);

  if(s.data.front){
    let vec = new Vector(25, 0);
  } else {
    let vec = new Vector(-25, 0);
    //top.merge_lines(s, s.data.back_outer, s.data.front_outer, "side");
  }
  /*

  sketches[0].comp.transform(elem => {
    elem.move_to(elem.add(vec));
  });
  let darts_i = utils.get_lines(pattern_inner.comp, "dart");
  //let darts_o = utils.get_lines(pattern_outer.comp, "dart");
  s.interpolate_lines(darts_i[0], darts_i[1], 1, (x)=>Math.pow(x,15));
  //s.interpolate_lines(darts_o[0], darts_o[1], 1, (x)=>Math.pow(x,15));


  pattern_inner.comp = new ConnectedComponent(utils.get_lines(pattern_inner.comp, "waistline"));
//  pattern_outer.comp = new ConnectedComponent(utils.get_lines(pattern_outer.comp, "waistline"));
  s.remove_point(darts_i[0].p1);
  //s.remove_point(darts_o[0].p1);
  */
  return s;
};



function correct_waistline(s){
    let lines = s.data.comp.lines_by_key("type").dart;
    let l1 = lines[0];
    let l2 = lines[1];
    let l_waist = s.data.comp.lines_by_key("type").waistline;
    l_waist = utils.sort_lines(s, l_waist);

    let ln = s.line_between_points(l_waist[1].p1, l_waist[0].p2);
    let vec = l1.get_line_vector().add(l1.p2);
    l1.p2.move_to(vec.x, vec.y);
    let pt = s.intersection_positions(ln, l1);
    l1.p2.move_to(pt[0]);

    let len = l1.get_length();
    vec = l2.get_line_vector().normalize().scale(len).add(l2.p1);
    l2.p2.move_to(vec.x, vec.y);

    s.remove_line(ln);

  return s;
}

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


function simple_lengthen(s, pattern, mea, percent_length,  percent_side = 0){
  let waist = pattern.comp.lines_by_key("type").waistline[0];
  let direction;
  let additional_length;
  if (pattern.front){
    additional_length = mea.bottom_width_front - mea.waist_width_front;
    direction = 1;
  } else {
    additional_length = mea.bottom_width_back - mea.waist_width_back;
    direction = -1;
  }

  let vec = waist.p1.add(new Vector(mea.waist_height, 0));
  //vec = vec.
}


export default {a_line, simple_dart_web, styleline_panel, styleline_merge, simple_waistline_web, double_dart_web, without_dart, split_pattern, simple_middle_dart, waistline_simple_dart, wiener_naht, merge_lines};
