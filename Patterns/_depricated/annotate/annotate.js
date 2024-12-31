import { Vector, vec_angle, rotation_fun } from '../../../StoffLib/geometry.js';
import Sketch from '../../../StoffLib/sketch.js';
import Point from '../../../StoffLib/point.js';
import ConnectedComponent from '../../../StoffLib/connected_component.js';

import top from '../top/simple_top.js';
import sleeve from '../sleeves/simple_sleeve.js';
import sleeve_type from '../sleeves/sleeve_types.js';
import lengthen from '../lengthen/top.js';
import dart from '../darts/simple_dart.js';
import utils from '../funs/utils.js';
import eva from '../funs/basicEval.js';
import seam from '../seam_allowance/simple_seam.js';


function new_annotate(s, s_old = []){
  if (s.data.type !== "middle"){
    let lines = s.lines_by_key("type");
    if (lines.waistline.length){
      lines.waistline.forEach((ln) => {
        s.remove_line(ln);
      });
    }
    let ln2 = lines.fold[0];
    let ln3 = lines.fold_bottom[0]
    ln2 = s.merge_lines(ln2, ln3, true);
    //s.data.comp = new ConnectedComponent(ln2);
    ln2.data.type = "fold";

    s = utils.mirror_on_fold(s);
  } else {
    let lines = s.lines_by_key("type");
    let sk = new Sketch();
    if (lines.waistline.length){
      lines.waistline.forEach((ln) => {
        s.remove_line(ln);
      });
    }
    sk.paste_sketch(s);
    // diese unterscheidung ist reine optik, würde reichen, wenn nur eines
    // davon genommen wird
    if (s.data.front){
      utils.mirror_sketch(s);
    } else {
      utils.mirror_sketch(sk);
    }
    s = [s].concat(s_old).concat([sk]);

  }


  return s;
}


function annotate(s, s_old = [], dart_type = "dart"){


  //seam.merge_all_lines(s);
  //seam.seam_allowance_first(s, 1.5);
  let lines = s.lines_by_key("type");
  //let ln = lines.waistline;
  let ln2;
  let ln3;
  //console.log(s.data)
  let temp;


  if (s.data.type !== "middle"){

    ln2 = lines.fold[0];
    ln3 = lines.fold_bottom[0]
    ln2 = s.merge_lines(ln2, ln3, true);
    //s.data.comp = new ConnectedComponent(ln2);
    ln2.data.type = "fold";
  } else {
    ln2 = lines.bottom[0].p1;
  }
  //s.data.comp = new ConnectedComponent(ln2);

  if(s.data.type === "sleeve" || s.data.type === "middle"){
    //console.log("here")
    let sk;
    [s, sk] = mirror_middle(s);
    remove_dart(s);
    remove_dart(sk);
    lines = s.lines_by_key("type");
    //console.log(s.data.comp.root().data)
    let ln = lines.waistline;
    if (ln){
      //ln[0].set_color("red")
      ln.forEach((elem) => {
        s.remove_line(elem);
      });
    }

    lines = sk.lines_by_key("type");
      //console.log(s.data.comp.root().data)
    ln = lines.waistline;


    if (ln){
      //ln[0].set_color("red")
      ln.forEach((elem) => {
        sk.remove_line(elem);
      });
    }

    /*
    */
    temp = [sk].concat(s_old).concat(s);


  } else {
    lines = s.lines_by_key("type");
    //s.merge_lines(lines.fold[0], lines.fold_bottom[0], true).data.type = "fold";
    temp = utils.mirror_on_fold(s);
    remove_dart(temp);
    //console.log(s.data.comp.root().data)
    let ln = lines.waistline;


    if (ln){
      //ln[0].set_color("red")
      ln.forEach((elem) => {
        s.remove_line(elem);
      });
  }

}

  seam.seam_allowance_neck(s, 0.5);
  seam.seam_allowance_bottom(s, 2);

  return temp;
}

function mirror_middle(s){
  const sk = new Sketch();
  sk.paste_sketch(s);
  if(!s.data.closed){

  }

  utils.mirror_sketch(s);

  //utils.position_sketch(s, sk);

  return [s, sk];
}


// Jetzt bei utils.mirror_on_fold zu finden
/* function mirror(s){

  const sk = new Sketch();
  sk.paste_sketch(s);
  //console.log(s.data)

    let p = sk.lines_by_key("type").fold[0].p1;
    let vec;
    let vec2;
    sk.get_points().forEach((pt) => {
      vec = pt.subtract(p);
      vec2 = new Vector(vec.x, 0);
      vec = vec.add(vec2.scale(-2)).add(p);
      pt.move_to(vec);
    });
    let lines = sk.get_lines();
    lines.forEach((ln) => {
      ln.mirror();
    });
  let points = s.get_points();
  points = [...points];
  utils.position_sketch(s, sk);

  //let comps = s.get_connected_components();
  //let ln1 = comps[0].lines_by_key("type").fold[0];
  //let ln2 = comps[1].lines_by_key("type").fold[0];
  //let neck_p = comps[0].lines_by_key("type").neckline[0].p1;

  let folds = s.lines_by_key("type").fold;


  vec = folds[0].p1.subtract(folds[1].p1);

  points.forEach((pt) => {
    //pt.set_color("red")
    pt.move_to(pt.subtract(vec));
  });


  s.merge_points(folds[0].p1, folds[1].p1);
  s.merge_points(folds[0].p2, folds[1].p2);




  //s.data.comp = new ConnectedComponent(neck_p);
  lines = s.lines_by_key("type");


    //ln1.p2.move_to(ln1.p2.add(new Vector(10,10)))


  let lines1 = lines.neckline;
  let lines2 = lines.bottom;

  s.merge_lines(lines1[0], lines1[1], true);
  s.merge_lines(lines2[0], lines2[1], true);


  return s;
};
*/

function annotate_dart(s, [ln1, ln2]){
  let p = ln1.common_endpoint(ln2);
  const ln1p2 = ln1.other_endpoint(p);
  const ln2p2 = ln2.other_endpoint(p);

  let vec_p_middle = ln1p2.subtract(ln2p2).scale(0.5).add(ln2p2);
  let vec = p.subtract(vec_p_middle).normalize();

  let p_ann = s.add_point(vec.scale(-3).add(p));
  p_ann.data.addition = "3";
  let p_middle = s.add_point(vec_p_middle);
  p_middle.data.type = "dart_middle";
  let ln = s.line_between_points(p_ann, p_middle);
  ln.data.type = "dart_annotated";
  p_middle.data.width = vec_p_middle.subtract(ln1p2).length();

  let lines = s.lines_by_key("type");
  let bottom = lines.dart_bottom;
  if (bottom){
      let adjacent = bottom[0].p2.get_adjacent_lines().concat(bottom[1].p2.get_adjacent_lines());
      if (adjacent.includes(ln1)){
        if(!s.data.shortened){
        let p_ann2 = s.add_point(vec.scale(3).add(bottom[0].p1));
        p_ann2.data.addition = "3";
        ln = s.line_between_points(p_ann2, p_middle);
        ln.data.type = "dart_bottom_annotated";

        ln = s.line_between_points(bottom[0].p1, p_ann2);
        ln.data.type = "dart_remove";

        ln = s.line_between_points(bottom[0].p2, p_ann2);
        ln.data.type = "dart_remove";
        ln = s.line_between_points(bottom[1].p2, p_ann2);
        ln.data.type = "dart_remove";
      } else {
        vec = bottom[0].p1.subtract(bottom[1].p1).scale(0.5).add(bottom[1].p1);
        let p_bot = s.add_point(vec);
        ln = s.line_between_points(p_bot, p_middle);
        ln.data.type = "dart_annotated";
        ln = s.line_between_points(bottom[0].p2, p_bot);
        ln.data.type = "dart_remove";
        ln = s.line_between_points(bottom[1].p2, p_bot);
        ln.data.type = "dart_remove";
      }
    }
  }

  ln = s.line_between_points(p, p_ann);
  ln.data.type = "dart_remove";
};

function annotate_tuck(s, [ln1, ln2]){

  let vec_p_middle = ln1.p2.subtract(ln2.p2).scale(0.5).add(ln2.p2);
  let p_middle = s.add_point(vec_p_middle);

  let vec = ln1.p1.subtract(ln2.p1).scale(0.5).add(ln2.p1);
  let vec_p = vec.subtract(p_middle).normalize();
  let p_ann = s.add_point(vec_p.scale(-2).add(vec));
  p_ann.data.addition = 2;
  p_ann.data.type = "tuck";
  p_middle.data.width = vec_p_middle.subtract(ln1.p2).length();
  p_middle.data.type = "dart_middle";

  let ln = s.line_between_points(p_ann, p_middle);
  ln.data.type = "dart_annotated";


  let lines = s.lines_by_key("type");
  let bottom = lines.dart_bottom;
  if (bottom){
    let adjacent = bottom[0].p2.get_adjacent_lines().concat(bottom[1].p2.get_adjacent_lines());
    if (adjacent.includes(ln1)){
      if(!s.data.shortened){
        let adjacent = bottom[0].p2.get_adjacent_lines().concat(bottom[1].p2.get_adjacent_lines());
        if (adjacent.includes(ln1)){
          let p_ann2 = s.add_point(vec.scale(3).add(bottom[0].p1));
          p_ann2.data.addition = "3";
          ln = s.line_between_points(p_ann2, p_middle);
          ln.data.type = "dart_bottom_annotated";

          ln = s.line_between_points(bottom[0].p1, p_ann2);
          ln.data.type = "dart_remove";

          ln = s.line_between_points(bottom[0].p2, p_ann2);
          ln.data.type = "dart_remove";
          ln = s.line_between_points(bottom[1].p2, p_ann2);
          ln.data.type = "dart_remove";
        }
        } else {
          vec = bottom[0].p1.subtract(bottom[1].p1).scale(0.5).add(bottom[1].p1);
          let p_bot = s.add_point(vec);
          ln = s.line_between_points(p_bot, p_middle);
          ln.data.type = "dart_annotated";
          ln = s.line_between_points(bottom[0].p2, p_bot);
          ln.data.type = "dart_remove";
          ln = s.line_between_points(bottom[1].p2, p_bot);
          ln.data.type = "dart_remove";
        /*
        */

      }
    }

  }
  ln = s.line_between_points(ln1.p1, p_ann);
  ln.data.type = "dart_remove";
  ln = s.line_between_points(ln2.p1, p_ann);
  ln.data.type = "dart_remove";
}


function remove_dart(s){
  let lines = s.lines_by_key("type");
  let annotated = lines.dart_remove;

  // Ganz eigentlich muss die comp2 bereits woanders gelöscht werden!!!
  //delete s.data.comp2;

  if (annotated){
    annotated.forEach((elem) => {

      s.remove_point(elem.p1);
    });
    /*
    */
  }
}


export default {annotate, new_annotate, annotate_dart, annotate_tuck, remove_dart};
