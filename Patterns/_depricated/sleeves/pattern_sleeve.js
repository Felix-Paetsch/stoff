import Sketch from '../../../Core/StoffLib/sketch.js';
import Point from '../../../Core/StoffLib/point.js';
import { Vector } from '../../../Core/StoffLib/geometry.js';
import ConnectedComponent from '../../../Core/StoffLib/connected_component.js';

import { line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline} from '../funs/basicFun.js';
import evaluate from '../funs/basicEval.js';

import utils from '../funs/utils.js';



function sleeve(mea, height, sleeve_type = "eingehalten 3/4", len_front, len_back){
  let type = evaluate.eval_sleeve(sleeve_type);
  const s = new Sketch();
  s.data.height = height/2;
  const p1 = s.add_point(new Point(0,0));
  p1.data.type = "mid";
  const a = s.add(new Point(0, (height/2)*type));

  const b = s.add_point(new Point(a.add(new Vector(0, mea["arm length"]))));
  s.data.length = mea["arm length"];
  if (evaluate.eval_sleeve_eingehalten(sleeve_type)){
    len_front = len_front + 1;
    len_back = len_back + 1;
  }

  // Kurve einzeichnen
  let pt1 = s.add_point(new Point(a.add(new Vector(-(mea.arm)*0.475, 0))));
  let pt2 = s.add_point(new Point(a.add(new Vector((mea.arm)*0.525, 0)))); // back
  pt2.data.type = "top side back";
  pt1.data.type = "top side front";
  pt2.data.is_front = false;
  pt1.data.is_front = true;

//  console.log(mea.arm, pt1.subtract(pt2).length())

  let c1 = curve(s, pt1, p1, len_front);
  c1.data.curve = true;
  c1.data.is_front = true;
  c1.data.type = "armpit";
  c1.mirror();
  let c2 = curve(s, p1, pt2, len_back); // back
  c2.data.curve = true;
  c2.data.type = "armpit";
  /*
//  console.log(c1.get_length(), pt1.subtract(p1).length(), len_front)
// kurve korrigieren
  const r_squared =  p1.subtract(a).length_squared();
  if (c1.get_length() < len_front){
    const k = len_front/c1.get_length();
    const s_squared = pt1.subtract(a).length_squared();
    const s_prime = Math.sqrt(k*k*(r_squared + s_squared) - r_squared);
    pt1.move_to(-s_prime, pt1.y);
  }
  if (c2.get_length() < len_back){
    const k2 = len_back/c2.get_length();
    const s_squared2 = pt2.subtract(a).length_squared();
    const s_prime2 = Math.sqrt(k2*k2*(r_squared + s_squared2) - r_squared);
    pt2.move_to(s_prime2, pt2.y);
  }
  //  console.log(mea.arm, pt1.subtract(pt2).length())
  //  console.log(c1.get_length(), pt1.subtract(p1).length(), len_front)
*/
// weiter im Text
  let wrist_p1 = s.add_point(new Point(b.add(new Vector(-(mea.wristwidth)*0.475, 0))));
  let wrist_p2 = s.add_point(new Point(b.add(new Vector((mea.wristwidth)*0.525, 0))));
  wrist_p1.data.type = "bottom side front";
  wrist_p2.data.type = "bottom side back";

  let l1 = s.line_between_points(pt1, wrist_p1);
  l1.data.type = "side";
  let l2 = s.line_between_points(pt2, wrist_p2);
  l2.data.type = "side";
  let wrist_l = s.line_between_points(wrist_p1, wrist_p2);
  wrist_l.data.type = "wrist";



  s.remove_point(a);
  s.remove_point(b);
  s.data.comp = new ConnectedComponent(p1);
      console.log(pt1.y - p1.y)
  /*

*/
  return s;
}

function curve(s, pt1, pt2, len){
  let len2 = pt1.subtract(pt2).length() + 0.5;
  let l;
    if (len2 < len){
      l = s.line_with_length(pt1, pt2, len);
    } else {
      l = s.line_with_length(pt1, pt2, len2);
    }
    /*
    const pt = l.position_at_length(l.get_length()*0.1);


    const pt3 = s.point(pt).set_color("red");
        s.save_as_png("Debug.png", 200);
    console.log(pt3.x, pt3.y, pt.x, pt.y);
  return s.line_from_function_graph(pt1, pt2, t => {
      const t3 = t*t*t;
      const t4 = t3*t;
      const t5 = t4*t;

      // Integrate x^n(x-1)^n (and scale it nicely; theoretically not even needed thoug);
      return (10*t3 - 15*t4 + 6*t5) * r;
  });
  */
  return l;
};



function new_sleeve(mea, height, sleeve_type = "eingehalten 3/4", len_front, len_back){
  let type = evaluate.eval_sleeve(sleeve_type);
  const s = new Sketch();
  s.data.height = height/2;
  const p1 = s.add_point(new Point(0,0));
  p1.data.type = "mid";
  const a = s.add(new Point(0, (height/2)*type));
  const b = s.add_point(new Point(a.add(new Vector(0, mea["arm length"]))));
  s.data.length = mea["arm length"];
  if (evaluate.eval_sleeve_eingehalten(sleeve_type)){
    len_front = len_front + 1;
    len_back = len_back + 1;
  }


    // Kurve einzeichnen

    //let len = get_pt_distance(p1, a, len_front - 0.6);
    let len = Math.sqrt(Math.pow(len_front - 0.6, 2) - Math.pow(p1.subtract(a).length(), 2));
    let pt1 = s.add_point(a.add(new Vector(len, 0)));
    len = Math.sqrt(Math.pow(len_back + 0.4, 2) - Math.pow(p1.subtract(a).length(), 2));
    let pt2 = s.add_point(a.add(new Vector(-len, 0)));
    s.line_between_points(p1, pt2)
    s.line_between_points(pt1, pt2)
    console.log(mea.arm)
    /*
    let p_h = s.add_point(a.add(new Vector(mea.arm, 0)));
    let line_h = s.line_between_points(a, p_h);
    let pt1 = get_point_on_other_line2(s, a, new Vector(0,0), len_front - 0.6, line_h.get_line_vector().normalize());
    //let pt1 = s.add_point(a.add(new Vector(len, 0)));
    console.log(len_front - 0.6)
    let pt1 = s.add_point(new Point(a.add(new Vector(-(mea.arm)*0.475, 0))));
    let pt2 = s.add_point(new Point(a.add(new Vector((mea.arm)*0.525, 0)))); // back
    pt2.data.type = "top side back";
    pt1.data.type = "top side front";
    pt2.data.is_front = false;
    pt1.data.is_front = true;

  //  console.log(mea.arm, pt1.subtract(pt2).length())

    let c1 = curve(s, pt1, p1, len_front);
    c1.data.curve = true;
    c1.data.is_front = true;
    c1.data.type = "armpit";
    c1.mirror();
    let c2 = curve(s, p1, pt2, len_back); // back
    c2.data.curve = true;
    c2.data.type = "armpit";
*/
return s;
};

// nicht sehr schön benannt, ich weiß
function get_pt_distance(p1, p2, len){
  let diff = p1.subtract(p2).length();

  let w = 2 * diff * len * Math.cos(90);

  console.log(2 * diff * len * Math.cos(90))

  return Math.sqrt(Math.pow(diff,2) + Math.pow(len, 2));

};


export default {sleeve, curve, new_sleeve};
