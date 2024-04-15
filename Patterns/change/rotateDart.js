





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
