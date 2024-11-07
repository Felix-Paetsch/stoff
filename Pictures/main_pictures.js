
import { Vector, vec_angle, rotation_fun } from '../StoffLib/geometry.js';
import { Sketch } from '../StoffLib/sketch.js';
import { Point } from '../StoffLib/point.js';
import { ConnectedComponent} from '../StoffLib/connected_component.js';

import { spline } from "../StoffLib/curves.js";


// front is boolean
function main(config, front){
  const s = new Sketch();

    simple_top(s);

    main_neck(s, config["neckline"].type);






  return s;
};


function simple_top(s){
  let p1 = s.add_point(-0.5,0);
  p1.data.type = "neck";
  p1.data.side = "left";
  let p2 = s.add_point(-3, 1);
  p2.data.type = "shoulder";
  p2.data.side = "left";
  let p3 = s.add_point(4.5,0);
  p3.data.type = "neck";
  p3.data.side = "right";
  let p4 = s.add_point(7, 1);
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

  let p_h = s.add_point(-2,6);


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

      if (front){
        let p1 = s.add_point();

      }


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

      break;
    default:

  }
}

function v_line(s, p1, p2, p3, p_h){

  let ln1 = s.line_between_points(p1, p_h);
  let ln2 = s.line_between_points(p_h, p2);
  let temp = s.interpolate_lines(ln1, ln2);
  s.remove(p_h);
  s.copy_line(temp, p3, p2).mirror();
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


export default {main};
