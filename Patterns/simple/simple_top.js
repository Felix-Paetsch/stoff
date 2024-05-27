const { Vector, vec_angle_clockwise, rotation_fun } = require("../../Geometry/geometry.js");
const { Sketch } = require("../../StoffLib/sketch.js");
const { Point } = require("../../StoffLib/point.js");
const {ConnectedComponent} = require("../../StoffLib/connected_component.js");

const utils = require("../change/utils.js");

const {split} = require("./simple_split.js");

function without_dart(s){
  let lines_comp = s.data.comp.lines_by_key("type");

  // Linien raus suchen
  let darts = lines_comp.dart;
  darts = utils.sort_lines(s, darts);
  let side = lines_comp.side[0];
  let fold = lines_comp.fold[0];

  // Abmessungen
  let l = s.line_between_points(darts[0].p2, darts[1].p2);
  let len1 = l.get_length();
  //let len3 =
  let len4 = side.get_length();

  // Seitenlinie korrigieren
  let vec = darts[1].p2.subtract(side.p2).normalize().scale(len1).add(side.p2);
  side.p2.move_to(vec);
  vec = side.get_line_vector().normalize().scale(len4).add(side.p1);
  side.p2.move_to(vec);

  // neue Taillenlinie
  let line = s.line_between_points(side.p2, fold.p2);
  line.data.type = "waistline";

  // Abnaeher aus der Mitte entfernen
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

  pattern_i = utils.set_comp_to_new_sketch(s, comp_sorted[0]);
  pattern_o = utils.set_comp_to_new_sketch(s, comp_sorted[1]);


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

   let angle = vec_angle_clockwise(line_left.p2.subtract(line_left.p1), line_right.p2.subtract(line_left.p1));
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


module.exports = {without_dart, split_pattern, simple_middle_dart, waistline_simple_dart, wiener_naht, merge_lines};
