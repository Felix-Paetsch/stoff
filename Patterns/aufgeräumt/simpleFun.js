//import { debug, add_point, remove_point, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_line, intersection_points , merge_lines, point_on_line} from '../StoffLib/main.js';
import { Vector , vec_angle_clockwise, rotation_fun} from '../Geometry/geometry.js';
import { get_orth_line, get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, armpit, round_neckline, smooth_out} from './basicFun_new.js';
//import { dart_new, rotate_dart, tai_sho_dart, cut_line, rotate_point, scale_line, rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart} from './darts.js';
import { front, back, redraw_armpit} from './basicPattern3.js';
import { Point } from '../StoffLib/point.js';
import { Sketch } from '../StoffLib/sketch.js';


/*
// Felix
const measurements = {
  shoulder_length: 16, // A
  shoulder_width: 46, //B
  shoulder_w_point: 50, //C
  bust_width_front: 50 +3,// D
  bust_width_back: 45 +3, // c
  bust_point_width: 22, // E
  bust_point_height: 18,// F
  shoulderblade_width: 17,// g
  shoulderblade_height: 20,// h
  tai_width_front: 40,// G
  tai_width_back: 42 +3, // f
  tai_height: 26 * (2/3) +4,// e
  shoulder_height_front: 44, // H
  shoulder_height_back:48.5, // b
  center_height_front: 31, //I
  center_height_back: 44, //
  across_front: 37 * (15/16),  // J
  across_back: 36.5 * (15/16), // a
  side_height: 22, // K
  waist_width_front: 48 +4, // L
  waist_width_back:53 +4, // d

  arm: 35
}

fr = front(measurements, 0, 0);
//front(measurements, 0, 0)
ba = back(measurements, -measurements.bust_width_front/2 - measurements.bust_width_back/2 -2, 0);

//merge_sides(fr, ba);
//test(fr)
redraw_armpit(fr);
redraw_armpit(ba, 1);
//split_dart_to_side(fr, 0);
//split_dart_to_side(ba, 0);
//merge_sides(fr, ba)

//px = get_point_on_line_percent(fr.neckline, 0.8, true, -1);
px = get_point_on_line_percent(fr.shoulder, 0.5);
//close_first_split(
split_pattern_waist_dart(fr, px, "shoulder");

//remove_line(ba.side);

//py = get_point_on_line_percent(ba.shoulder, 0.2);
//split_pattern_waist_dart(ba, py, "shoulder")

*/



/*
// Ich will weinen -.-
function close_first_split(obj){
  let outer = obj.outer;
  let inner = obj.inner;
  outer.first = false;
  inner.first = false;

  let angle = vec_angle_clockwise(inner.dart_inner.get_line_vector(), outer.dart_outer.get_line_vector());
  let fun = rotation_fun(outer.dart_outer.p1, -angle);
  rotate_zsk(outer.dart_outer, fun);
  remove_point(outer.dart_outer.p2);
  remove_point(inner.dart_inner.p2);
  let line = line_between_points(inner.fold.p2, outer.side.p2);
  return line;

}*/

function rotate_zsk(ln, fun){
  let list = list_points_zhk(ln);
  let vec;
  list.forEach((elem) => {
    vec = fun(elem);
    elem.moveTo(vec.x, vec.y);
  });
  return ln;
}



function get_point_on_line_percent(s, ln, percent, kurve =false, r = 1){
  if (percent <= 0.04){
    return ln.p1;
  } else if (percent >= 0.96){
    return ln.p2;
  }
  if (kurve){
    let vec = ln.p2.subtract(ln.p1);
    let len = vec.length();
    let vec2 = vec.get_orthogonal().scale(r);
    vec = vec.normalize().scale(len * percent).add(ln.p1);
    const p1 = s.add_point(new Point(vec.x, vec.y));
    vec2 = vec2.add(p1);
    const p2 = s.add_point(new Point(vec2.x, vec2.y));
    let l = s.line_between_points(p1, p2);
    let points = s.intersection_points(l, ln);
    s.remove_point(p1);
    s.remove_point(p2);
    return s.add_point(points[0]);
  } else {
    let vec = ln.get_line_vector().normalize().scale(ln.get_length() * percent).add(ln.p1);
    return s.add_point(new Point(vec.x, vec.y));
  }
};



function merge_sides(s){
  //console.log(s)
    vec = s.data.front.side.p1.subtract(s.data.back.side.p1);
    reposition_zhk(s.data.back.side, vec);
    reposition_pt(s.data.back.p5, vec);
    reposition_pt(s.data.back.p6, vec);
  //  back.armpit.set_endpoints(back.armpit.p1, front.side.p1);
  //  back.waist_outer.set_endpoints(back.waist_outer.p2, front.side.p2);
  //  remove_point(back.side.p1);
  //  remove_point(back.side.p2);
    //remove_line(front.side);
  //  back.side = front.side;
  return s;//front, back;
};

function reposition_pt(pt, vec){
  let temp = pt.add(vec);
  pt.moveTo(temp.x, temp.y);
  return pt;
}



// repositions a whole line
function reposition_line(ln, vec){
  let temp = ln.p1.add(vec);
  ln.p1.moveTo(temp.x, temp.y);
  temp = ln.p2.add(vec);
  ln.p2.moveTo(temp.x, temp.y);
};

function reposition_zhk(ln, vec){
  let list = list_points_zhk(ln);
  list.forEach((p) => {
    let pos_v = vec.add(p);
    p.moveTo(pos_v.x, pos_v.y)
  });
};


function list_points_zhk(ln){
  let vorhanden = [ln.p1];
  let suchend = [ln.p2];
  let lines;

  while (suchend.length > 0){
    elem = suchend.pop();
    lines = elem.get_adjacent_lines();
    lines.forEach((ln) => {
      if(!vorhanden.includes(ln.p1)){
        vorhanden.push(ln.p1);
        if(!suchend.includes(ln.p1)){
          suchend.push(ln.p1);
        }
      }
      if(!vorhanden.includes(ln.p2)){
        vorhanden.push(ln.p2);
        if(!suchend.includes(ln.p2)){
          suchend.push(ln.p2);
        }
      }
    });
  }
  return vorhanden;
}


function split_dart_to_side_new(s, pattern, percent){
  l = s.line_between_points(pattern.dart_inner.p2, pattern.dart_outer.p2);

  len1 = l.get_length() * percent;
  len2 = l.get_length() - len1;
  len3 = pattern.dart_inner.get_length();
  len4 = pattern.side.get_length();

  vec = l.p1.add(l.get_line_vector().normalize().scale(len1));
  p = s.add_point(new Point(vec.x, vec.y));
  vec = p.subtract(pattern.dart_inner.p1).normalize().scale(len3).add(pattern.dart_inner.p1);
  p2 = s.add_point(new Point(vec.x, vec.y));
  s.remove_point(p);
  s.remove_line(l);
  pattern.dart_outer.p2.moveTo(p2.x, p2.y);
  s.remove_point(p2);
  vec = pattern.dart_outer.p2.subtract(pattern.side.p2).normalize().scale(len2).add(pattern.side.p2);
  pattern.side.p2.moveTo(vec.x, vec.y);
  vec = pattern.side.get_line_vector().normalize().scale(len4).add(pattern.side.p1);
  pattern.side.p2.moveTo(vec.x, vec.y);
}


function extend_shoulder(line, addition){

  vec = line.get_line_vector().normalize().scale(addition).add(line.p2);
  line.p2.moveTo(vec.x, vec.y);
}



function armpit_new(s, pattern, r = -1){
  let ln1 = pattern.shoulder;
  let a = pattern.shoulder.p2;
  let p1 = pattern.p5;
  let p2 = pattern.p6;
  let b = pattern.side.p1;
  let ln2 = pattern.side;


  let len = a.distance(p1);
  let vec = ln1.get_line_vector().get_orthonormal().scale(len * r).add(a);
  let h1 = s.add_point(new Point(vec.x, vec.y));
  let l1 = s.line_between_points(a, h1);
  let l2 = line_with_length(s, p1, len, 180);

  let test1 = s.interpolate_lines(l1, l2, 2);
  s.remove_point(h1);
  s.remove_point(l2.p2);

  len = p1.distance(p2);
  //p2.set_color("green")
  //console.log(len);
  l1 = line_with_length(s, p1, len, 0);
  l2 = line_with_length(s, p2, len, 90 *r);

  let test2 = s.interpolate_lines(l1, l2,2);
  s.remove_point(l1.p2);
  s.remove_point(l2.p2);

  let test3 = s.interpolate_lines(test1, test2, 0, (x) => Math.sqrt(x, 2));
  s.remove_point(p1);
  l1 = s.line_between_points(p2, b);
  let test4 = s.merge_lines(test3, l1);
  s.remove_point(p2);
  pattern.armpit = test4;
  return test4.set_color("black");
}

function calculate_type(design){
  let type = 0;
  type = (design.side?1:0) + (design.shoulder? 2:0) + (design.armpit? 4:0) + (design.waistline? 8:0) +
    (design.neckline ?16:0) + (design.fold?32:0);
  console.log(type)
  return type;
}


function rotate_dart(s, pattern, design, percent, percent2, r = 1, armpit_true = false){

  const options = {
    "armpit": {
      line: pattern.armpit,
      curve: true,
      direction: 1 *r,
      split_direction: false,
      split_direction_edge: true,
      turn_rate: true
    },
    "neckline": {
      line: pattern.neckline,
      curve: true,
      direction: -1 * r,
      split_direction: true,
      split_direction_edge: false,
      turn_rate: true
    },
    "shoulder": {
      line: pattern.shoulder,
      curve: false,
      direction: 1,
      split_direction: false,
      split_direction_edge: false,
      turn_rate:false

    },
    "fold": {
      line: pattern.fold,
      curve: false,
      direction: 1,
      split_direction: true,
      split_direction_edge: false,
      turn_rate: true

    },
    "side": {
      line: pattern.side,
      curve: false,
      direction: 1,
      split_direction: false,
      split_direction_edge: false,
      turn_rate:false
    },
    "waistline": {
      line: pattern.loose_end,
      percent: percent2,
      curve: false,
      direction: 1,
      split_direction: true,
      split_direction_edge: false,
      turn_rate:false

    }
  };



  let option;
  if (percent == 0){
    return s;
  }

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
  }else if (design["neckline"]){
    option = options["neckline"];
    design["neckline"] = false;

  } else {
    design.no_other_designs = true;
    return design;
  }




  option.percent = percent2;
  const loose_end1 = option.line.p1;
  const loose_end2 = option.line.p2;
  let split_obj = split(s, option, pattern);
  //reposition_zhk(pattern.dart_outer, new Vector(5, 25));
  let angle = vec_angle_clockwise(pattern.dart_inner.get_line_vector(), pattern.dart_outer.get_line_vector());
  //console.log(-angle);
  let fun;
  let fun_reverse;
  if(design["side hidden dart"]){
    fun = rotation_fun(pattern.dart_outer.p1, -angle);
    fun_reverse = rotation_fun(pattern.dart_outer.p1, angle);
  } else {
    fun = rotation_fun(pattern.dart_outer.p1, -angle * percent);
    fun_reverse = rotation_fun(pattern.dart_outer.p1, angle * percent);
  }
  //if (option == options["waistline"] ){}
  let rotation_direction = (option == options["waistline"] ||(design.reverse_arm && option == options["armpit"]) || (design.reverse_neck && option == options["neckline"]));
  if (r == -1){
    rotation_direction = !rotation_direction;
  }
  if (rotation_direction){
    rotate_zsk(pattern.dart_outer, fun_reverse);
    rotate_zsk(pattern.dart_inner, fun_reverse);
    rotate_zsk(design.inner_point.get_adjacent_lines()[0], fun);

  } else {
    rotate_zsk(pattern.dart_outer, fun);
    rotate_zsk(pattern.dart_inner, fun);
    rotate_zsk(design.inner_point.get_adjacent_lines()[0], fun_reverse);
  }

  if (percent == 1){
    let temp = split_obj.line_outer.p2;
    split_obj.line_outer.set_endpoints(split_obj.line_outer.p1, split_obj.line_inner.p2);
    s.remove_point(temp);
    s.remove_point(pattern.dart_outer.p2);
    s.remove_point(pattern.dart_inner.p2);

    pattern.loose_end = s.line_between_points(pattern.loose_end1, pattern.loose_end2);

    pattern.dart_inner = split_obj.line_inner.swap_orientation();
    pattern.dart_outer = split_obj.line_outer.swap_orientation();
    pattern.loose_end1 = loose_end1;
    pattern.loose_end2 = loose_end2;
  } else {
    pattern.dart_inner2 = split_obj.line_inner;
    pattern.dart_outer2 = split_obj.line_outer;
  }
  if(option == options["waistline"]){
    pattern.side = pattern.loose_end;
    let l = s.line_between_points(pattern.fold.p2, pattern.side.p2);
    correct_waistline(s, l, pattern.dart_inner, pattern.dart_outer);
  }
  return design;

}

/*
function rotate_waistline(s, pattern, design, percent, percent2){
  option = {
    line: pattern.waistline,
    percent: percent2,
    curve: false,
    direction: 1,
    split_direction: false,
    split_direction_edge: false,
  };
  let p1 = pattern.waistline.p1;
  let p2 = pattern.waistline.p2;
  pattern.dart_inner.swap_orientation();
  pattern.dart_outer.swap_orientation();

  split_obj = split(s, option, pattern);
  let angle = vec_angle_clockwise(pattern.dart_inner.get_line_vector(), pattern.dart_outer.get_line_vector());

  let fun;
  if(design["side hidden dart"]){
    fun = rotation_fun(pattern.dart_outer.p1, angle);
  } else {
    fun = rotation_fun(pattern.dart_outer.p1, angle * percent);
  }
  rotate_zsk(pattern.dart_inner, fun);
  let line = s.line_between_points(p1, p2);
//console.log(split_obj.line_outer.swap_orientation().p2.set_color("blue"));
/*
  correct_waistline(s, line, split_obj.line_inner.swap_orientation(), split_obj.line_outer.swap_orientation());

  if (percent == 1){
    let temp = split_obj.line_outer.p1;
    split_obj.line_outer.set_endpoints(split_obj.line_inner.p1, split_obj.line_outer.p2);
    s.remove_point(temp);
    s.remove_point(pattern.dart_outer.p2);
    s.remove_point(pattern.dart_inner.p2);
    pattern.waistline = s.line_between_points(pattern.neckline.p1, pattern.armpit.p1);
    pattern.dart_inner = split_obj.line_inner;
    pattern.dart_outer = split_obj.line_outer;
  }

  return design;
}

*/
function correct_waistline(s, ln, l1, l2){
  let vec = l1.get_line_vector().add(l1.p2);
  l1.p2.moveTo(vec.x, vec.y);

  let pt = s.intersection_points(ln, l1);
  //let pt2 = s.intersection_points(ln, l2);
  l1.p2.moveTo(pt[0].x, pt[0].y);
  let len = l1.get_length();

  vec = l2.get_line_vector().normalize().scale(len).add(l2.p1);

  l2.p2.moveTo(vec.x, vec.y);

  s.remove_line(ln);
}

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

function dublicate_line(s, ln){
  let p1 = s.add_point(ln.p1.copy());
  let p2 = s.add_point(ln.p2.copy());
  return s.copy_line(ln, p1, p2);
}





export default {merge_sides, split_dart_to_side_new, extend_shoulder, armpit_new, rotate_dart, split_whole};
//save.svg(`out.svg`, 500, 500);
