import { Vector, vec_angle, rotation_fun } from '../../StoffLib/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import { spline } from "../../StoffLib/curves.js";

import utils from '../funs/utils.js';

import { line_with_length} from '../funs/basicFun.js';

import sleeve from './simple_sleeve.js';
import sleeve_main from './pattern_sleeve.js';


function straight(s){
  let points = s.data.comp.points_by_key("type");
  let top_front = points["top side front"][0];
  let top_back = points["top side back"][0];
  let front = points["bottom side front"][0];
  let back = points["bottom side back"][0];
  front.move_to(top_front.x, front.y);
  back.move_to(top_back.x, back.y);
  return s;
};

function reduce_at_wrist(s, front_len, back_len){
  let points = s.data.comp.points_by_key("type");
  let front = points["bottom side front"][0];
  let back = points["bottom side back"][0];
  let vec = front.subtract(back);
  let len = vec.length();
  let percent = 1 - front_len / len;
  front.move_to(vec.scale(percent).add(back));

  vec = front.subtract(back);
  len = vec.length();
  percent = 1 - back_len / len;
  back.move_to(vec.scale(-percent).add(front));

  return s;
}


function add_cuff(sk, mea, des_length){
  let length;
  if (des_length < 0.45){
    length = mea.arm + 2;// geht davon aus, dass schon +2 gerechnet wurde
  } else if (des_length < 0.7){
    length = mea.ellbow_width;// geht davon aus, dass schon +4 gerechnet wurde
  } else {
    length = mea.wristwidth; // geht davon aus, dass schon +3 gerechnet wurde
  }
  let s = new Sketch();
  s.paste_sketch(sk, null, new Vector(0,0));

  let p1 = s.point(0, -4);
  let p2 = s.point(0, -3);

  s.line_between_points(p1, p2);
  let ln1 = line_with_length(s, p1, length, -90);
  let ln2 = line_with_length(s, p2, length, -90);
  s.line_between_points(ln1.p2, ln2.p2);


  return s;
}

function flared(s){
  let points = s.data.comp.points_by_key("type");
  let line = s.data.comp.lines_by_key("type")["wrist"][0];
  let top_front = points["top side front"][0];
  let top_back = points["top side back"][0];
  let front = points["bottom side front"][0];
  let back = points["bottom side back"][0];
  let top = points["mid"][0];


  const pt = s.point(top.x, back.y);
  const p_h = s.point(front.subtract(back).normalize().scale(10).add(front));

  let angle = vec_angle(p_h.subtract(top_front), front.subtract(top_front));
  let fun1 = rotation_fun(top_front, angle);
  let fun2 = rotation_fun(top_back, -angle);

  front.move_to(fun1(front));
  back.move_to(fun2(back));
  s.remove_point(p_h);

  let diff = pt.y - front.y;
  const pt2 = s.point(pt.add(new Vector(0, diff)));


  let l = s.line_from_function_graph(front, back, spline.bezier([
      front, pt2, back
  ]));

  s.remove_point(pt);
  s.remove_point(pt2);
  s.remove_line(line);
  l.data.type = "wrist";

  return s;
}

function puffy(s){
  let points = s.data.comp.points_by_key("type");
  let lines = s.data.comp.lines_by_key("type")["armpit"];
  let back_top = points["top side back"][0];
  let back = points["bottom side back"][0];
  let top = points["mid"][0];

  let p = s.add_point(top.copy());
  let p2;
  let vec = new Vector(9,0);
  if (lines[1].p2 === back_top){
    lines[1].set_endpoints(p, lines[1].p2);
    p.move_to(p.add(vec));
    back_top.move_to(back_top.add(vec));
    back.move_to(back.add(vec));

    vec = top.subtract(p).scale(0.5).add(new Vector(0,-1.8)).add(p);
    p2 = s.add_point(vec);

    let pt_f = s.add_point(lines[0].position_at_length(9 * lines[0].get_length() / 10));
    let pt_b = s.add_point(lines[1].position_at_length(lines[1].get_length() / 10));

    s.data.comp = new ConnectedComponent(back_top);


    let l = s.line_from_function_graph(pt_f, pt_b, spline.bezier([
        pt_f, p2, pt_b
    ]));
    s.remove_point(p2);

    let temp = s.point_on_line(pt_f, lines[0]);
    s.remove_point(temp.line_segments[1].p2);
    l = s.merge_lines(temp.line_segments[0], l);
    s.remove_point(pt_f);

    temp = s.point_on_line(pt_b, lines[1]);
    s.remove_point(temp.line_segments[0].p1);
    l = s.merge_lines(temp.line_segments[1], l);
    s.remove_point(pt_b);


    /*
    */
  } else {
    console.log("Du hast irgendwas bei dem erstellen der Kurven der Ärmel " +
    "verändert. Bitte korrigiere alle deine Ärmelfunktionen!");
  }

}

function puffy_short(s, mea, length){
  let points = s.data.comp.points_by_key("type");
  let wrist = s.data.comp.lines_by_key("type")["wrist"][0];
  let p = s.point(points["mid"][0].add(new Vector(4.5,0)));
  puffy(s);
  if (length < 0.08){
    length = 0.08;
  }
  sleeve.shorten_length(s, length);



  let front = points["bottom side front"][0];
  let back = points["bottom side back"][0];
  const pt = s.point(p.x, back.y);

  let p_h = s.point(front.add(new Vector(-6, 0)));
  let angle = vec_angle(p_h.subtract(p), front.subtract(p));
  let fun_f = rotation_fun(p, angle);
  let fun_b = rotation_fun(p, -angle);

  front.move_to(fun_f(front));
  back.move_to(fun_b(back));


    let diff = pt.y - front.y;
    const pt2 = s.point(pt.add(new Vector(0, diff)));


    let l = s.line_from_function_graph(front, back, spline.bezier([
        front, pt2, back
    ]));
    l.data = wrist.data;

    s.remove_line(wrist);
    s.remove_point(p);
    s.remove_point(p_h);
    s.remove_point(pt);
    s.remove_point(pt2);

  return add_cuff(s, mea, length);

}

function puffy_top(s){
  puffy(s);
  reduce_at_wrist(s, 6, 6);
}

function cap(s){
  let points = s.data.comp.points_by_key("type");
  let lines = s.data.comp.lines_by_key("type")["armpit"];

  let front = points["top side front"][0];
  let back = points["top side back"][0];
  let top = points["mid"][0];
  let p1 = s.point(front.copy());
  let p2 = s.point(back.copy());
  let l = s.line_between_points(p1, p2);
  let len = back.y - top.y;

  len = len / 4;
  let vec = new Vector(0, -len);
  p1.move_to(p1.add(vec));
  p2.move_to(p2.add(vec));
  //console.log(lines)

  let temp = s.intersect_lines(l, lines[0]);
  s.remove_point(temp.l1_segments[0].p1);
  temp.intersection_points[0].data.type = temp.l2_segments[0].p1.data.type;
  s.remove_point(temp.l2_segments[0].p1);

  temp = s.intersect_lines(temp.l1_segments[1], lines[1]);
  s.remove_point(temp.l1_segments[1].p2);
  temp.intersection_points[0].data.type = temp.l2_segments[1].p2.data.type;
  s.remove_point(temp.l2_segments[1].p2);

  s.remove_point(points["bottom side back"][0]);
  s.remove_point(points["bottom side front"][0]);
  /*
*/
function hasMethod (obj, name) {
  const desc = Object.getOwnPropertyDescriptor (obj, name);
  return !!desc && typeof desc.value === 'function';
}
  function getInstanceMethodNames (obj, stop) {
    let array = [];
    let proto = Object.getPrototypeOf (obj);
    while (proto && proto !== stop) {
      Object.getOwnPropertyNames (proto)
        .forEach (name => {
          if (name !== 'constructor') {
            if (hasMethod (proto, name)) {
              array.push (name);
            }
          }
        });
      proto = Object.getPrototypeOf (proto);
    }
    return array;
  }

  return s;
};


function ruffles(sk, width){
  let lines = sk.data.comp.lines_by_key("type")["armpit"];
  let len = 3 * 1.5 * lines[0].get_length() + lines[1].get_length() / 4;


  const s = new Sketch();

  const p1 = s.point(0,0);
  const p2 = s.point(0, len);

  const p_h1 = s.point(width, 0);
  const p_h2 = s.point(width, len);

  const pt1 = s.point(width, 4);
  const pt2 = s.point(width, len - 4);

  let l = s.line_from_function_graph(p1, pt1, spline.bezier([
      p1, p_h1, pt1
  ]));

   l = s.line_from_function_graph(p2, pt2, spline.bezier([
      p2, p_h2, pt2
  ]));

  s.remove_point(p_h1);
  s.remove_point(p_h2);

  s.line_between_points(p1, p2);
  s.line_between_points(pt1, pt2);

  return s;
};

function casual(sk){
  let lines = sk.data.comp.lines_by_key("type")["armpit"];

  let len_f;
  let len_b;

  if (lines[0].data.is_front){
    len_f = lines[0].get_length();
    len_b = lines[1].get_length();
  } else {
    len_f = lines[1].get_length();
    len_b = lines[0].get_length();
  }

  const s = new Sketch();

  let p = s.point(0,0);
  let height = sk.data.height/2;
  let p2 = s.point(0, height);

  let len = len_f - 0.3;

  len = Math.sqrt(Math.pow(len, 2) - Math.pow(height, 2));

  let p3 = s.point(-len, height);

   len = len_b - 0.5;
  sleeve_main.curve(s, p, p3, len_f).mirror();


  len = Math.sqrt(Math.pow(len, 2) - Math.pow(height, 2));

  let p4 = s.point(len, height);
  sleeve_main.curve(s, p, p4, len_b);

  len = p3.x / -4;

  let p5 = s.point(p3.add(new Vector(len, sk.data.length)));
  let p6 = s.point(p4.add(new Vector(-len, sk.data.length)));

  s.remove_point(p2);

  p.data.type = "mid";
  p3.data.type = "top side front";
  p4.data.type = "top side back";
  p5.data.type = "bottom side front";
  p6.data.type = "bottom side back";

  let l = s.line_between_points(p3, p5);
  l.data.type = "side";
  l = s.line_between_points(p4, p6);
  l.data.type = "side";
  l = s.line_between_points(p5, p6);
  l.data.type = "wrist";

  s.data = sk.data;
  s.data.comp = new ConnectedComponent(p);

  return s;
};


export default {straight, reduce_at_wrist, add_cuff, flared, puffy, puffy_short, puffy_top, cap, ruffles, casual};
