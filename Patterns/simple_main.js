import { Vector, vec_angle_clockwise, rotation_fun } from '../Geometry/geometry.js';
import { Sketch } from '../StoffLib/sketch.js';
import { Point } from '../StoffLib/point.js';
import { ConnectedComponent} from '../StoffLib/connected_component.js';

import top from './top/simple_top.js';
import sleeve from './sleeves/simple_sleeve.js';
import sleeve_type from './sleeves/sleeve_types.js';
import lengthen from './lengthen/top.js';
import dart from './darts/simple_dart.js';
import utils from './funs/utils.js';
import neck from './neckline/neckline.js';
import eva from './funs/basicEval.js';

function main_top(s, design, mea, design_neckline){
  sleeve.armpit_new(s);
  if (design["type"] === "without dart"){
    top.without_dart(s);
    lengthen.lengthen_top_without_dart_new(s, mea, 0.95);
    //let lines = s.data.comp.lines_by_key("type");
    //lines.waistline[0].swap_orientation();
    //lengthen.lengthen_top_without_dart(s, mea, 0.5);

  } else if (design["type"] === "styleline"){
    let sk = new Sketch();
    let patterns;
    if (design["styleline"] === "classic princess"){

      s.data.shoulder_dart = true;
      top.simple_waistline_web(s, mea);
      //top.simple_middle_dart(s, "fold", 0.5);
      patterns = top.split_pattern(s, "shoulder", 0.6);
    } else {
      patterns =  top.styleline_panel(s, design["styleline"], mea);
      main_dart(patterns[0], design["dartstyle"]);
    }
    main_neckline(patterns[0], design_neckline);

    if (s.data.front){
      patterns.reverse();
    }
    //main_neckline(patterns[0], design_neckline);

    patterns[0].remove_point(patterns[0].data.pt);
    delete patterns[0].data.pt;
    patterns[1].remove_point(patterns[1].data.pt);
    delete patterns[1].data.pt;

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
    if (eva.eval_waistline_dart(design["position"])){
      lengthen.lengthen_top_with_dart(s, mea, 0.95);
      if (design["dartstyle"] === "tuck"){
        dart.simple_tuck(s, s.data.comp.lines_by_key("type").dart);
      }
    } else {
      lengthen.lengthen_top_without_dart_new(s, mea, 0.95);
      main_dart(s, design["dartstyle"], design["position"]);
    }
  } else if (design["type"] === "double dart"){
    top.double_dart_web(s, design["position"], mea);
    double_main_dart(s, design["dartstyle"], design["position"], mea);
  } else if (design["type"] === "added fullness"){
    top.a_line(s);
  }
  main_neckline(s, design_neckline);
  s.remove_point(s.data.pt);
  delete s.data.pt;
  return s;
};


function double_main_dart(s, design, position, mea){
  if (eva.eval_waistline_dart(position)){
    let dart = utils.get_waistline_dart(s);
    lengthen.lengthen_top_with_dart(s, mea, 0.95, dart);
  } else {
    lengthen.lengthen_top_without_dart_new(s, mea, 0.95);
  }

  main_dart(s, design, position);
}


function main_dart(s, design, position){
  if(design === "normal"){
    dart.dart(s, position);
  } else if (design === "tuck"){
    dart.tuck_dart(s, position);
  }
  return s;
}

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

function main_sleeve(s, design, mea){
  const type = design["type"];

  if (type === "straight"){
    sleeve_type.straight(s);
  } else if (type === "slim"){
    sleeve_type.straight(s);
    sleeve_type.reduce_at_wrist(s, 2, 2);
  } else if (type === "extra slim"){
    //standard ist aktuell extra slim
  } else if (type === "puffy"){
    sleeve_type.straight(s);
    if (design["length"] < 0.7){
      return sleeve_type.puffy_short(s, mea, design["length"]);
    }

    sleeve_type.puffy(s);
    s.data.cuff = true;
  } else if (type === "puffy top") {
    sleeve_type.straight(s);

    sleeve_type.puffy_top(s);
  } else if (type === "puffy bottom"){
    sleeve_type.straight(s);

    s.data.cuff = true;
    sleeve_type.flared(s);

  } else if (type === "flared"){
    sleeve_type.straight(s);
    sleeve_type.flared(s);
  } else if (type === "cap"){
    sleeve_type.cap(s);
    return s;
  } else if (type === "ruffles"){
    return sleeve_type.ruffles(s, 4);
  } else if (type === "casual"){
    s = sleeve_type.casual(s);
  }
  if (design["length"] < 0.04){
    design["length"] = 0.04;
  }
  sleeve.shorten_length(s, design["length"]);

  if (s.data.cuff){
     return sleeve_type.add_cuff(s, mea, design["length"]);
  }
  return s;
}


function paste_sketches(s, arr){
  let [sk] = arr.splice(0,1);

  s.paste_sketch(sk, null, new Vector(0,0));
  arr.forEach((i) => {
    utils.position_sketch(s, i);
  });

return s;
}


function main_neckline(s, design){
  design = design["type"];
  let without_changeing_shoulder = ["round", "staps"];
  let not_possible_with_shoulder_dart = ["V-Line wide", "round wide", "boat", "square"];

  if (not_possible_with_shoulder_dart.includes(design) && s.data.shoulder_dart){
    if (design === "square" && !s.data.tuck){
      neck.square_shoulder_dart(s);
    }
  } else {
    if (without_changeing_shoulder.includes(design)){
    } else {

      neck.slim_neckline(s, 0.7);
      if (design === "V-Line wide"){
        neck.v_line(s, "wide");
      } else if (design === "V-Line deep"){
        neck.v_line(s, "deep");
      } else if(design === "V-Line") {
        neck.v_line(s, "normal");
      } else if (design === "round wide"){
        neck.round_wide(s);
      } else if (design === "square"){
        neck.square(s);
      } else if (design === "boat"){
        neck.boat(s);
      }
    }
  }
}




export default {main_top, main_sleeve, main_merge, paste_sketches};
