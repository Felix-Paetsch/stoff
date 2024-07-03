import { Vector, vec_angle_clockwise, rotation_fun } from '../Geometry/geometry.js';
import { Sketch } from '../StoffLib/sketch.js';
import { Point } from '../StoffLib/point.js';
import { ConnectedComponent} from '../StoffLib/connected_component.js';

import top from './top/simple_top.js';
import sleeve from './sleeves/simple_sleeve.js';
import lengthen from './lengthen/top.js';
import dart from './darts/simple_dart.js';
import utils from './funs/utils.js';



function main_top(s, design, mea){
  sleeve.armpit_new(s);
  if (design["type"] === "without dart"){
    top.without_dart(s);
    //let lines = s.data.comp.lines_by_key("type");
    //lines.waistline[0].swap_orientation();
    //lengthen.lengthen_top_without_dart(s, mea, 0.5);

  } else if (design["type"] === "styleline"){
    let sk = new Sketch();
    let patterns;
    if (design["styleline"] === "classic princess"){
      top.simple_waistline_web(s, mea);
      //top.simple_middle_dart(s, "fold", 0.5);
      patterns = top.split_pattern(s, "shoulder", 0.6);

    } else {
      patterns =  top.styleline_panel(s, design["styleline"], mea);
    }

    patterns[0].remove_point(patterns[0].data.pt);
    delete patterns[0].data.pt;
    patterns[1].remove_point(patterns[1].data.pt);
    delete patterns[1].data.pt;

    if (s.data.front){
      patterns.reverse();
    }
    /*
    sk.paste_sketch(patterns[0], null, new Vector(0, 0));
    sk.paste_sketch(patterns[1], null, new Vector(25, 0));
*/

     return patterns;

/*
    let vec;
    if(patterns[0].front){
      let vec = new Vector(25, 0);
    } else {
      vec = new Vector(-25, 0);
    };
    patterns[0].comp.transform(elem => {
      elem.move_to(elem.add(vec));
      //top.merge_lines(s, s.data.back_outer, s.data.front_outer, "side");
    });
    */
  } else if (design["type"] === "single dart"){
    top.simple_dart_web(s, design["position"], mea);
    dart.tuck_dart(s);
  } else if (design["type"] === "double dart"){
    top.double_dart_web(s, design["position"], mea);
    dart.tuck_dart(s);
  } else if (design["type"] === "added fullness"){
    top.a_line(s);
  }
  s.remove_point(s.data.pt);
  delete s.data.pt;
  return s;
};


function main_merge(front, back, design){
  // erstes ist außen
  let s;
  if(design["type"] === "styleline"){
    if (design["closed"]){
      s = top.styleline_merge(back[1], front[0]);

      return [back[0], s, front[1]];
      //return [s];
    }
    return [back[0], back[1], front[0], front[1]];
  }
  return [back, front];
}

function main_sleeve(s, design){
  if (design["type"] === "puffy top"){
  } else if (design["type"] === "puffy bottom"){

  } else if (design["type"] === "puffy"){

  } else if (design["type"] === "straight") {

  }

  if (design["attributes"].includes("shorten")){
    sleeve.shorten_length(s, 0.6);
  }
}


function paste_sketches(s, arr){
  let [sk] = arr.splice(0,1);

  s.paste_sketch(sk, null, new Vector(0,0));

  arr.forEach((i) => {
    utils.position_sketch(s, i);
  });

return s;
}



export default {main_top, main_sleeve, main_merge, paste_sketches};
