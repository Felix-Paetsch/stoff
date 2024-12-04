
import { Vector, vec_angle, rotation_fun , deg_to_rad} from '../StoffLib/geometry.js';
import { Sketch } from '../StoffLib/sketch.js';
import { Point } from '../StoffLib/point.js';
import { ConnectedComponent} from '../StoffLib/connected_component.js';

import { spline } from "../StoffLib/curves.js";


// front is boolean
function main(config, front){
  const s = new Sketch();

    simple_top(s);

    main_neck(s, config["neckline"].type);



    if (config["top designs"].type === "double dart" || config["top designs"].type === "single dart"){
      main_dart(s, config["top designs"].position, config["top designs"].type);
      if (config["top designs"].dartstyle === "tuck" && s.lines_by_key("type").dart){
        tuck(s);
      }
    } else if (config["top designs"].type === "added fullness"){
      fullness(s);
    }

    length(s, config["top designs"].length);

    if (config["top designs"].type === "styleline"){
      main_styleline(s, config["top designs"].styleline);
      ease_simple(s, config["top designs"].ease, true);
    } else {
      ease_simple(s, config["top designs"].ease);
    }


    main_sleeve(s, config["sleeve"]);

  return s;
};


function simple_top(s){
  let p1 = s.add_point(-0.5,0);
  p1.data.type = "neck";
  p1.data.side = "left";
  let p2 = s.add_point(-4, 1);
  p2.data.type = "shoulder";
  p2.data.side = "left";
  let p3 = s.add_point(4.5,0);
  p3.data.type = "neck";
  p3.data.side = "right";
  let p4 = s.add_point(8, 1);
  p4.data.type = "shoulder";
  p4.data.side = "right";


  let ln1 = s.line_between_points(p1, p2);
  let ln2 = s.line_between_points(p3, p4);
  ln1.data.type = "shoulder";
  ln1.data.side = "left";
  ln2.data.type = "shoulder";
  ln2.data.side = "right";


  let p5 = s.add_point(-4.5,6.5);
  p5.data.type = "armpit";
  p5.data.side = "left";
  let p6 = s.add_point(8.5, 6.5);
  p6.data.type = "armpit";
  p6.data.side = "right";

  let p_h = s.add_point(-3.5,6);


  let ln1_h = s.line_between_points(p2, p_h);
  let ln2_h = s.line_between_points(p_h, p5);
  let temp = s.interpolate_lines(ln1_h, ln2_h);
  s.remove(p_h);

  temp.data.type = "armpit";
  temp.data.side = "left";


  let ln3 = s.copy_line(temp, p4, p6);
  ln3.mirror();
  ln3.data.side = "right";


  let p7 = s.add_point(-5, 17);
  p7.data.type = "bottom";
  p7.data.side = "left";

  p_h = s.add_point(-4, 11.5);
  ln1_h = s.line_between_points(p5, p_h);
  ln2_h = s.line_between_points(p_h, p7);
  //temp = s.interpolate_lines(ln1_h, ln2_h);

  let p5_h = s.add_point(-4.5,7);
  let p7_h = s.add_point(-5, 16.5);



  let curve = s.line_from_function_graph(p5, p7, spline.catmull_rom_spline(
    [p5, p5_h, p_h, p7_h, p7]
  ));

  s.remove(p_h, p5_h, p7_h);
  curve.data.type = "side";
  curve.data.side = "left";


  let p8 = s.add_point(9, 17);
  p8.data.type = "bottom";
  p8.data.side = "right";

  let ln4 = s.copy_line(curve, p6, p8).mirror();
  ln4.data.side = "right";


  p_h = s.add_point(2, 18);
  ln1_h = s.line_between_points(p7, p_h);
  ln2_h = s.line_between_points(p_h, p8);

  temp = s.interpolate_lines(ln1_h, ln2_h);
  s.remove(p_h);

  temp.data.type = "bottom";

  return s;
}

// check if front & back has shorter length of shoulder
function main_neck(s, type, front = true){
  let neck = s.points_by_key("type").neck;

  let vec = neck[0].subtract(neck[1]).scale(0.5).add(neck[1]);
  let p_h;
  let p2_h;
  let ln1;
  let ln2;
  let temp;

  switch (type) {
    case "round":
      if (front){
        vec.y = vec.y + 3;
      } else{
        vec.y = vec.y + 1;
      }
      p_h = s.add_point(vec);

      ln1 = s.line_between_points(neck[0], p_h);
      ln2 = s.line_between_points(p_h, neck[1]);
      temp = s.interpolate_lines(ln1, ln2);
      s.remove(p_h);
      temp.data.type = "neckline";

      break;
    case "round wide":
      widen_neck(s);

      if (front){
        vec.y = vec.y + 4;
      } else{
        vec.y = vec.y + 1;
      }
      p_h = s.add_point(vec);

      ln1 = s.line_between_points(neck[0], p_h);
      ln2 = s.line_between_points(p_h, neck[1]);
      temp = s.interpolate_lines(ln1, ln2);
      s.remove(p_h);
      temp.data.type = "neckline";

      break;
    case "V-Line":
      if (front){
        vec.y = vec.y + 3;
      } else{
        vec.y = vec.y + 1;
      }
      p_h = s.add_point(vec);
      p2_h = s.add_point(p_h.x -0.7, p_h.y);
      v_line(s, neck[0], p_h, neck[1], p2_h);
      break;
    case "V-Line deep":
      if (front){
        vec.y = vec.y + 5;
      } else{
        vec.y = vec.y + 1;
      }
      p_h = s.add_point(vec);
      p2_h = s.add_point(p_h.x -1, p_h.y);
      v_line(s, neck[0], p_h, neck[1], p2_h);
      break;
    case "V-Line wide":
      widen_neck(s);

      if (front){
        vec.y = vec.y + 2.5;
      } else{
        vec.y = vec.y + 1;
      }
      p_h = s.add_point(vec);
      p2_h = s.add_point(p_h.x -2, p_h.y - 0.5);

      v_line(s, neck[0], p_h, neck[1], p2_h);
      break;
    case "square":

      if(neck[0].data.side === "right"){
        neck.reverse();
      }

      let y;
      if (front){
        y = 2.5;
      } else {
        y = 1;
      }
      let p1 = s.add_point(neck[0].x + 0.5, y);
      let p2 = s.add_point(neck[1].x - 0.5, y);

      let l1 = s.line_between_points(p1, p2);
      let l2 = s.line_between_points(p1, neck[0]);
      let l3 = s.line_between_points(p2, neck[1]);

      let ln = s.merge_lines(l1, l2, true);
      ln = s.merge_lines(ln, l3, true);
      ln.data.type = "neckline";



      break;
    case "boat":
      widen_neck(s);

      if (front){
        vec.y = vec.y + 2;
      } else{
        vec.y = vec.y + 1;
      }
      p_h = s.add_point(vec);

      ln1 = s.line_between_points(neck[0], p_h);
      ln2 = s.line_between_points(p_h, neck[1]);
      temp = s.interpolate_lines(ln1, ln2);
      s.remove(p_h);

      temp.data.type = "neckline";
      break;
    default:

  }
}

function v_line(s, p1, p2, p3, p_h){

  let ln1 = s.line_between_points(p1, p_h);
  let ln2 = s.line_between_points(p_h, p2);
  let temp = s.interpolate_lines(ln1, ln2);
  s.remove(p_h);
  let ln = s.copy_line(temp, p3, p2).mirror();
  ln = s.merge_lines(ln, temp, true);
  ln.data.type = "neckline";
};

function widen_neck(s){
  let neck = s.points_by_key("type").neck;

  let ln = neck[0].get_adjacent_lines()[0];
  let vec = ln.get_line_vector().scale(0.3);
  neck[0].move_to(vec.add(neck[0]));

  ln = neck[1].get_adjacent_lines()[0];
  vec = ln.get_line_vector().scale(0.3);
  neck[1].move_to(vec.add(neck[1]));

  return s;
};



function main_dart(s, type, type_top){

  if (type_top === "double dart"){
    if (type === "waistline and side middle"){
      main_dart(s, "waistline");
      type = "side middle";
    } else if (type === "waistline and french"){
      main_dart(s, "waistline");
      type = "french";
    } else if (type === "waistline and shoulder"){
      main_dart(s, "waistline");
      type = "shoulder";
    } else if (type === "side middle and shoulder"){
      s = main_dart(s, "side middle");

      type = "shoulder";
    } else if (type === "french and shoulder"){
      main_dart(s, "french");
      type = "shoulder";
    }
  }


  let lines = s.lines_by_key("type");
  let sides = lines.side;
  let p1;
  let p2;
  let p1_l;
  let p2_l;
  let ln;
  switch (type) {
    case "waistline":
      p1 = s.add_point(new Vector(-0.25, 8.75));
      p1_l = s.add_point(p1.subtract(new Vector(0, -5)));

      p2 = s.add_point(new Vector(4.25, 8.75));
      p2_l = s.add_point(p2.subtract(new Vector(0, -5)));
      s.data.waistline = true;
      ln = s.line_between_points(p1, p1_l);
      ln.data.type = "dart";
      ln.data.side = "left";
      ln.data.type2 = "waistline";

      ln = s.line_between_points(p2, p2_l);
      ln.data.type = "dart";
      ln.data.side = "right";
      ln.data.type2 = "waistline";
      return;
      break;
    case "side middle":
      p1 = s.add_point(sides[0].position_at_length(sides[0].get_length() * 0.15));
      //s.point_on_line(p1, sides[0]);

      p2 = s.add_point(sides[1].position_at_length(sides[1].get_length() * 0.15));
      //s.point_on_line(p2, sides[1]);

      p1_l = s.add_point(p1.subtract(new Vector(-3, 0.25)));
      p2_l = s.add_point(p2.subtract(new Vector(3, 0.25)));

      s.data.side_dart = true;
      s.data.temp = true;
      break;
    case "french":
      p1 = s.add_point(sides[0].position_at_length(sides[0].get_length() * 0.45));
      p1_l = s.add_point(p1.subtract(new Vector(-3, 2.75)));

      p2 = s.add_point(sides[1].position_at_length(sides[1].get_length() * 0.45));
      p2_l = s.add_point(p2.subtract(new Vector(3, 2.75)));

      s.data.side_dart = true;
      s.data.temp = true;


      break;
    case "shoulder":
      let shoulders = lines.shoulder;
      p1 = s.add_point(shoulders[0].position_at_length(shoulders[0].get_length() * 0.5));
      p1_l = s.add_point(p1.subtract(new Vector(-1.5, -6.25)));

      p2 = s.add_point(shoulders[1].position_at_length(shoulders[1].get_length() * 0.5));
      p2_l = s.add_point(p2.subtract(new Vector(1.5, -6.25)));

      break;
    default:
      return s;

  }
  ln = s.line_between_points(p1, p1_l);
  ln.data.type = "dart";
  ln.data.side = "left";
  ln.swap_orientation();
  if(s.data.temp){
    ln.data.side_dart = true;
  }

  ln = s.line_between_points(p2, p2_l);
  ln.data.type = "dart";
  ln.data.side = "right";
  ln.swap_orientation();
  if(s.data.temp){
    ln.data.side_dart = true;
  }
  delete s.data.temp;
  return s;
}

function length(s, len){
  if (len === 1){
    return;
  }

  let lines = s.lines_by_key("type");
  let sides = lines.side;
  let points = [];

  let p_h = s.add_point(-4, 11.5);
  let len2 = sides[0].p1.subtract(p_h).length();
  len = len * (sides[0].get_length() - len2);

  let p;
  sides.forEach((ln) => {
    points.push(s.add_point(ln.position_at_length(len + len2)));
  });

  let ln = lines.bottom[0];
  s.point_on_line(points[0], sides[0]);
  s.point_on_line(points[1], sides[1]);


  let ln2 = s.copy_line(ln, points[0], points[1]);

  s.remove(p_h);
  points = ln.get_endpoints();
  s.remove_points(points[0], points[1]);


  if(lines.dart){
    let darts = lines.dart;

    darts = darts.filter(elem => (
      elem.data.type2
    ));

    darts.forEach((elem) => {
      p = s.intersection_positions(elem, ln2);
      if (p[0]){
        elem.p2.move_to(p[0]);
      }
    });
  }
  /*
  */

}

function main_styleline(s, type){
  let lines = s.lines_by_key("type");
  let sides = lines.side;
  let bottom = lines.bottom[0];
  let p1;
  let p2;

  let p1_b = s.add_point(s.position_at_length(bottom, 0.25*bottom.get_length()));
  let p2_b = s.add_point(s.position_at_length(bottom, 0.25*bottom.get_length(), true));
  let p1_t;
  let p2_t;
  if (type === "classic princess"){
    p1 = s.add_point(-1, 7);
    p2 = s.add_point(5, 7);
    let shoulder = lines.shoulder;
    p1_t =  s.add_point(s.position_at_length(shoulder[0], 0.5*shoulder[0].get_length()));
    p2_t =  s.add_point(s.position_at_length(shoulder[1], 0.5*shoulder[1].get_length()));
  } else {
    p1 = s.add_point(-1.7, 7);
    p2 = s.add_point(5.7, 7);
    let armpit = lines.armpit;
    p1_t =  s.add_point(s.position_at_length(armpit[0], 0.625*armpit[0].get_length()));
    p2_t =  s.add_point(s.position_at_length(armpit[1], 0.625*armpit[1].get_length()));
  }
  //let temp1 = s.line_between_points(p1_t, p1);
  //let temp2 = s.line_between_points(p1, p1_b);
  //let ln = s.interpolate_lines(temp1, temp2);

  let curve1 = s.line_from_function_graph(p1_t, p1_b, spline.catmull_rom_spline(
    [p1_t, p1, p1_b]
  ));
  curve1.data.type = "styleline";

  let curve2 = s.line_from_function_graph(p2_t, p2_b, spline.catmull_rom_spline(
    [p2_t, p2, p2_b]
  ));
  curve2.data.type = "styleline";

  s.remove(p1, p2);

  if (type === "panel shoulder"){
    main_dart(s, "shoulder");
  } else if (type === "panel side"){
    main_dart(s, "side middle");
    let darts = s.lines_by_key("type").dart;
    let vec = s.intersection_positions(darts[0], curve1)[0];
    darts[0].p2.move_to(vec);
    vec = s.intersection_positions(darts[1], curve2)[0];
    darts[1].p2.move_to(vec);
  }
}

function fullness(s){

  let lines = s.lines_by_key("type");
  let sides = lines.side;
  let bottom = lines.bottom[0];

  let ln = s.line_between_points(sides[0].p1, sides[0].p2);
  let vec = bottom.get_tangent_vector(sides[0].p2);
  ln.p2.move_to(ln.p2.add(vec.scale(1.5)));
  ln.data = sides[0].data;

  ln = s.line_between_points(sides[1].p1, sides[1].p2);
  vec = bottom.get_tangent_vector(sides[1].p2);
  ln.p2.move_to(ln.p2.add(vec.scale(1.5)));
  ln.data = sides[1].data;

  s.remove_lines(sides[0], sides[1]);

}


function tuck(s){
  let lines = s.lines_by_key("type");
  let darts = lines.dart;
  let vec;
  darts.forEach((ln) => {
    vec = ln.get_line_vector().normalize();
    ln.p1.move_to(ln.p1.add(vec));
    tuck_symbol(s, ln);
  });

}


function tuck_symbol(s, ln){
  let vec = ln.get_line_vector().normalize();
  let vec_o = vec.get_orthonormal();

  let vec2 = vec_o.scale(0.4).add(vec.scale(0.15));
  let vec3 = vec_o.scale(0.5).add(vec.scale(-0.15));
  let p1 = s.add_point(vec2.add(ln.p1));
  let p2 = s.add_point(vec3.add(ln.p1));

  s.line_between_points(p1, ln.p1);
  s.line_between_points(p2, ln.p1);

  let fun = rotation_fun(ln.p1, deg_to_rad(-90));

  p1.move_to(fun(p1));
  p2.move_to(fun(p2));

}


function ease(s, addition, styleline){
  let lines = s.lines_by_key("type");
  let sides = lines.side;
  addition = addition / 20;
  let vec = new Vector(addition, addition*0.2);
  let vec2 = new Vector(addition, -addition*0.2);

  let p1 = s.add_point(sides[0].p1.copy());
  let p1_o = sides[0].p1;
  sides[0].set_endpoints(p1, sides[0].p2);

  let p2 = s.add_point(sides[1].p1.copy());
  let p2_o = sides[1].p1;
  sides[1].set_endpoints(p2, sides[1].p2);

  sides[1].get_endpoints().forEach((p) => {
      p.move_to(p.add(vec));
    });

  sides[0].get_endpoints().forEach((p) => {
      p.move_to(p.subtract(vec2));
    });

  let ln = s.line_between_points(p1_o, p1);
  s.merge_lines(lines.armpit[0], ln, true);
  ln = s.line_between_points(p2_o, p2);
  s.merge_lines(lines.armpit[1], ln, true);

  if(s.data.side_dart && !styleline){
    let darts = lines.dart;
    darts = darts.filter(ln => (
      ln.data.side_dart
    ));
    let temp_vec = darts[0].get_line_vector();
    darts[0].p2.move_to(darts[0].p2.add(temp_vec));
    temp_vec = s.intersection_positions(darts[0], sides[0]);
    darts[0].p2.move_to(temp_vec[0]);

    temp_vec = darts[1].get_line_vector();
    darts[1].p2.move_to(darts[1].p2.add(temp_vec));
    temp_vec = s.intersection_positions(darts[1], sides[1]);
    darts[1].p2.move_to(temp_vec[0]);
  } else if (styleline){
    let lns = lines.styleline;
    lns.forEach((ln) => {
      vec = ln.get_tangent_vector(ln.p2);
      ln.p2.move_to(ln.p2.add(vec.scale(2)));
      vec = s.intersection_positions(ln, lines.bottom[0]);
      ln.p2.move_to(vec[0]);
    });

  }



}


function ease_simple(s, addition, styleline){
  let lines = s.lines_by_key("type");
  let sides = lines.side;
  addition = addition / 80;
  let vec = new Vector(addition, -addition*0.5);
  let vec2 = new Vector(addition, addition*0.5);

  sides[0].get_endpoints().forEach((p) => {
    p.move_to(p.subtract(vec));
  });

  sides[1].get_endpoints().forEach((p) => {
    p.move_to(p.add(vec2));
  });
  if(s.data.side_dart && !styleline){
    let darts = lines.dart;
    darts = darts.filter(ln => (
      ln.data.side_dart
    ));
    let temp_vec = darts[0].get_line_vector();
    darts[0].p2.move_to(darts[0].p2.add(temp_vec));
    temp_vec = s.intersection_positions(darts[0], sides[0]);
    darts[0].p2.move_to(temp_vec[0]);

    temp_vec = darts[1].get_line_vector();
    darts[1].p2.move_to(darts[1].p2.add(temp_vec));
    temp_vec = s.intersection_positions(darts[1], sides[1]);
    darts[1].p2.move_to(temp_vec[0]);
  }
  if (styleline){
    let lns = lines.styleline;
    lns.forEach((ln) => {
      vec = ln.get_tangent_vector(ln.p2);
      ln.p2.move_to(ln.p2.add(vec.scale(2)));
      vec = s.intersection_positions(ln, lines.bottom[0]);
      ln.p2.move_to(vec[0]);
    });

  }
}

// ab hier sleeve

function main_sleeve(s, type){
  let percent = type.length;
  type = type.type;
  let lines = s.lines_by_key("type");

  if (type === "puffy"){

  } else if (type === "puffy bottom"){

  } else if (type === "cap"){

  } else if (type === "ruffles"){

  } else {
    straight_sleeve(s, type);
    straight_sleeve(s, type, 1);

    slim_sleeve(s, type);
    slim_sleeve(s, type, 1);
    if (type === "casual"){
  //    casual_sleeve(s);
    }
    shorten_sleeve(s, percent);
    shorten_sleeve(s, percent, 0);
  }




}


function straight_sleeve(s, type, side = 0){
  let direction = -1;
  if (side){
    direction = 1;
  }
  let lines = s.lines_by_key("type");
  let armpit = lines.armpit;

  let p1 = s.add_point(armpit[side].p2.add(new Vector(direction *1.4, 12)));
  let ln = s.line_between_points(armpit[side].p2, p1);
  let vec = ln.get_line_vector().get_orthonormal();
  let p2 = s.add_point(p1.add(vec.scale(direction*3.5)));
  let vec2 = ln.get_line_vector();
  let p_h2 = s.add_point(p2.add(vec2.scale(-0.8).add(new Vector(direction*0.2,0.5))));

  //let p_h = s.add_point(armpit[0].p1.add(new Vector(-2,0.3)));

  let p_h;
  let curve_vec;
  if(type === "puffy top"){
    p_h = s.add_point(armpit[side].p2.add(new Vector(direction*3.5, -3.7)));
    curve_vec = new Vector(direction*5,-5);
  } else if (type === "casual"){
    p_h = s.add_point(armpit[side].p2.add(new Vector(direction*2, -3)));
    p_h2.move_to(p_h2.add(new Vector(direction*-0.5,0)));

    curve_vec = new Vector(direction*1,-1);
  } else {
    p_h = s.add_point(armpit[side].p2.add(new Vector(direction*2.5, -3.5)));
    curve_vec = new Vector(direction*3,-1);
  }
/*
  let l1 = s.line_between_points(armpit[0].p1, p_h);
  let l2 = s.line_between_points(p_h, p_h2);
  let temp = s.interpolate_lines(l1, l2);
*/

  let curve = s.line_from_function_graph(armpit[side].p1, p2, spline.catmull_rom_spline(
    [armpit[side].p1, p_h, p_h2, p2], armpit[side].p1.add(curve_vec)
  ));
  //.plot_control_points(s));
  curve.data.type = "outer";
  if (!side){
    curve.data.side = "left";
  } else {
    curve.data.side = "right";
  }
  s.remove(p_h, p_h2);

  p_h = s.add_point(armpit[side].p2.add(new Vector(direction*0.3,2)));
  p_h2 = s.add_point(armpit[side].p2.add(new Vector(direction*0.9,7)));
  let curve_inner = s.line_from_function_graph(armpit[side].p2, p1, spline.catmull_rom_spline(
    [armpit[side].p2, p_h, p_h2, p1]
  ));
  curve_inner.data.type = "inner";
  if (!side){
    curve_inner.data.side = "left";
  } else {
    curve_inner.data.side = "right";
  }
  /*
  */
  s.remove(p_h, p_h2);
  s.remove_line(ln);

if (type === "casual"){
      let vec_temp = new Vector(direction*5, -1);
      p2.move_to(p2.add(vec_temp).add(new Vector(direction*0,-1.5)));
      p1.move_to(p1.add(vec_temp));
}

  vec = p1.subtract(p2).scale(0.5).add(p2);
  p_h = s.add_point(vec.add(new Vector(vec.normalize().scale(0.7))));
  let l1 = s.line_between_points(p1, p_h);
  let l2 = s.line_between_points(p_h, p2);

  let temp = s.interpolate_lines(l1,l2);
  temp.data.type = "bottom_sleeve";
  if (!side){
    temp.data.side = "left";
  } else {
    temp.data.side = "right";
  }

  s.remove(p_h)
}

function slim_sleeve(s, type, side = 0){
  let lines = s.lines_by_key("type");
  let bottom = lines.bottom_sleeve;
  let vec;
  if (type === "slim"){
    vec = bottom[side].get_line_vector();
    bottom[side].p1.move_to(bottom[side].p1.add(vec.scale(0.15)));
  } else if(type === "extra slim"){
    vec = bottom[side].get_line_vector();
    bottom[side].p2.move_to(bottom[side].p2.add(vec.scale(-0.15)));
    bottom[side].p1.move_to(bottom[side].p1.add(vec.scale(0.2)));
  } else if (type === "flared"){
    vec = bottom[side].get_line_vector();
    bottom[side].p2.move_to(bottom[side].p2.add(vec.scale(1.5)));
    bottom[side].p1.move_to(bottom[side].p1.add(vec.scale(-0.2)));
  } else {
    return;
  }

}



function shorten_sleeve(s, percent, side = 0){
  if (percent === 1){
    return;
  }
  percent = 1 - percent;
  let lines = s.lines_by_key("type");
  let bottom = lines.bottom_sleeve;
  let inner = lines.inner;
  let outer = lines.outer;

  let len = outer[side].get_length() - ((outer[side].get_length() - inner[side].get_length()) * 4/5);

  let vec = s.position_at_length(outer[side], len * percent * 0.95, true);
  let p1 = s.add_point(vec);
  s.point_on_line(p1, outer[side]);
  vec = s.position_at_length(inner[side], inner[side].get_length() * percent * 0.95, true);
  let p2 = s.add_point(vec);
  s.point_on_line(p2, inner[side]);

  s.copy_line(bottom[side], p2, p1);
  s.remove(bottom[side].p1, bottom[side].p2);
}



function casual_sleeve(s){
  let points = s.points_by_key("type");
  let pts = points.shoulder.concat(points.neck);
  let vec = new Vector(0, 1.5);
  pts.forEach((p) => {
    p.move_to(p.add(vec));
  });

}

export default {main};
