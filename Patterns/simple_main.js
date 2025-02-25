import { Vector, vec_angle, rotation_fun } from '../Core/StoffLib/geometry.js';
import Sketch from '../Core/StoffLib/sketch.js';
import Point from '../Core/StoffLib/point.js';
import ConnectedComponent from '../Core/StoffLib/connected_component.js';

import top from './top/simple_top.js';
import sleeve from './sleeves/simple_sleeve.js';
import sleeve_type from './sleeves/sleeve_types.js';
import lengthen from './lengthen/top.js';
import dart from './darts/simple_dart.js';
import utils from './funs/utils.js';
import neck from './neckline/neckline.js';
import eva from './funs/basicEval.js';
import seam from './seam_allowance/simple_seam.js';

function main_top(s, design, mea, design_neckline){
  sleeve.armpit(s);
  main_neckline(s, design_neckline);
  if (design["type"] === "without dart"){
    top.without_dart(s);

    lengthen.lengthen_top_without_dart_new(s, mea, design.length);

  } else if (design["type"] === "styleline"){
    let sk = new Sketch();
    let patterns;
    if (design["styleline"] === "classic princess"){
  /*    if (design_neckline.type !== "square"){
        main_neckline(s, design_neckline);
      }*/
      top.simple_waistline_web(s);
      patterns = top.split_pattern(s, "shoulder", 0.6);
    /*  if (design_neckline.type === "square"){
        main_neckline(patterns[0], design_neckline);
      }*/
    } else {

      main_neckline(s, design_neckline);
      top.waistline_simple_dart(s, 0.55);
      patterns = top.split_pattern(s, "armpit", 0.7);
    }

    patterns.forEach((elem) => {
      elem.data.styleline = true;
    });

     return patterns;

  } else if (design["type"] === "added fullness"){
    top.a_line(s);
    lengthen.lengthen_top_without_dart_new(s, mea, design.length);
  } else { // double dart oder single dart
      s.data.dartposition = design["position"];
  //    main_neckline(s, design_neckline);
    if (design["type"] === "single dart"){
        top.simple_dart_web(s, design["position"]);
    } else if (design["type"] === "double dart"){
      top.double_dart_web(s, design["position"], mea);
    }
      double_main_dart(s, design["dartstyle"], design["position"], mea, design.length);
      return s;
  }
  /*
  if (design_neckline.type === "square"){
    main_neckline(s, design_neckline);
  }
  s.remove_point(s.data.pt);
  delete s.data.pt;*/
  return s;
};


function double_main_dart(s, design, position, mea, length){
  if (eva.eval_waistline_dart(position)){
    let dart = utils.get_waistline_dart(s);
    lengthen.lengthen_top_with_dart(s, mea, length, dart);
  } else {
    lengthen.lengthen_top_without_dart_new(s, mea, length);
  }

  main_dart(s, design, position);
};


function main_dart(s, design, position){
  if(design === "normal"){
    dart.dart(s, position);
  } else if (design === "tuck"){
    dart.tuck_dart(s, position);
  }
  return s;
}

// wird aufgerufen, wenn
function main_merge(front, back, design){
  // erstes ist außen
  let s;
  if(design["type"] === "styleline"){
    if (design["closed"]){
      s = top.styleline_merge(back[1], front[1]);
      s.data.closed = true;
      return [back[0], s, front[0]];
    }
    return [back[0], back[1], front[1], front[0]];
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

// benutzt
function main_neckline(s, design){
  design = design["type"];
  let without_changeing_shoulder = ["round", "staps"];
//  let not_possible_with_shoulder_dart = ["V-Line wide", "round wide", "boat", "square"];

// Bedingungen hier gerne uberarbeiten!!!!!
    if (design === "square" && s.data.shoulder_dart){
      neck.square_shoulder_dart(s);

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
};



export default {main_top, main_sleeve, main_merge, paste_sketches};
