const { Vector, vec_angle_clockwise, rotation_fun } = require("../../Geometry/geometry.js");
const { Sketch } = require("../../StoffLib/sketch.js");
const { Point } = require("../../StoffLib/point.js");

const utils = require("./utils.js");
const evaluate = require("../evaluation/basicEval.js");



function split_whole(s, design){

  const options = {
    "armpit": {
      line: s.data.front.armpit,
      percent: design["percent of line"],
      curve: true,
      direction: 1,
      split_direction: false,
      split_direction_edge: true
    },
    "neckline": {
      line: s.data.front.neckline,
      percent: design["percent of line"],
      curve: true,
      direction: -1,
      split_direction: true,
      split_direction_edge: false
    },
    "shoulder": {
      line: s.data.front.shoulder,
      percent: design["percent of line"],
      curve: false,
      direction: 1,
      split_direction: false,
      split_direction_edge: false,
    }
  };

  let option;

  if(design["split front"]){
    if(design["armpit"]){
      option = options["armpit"];
    } else if(design["neckline"]){
      option = options["neckline"];
    } else {
      option = options["shoulder"];
      if (option.percent == 1){
        option.split_direction_edge = !option.split_direction_edge;
      }
    }
    if (option.percent < 1 && option.percent > 0){
      split(s, option, s.data.front);
      reposition_zhk(s.data.front.dart_outer, new Vector(5, 25));

    } else {
      split_edge(s, option, s.data.front);
      reposition_zhk(s.data.front.dart_outer, new Vector(5, 25));

    }
  }


  if(design["split back"]){
    if(design["armpit back"]){
      option = options["armpit"];
      option.line = s.data.back.armpit;
      option.direction = -1;
      if (design["armpit"] && design["percent of line back"] == 1 && design["percent of line"] > 0){
        option.split_direction_edge = !option.split_direction_edge;
      }
    } else if(design["neckline back"]){
      option = options["neckline"];
      option.direction = 1;
      option.line = s.data.back.neckline;
    } else {
      option = options["shoulder"];
      option.line = s.data.back.shoulder;
    }

    option.percent = design["percent of line back"];
    if (option.percent == 1){
      option.split_direction_edge = !option.split_direction_edge;
    }

    if (option.percent < 1 && option.percent > 0){
      split(s, option, s.data.back);
      reposition_zhk(s.data.back.dart_outer, new Vector(5, 25));

    } else {
      split_edge(s, option, s.data.back);
      reposition_zhk(s.data.back.dart_outer, new Vector(5, 25));

    }
  }

  if(!design["split front"] && !design["split back"]){
    console.log("Vorsicht! Es wird eine Naht benötigt, da beide Seiten (vorn und hinten) "+
          "noch gespiegelt werden müssen!");
  }
  return s;
}

function check_split(design){
  let eval_type = evaluate.evaluate_type(design);
  let eval_percent = evaluate.evaluate_percent(design);
  if (eval_type.length() <= 1){
    design["split percent of dart"] = 1;
    eval_percent.percent = 1;
  }
  return design;
}

function split_merge(s, design){
  options, options_back = evaluate.evaluate_type_merge(design);
  let pt = get_point_on_line_percent(s, s.data.front, options[0], design["percent of line"]);
  let pt2 = get_point_on_line_percent(s, s.data.back, options_back[0], design["percent of line back"]);

  // hier noch reposition waistline - das fehlt noch in der Abfrage der Internetseite
  let line = utils.get_lines(s.data.front.comp, options[0]);
  split_whole_new(s, s.data.front, design["percent of line"], pt, line);

  line = utils.get_lines(s.data.back.comp, options_back[0]);
  split_whole_new(s, s.data.back, design["percent of line back"], pt2, line);

  return s;
}

function split_without_merge(){
  design = check_split(design);
  let eval_type = evaluate.evaluate_type(design);
  let eval_percent = evaluate.evaluate_percent(design);

  let pt = get_point_on_line_percent(s, pattern, eval_type[0], eval_percent.first);

// Todo!!!

}

function reposition_waistline(s, pattern, percent){
  let pt = get_point_on_line_percent(s, pattern, "shoulder", 0.5);
  let line = utils.get_lines(pattern.comp, "shoulder");

  let line_segments = split_on_line(s, pt, line);
  pattern = split_line(s, pattern, line_segments);

  let dart_lines = renummerate_lineparts(pattern, "dart");
  const angle = vec_angle_clockwise(dart_lines[0].p2, dart_lines[1].p2):
  const fun = rotation_fun(dart_lines[0].p1, -angle);
  pattern.comp2.transform(fun);

  let dart_lines2 = renummerate_lineparts(pattern, "dart2");
  dart_lines2[1].set_endpoints(dart_lines2[0].p1, dartlines2[1].p2);
  let waist_lines = renummerate_lineparts(pattern, "waistline");
  let waistline = s.line_between_points(waist_lines[0].p1, waist_lines[1].p2);
  waistline.data.type = "waistline";
  s.remove_point(dart_lines[1].p1);
  s.remove_point(waist_lines[0].p2);
  s.remove_point(waist_lines[1].p1);

  dart_lines2[0].data.type = "dart";
  dart_lines2[1].data.type = "dart";

  // jetzt ist die Seite unten geschlossen und es wurde nach oben rotiert

  pt = get_point_on_line_percent(s, pattern, "waistline", percent);

  pattern = split_whole(s, pattern, percent, pt, waistline);

  fun = rotation_fun(dart_lines[0].p1, angle);
  pattern.comp2.transform(fun);

  dart_lines = renummerate_lineparts(pattern, "dart");
  dart_lines2 = renummerate_lineparts(pattern, "dart2");
  dart_lines2[1].set_endpoints(dart_lines2[0].p1, dart_lines2[1].p2);
  let neck_lines = renummerate_lineparts(pattern, "neckline");
  let neckline = s.line_between_points(neck_lines[0].p1, neck_lines[1].p2);
  neckline.data.type = "neckline";
  s.remove_point(dart_lines[1].p1);
  s.remove_point(neck_lines[0].p2);
  s.remove_point(neck_lines[1].p1);

  dart_lines2[0].data.type = "dart";
  dart_lines2[1].data.type = "dart";

  pattern.comp = dart_lines2[0].connected_component();

  return pattern;

}

function split_whole_new(s, pattern, eval_percent, pt, line){
  // aktuell wird in der Funktion die erste Linie genommen, die es gibt
  let lines;
  if (eval_percent < 0.04 || eval_percent > 0.96){
    lines = split_on_edge(pattern, pt);
  } else {
  //  let line = get_lines(pattern.comp, eval_type[0])[0];
    lines = split_on_line(s, pt, line);
  }
  return split_line(s, pattern, lines);

}

function split_on_line(s, pt, line){
  let temp = s.point_on_line(pt, line);
  renummerate_lineparts(pattern, temp.line_segments[0].data.type);
  return temp.line_segments;
}

// geht davon aus, dass wir nur zwei Linien von dem Punkt abgehen haben
function split_on_edge(pattern, pt){
  let lines = pt.get_adjacent_lines();
  lines.forEach(elem => {
    elem.data.distance = elem.p2.subtract(pt).get_length();
  });
  lines.sort((a, b) => a.data.distance - b.data.distance);
  return lines;
}


// wie kann ich bestimmen, auf welchen Teil der Linie der Punkt soll?
function split_line(s, pattern, line_segments){


  let pt2 = s.add_point(pt.copy());
  line_segments[0].set_endpoints(line_segments[0].p1, pt2);
  let outer = utils.get_outer_line(pattern, line_segments);

  let outer_dart = utils.get_outer_line(pattern, "dart");
  let p2 = s.add_point(outer_dart.p1.copy());

  let l1;
  let l2;

  if (outer === line_segments[0]){
    l1 = s.line_between_points(outer_dart.p1, outer.p2);
    outer_dart.set_endpoints(p2, outer_dart.p2);
    l2 = s.line_between_points(p2, line_segments[1].p1);

  } else {
    l1 = s.line_between_points(outer_dart.p1, outer.p1);
    outer_dart.set_endpoints(p2, outer_dart.p2);
    l2 = s.line_between_points(p2, line_segments[0].p2);
  }
  l1.data.type = "dart2";
  l2.data.type = "dart2";

  pattern.data.comp = l1.connected_component();
  pattern.data.comp2 = l2.connected_component();

  return pattern;

}


function rotate_dart_new(s, comp, design, percent){
  let option;

  if (design["waistline"]){
    option = options["waistline"];
    design["waistline"] = false;
  } else  if (design["side"]){
    option = options["side"];
    design["side"] = false;
  } else if (design["shoulder"]){
    option = options["shoulder"];
    design["shoulder"] = false;
    design.reverse_arm = true;
  } else if (design["fold"]){
    option = options["fold"]
    design["fold"] = false;
    design.reverse_arm = true;
    design.reverse_neck = true;
  } else if (design["armpit"]){
    option = options["armpit"];
    design["armpit"] = false;
    //pattern.copy_armpit = dublicate_line(s, pattern.armpit);
    if (design["neckline"] && armpit_true){
      rotate_dart(s, pattern, design, 1, design["second split percent of line"])
      return design;
    }

}


function split(s, obj, pattern){
  let p1 = pattern.dart_outer.p1;
  let p2 = s.add_point(p1.copy());
  if (obj.split_direction){
    pattern.dart_inner.set_endpoints(p2, pattern.dart_inner.p2);
  } else {
    pattern.dart_outer.set_endpoints(p2, pattern.dart_outer.p2);
  }

  let pt = get_point_on_line_percent(s, obj.line, obj.percent, obj.curve, obj.direction);
  let pt2 = s.add_point(pt.copy());
  let l = s.line_between_points(pt, p1);
  let l2 = s.line_between_points(pt2, p2);

  let temp = s.point_on_line(pt, obj.line);
  temp.line_segments[1].set_endpoints(pt2, temp.line_segments[1].p2);
  //let vec = b
  //reposition_zhk(pattern.dart_outer, new Vector(5, 25));

  if (obj.split_direction){
    return {
      s,
      line_outer: l2,
      line_inner: l
    };
  };


  return {
    s,
    line_outer: l,
    line_inner: l2
  };
  /*
*/
}


function split_edge(s, obj, pattern){
  let pt;
  if (obj.percent == 0){
    pt = obj.line.p1;
  } else {
    pt = obj.line.p2;
  }

  let p1 = pattern.dart_outer.p1;
  let p2 = s.add_point(p1.copy());
  let lines = pt.get_adjacent_lines();
  if (obj.split_direction_edge){
    pattern.dart_inner.set_endpoints(p2, pattern.dart_inner.p2);
  } else {
    pattern.dart_outer.set_endpoints(p2, pattern.dart_outer.p2);
  }

  let pt2 = s.add_point(pt.copy());
  let l = s.line_between_points(pt, p1);
  let l2 = s.line_between_points(pt2, p2);
  if (lines[0].p1 == pt){
    lines[0].set_endpoints(pt2, lines[0].p2);
  } else {
    lines[0].set_endpoints(lines[0].p1, pt2);
  }
  //let vec = b
  //reposition_zhk(pattern.dart_outer, new Vector(5, 25));
  return s;
}
