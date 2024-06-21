import { Vector, vec_angle_clockwise, rotation_fun } from '../Geometry/geometry.js';
import { Sketch } from '../StoffLib/sketch.js';
import { Point } from '../StoffLib/point.js';
import { ConnectedComponent} from '../StoffLib/connected_component.js';

import top from './top/simple_top.js';
import sleeve from './sleeves/simple_sleeve.js';
import lengthen from './lengthen/top.js';

import utils from './funs/utils.js';


function main_top(s, design, mea){
  sleeve.armpit_new(s);
  if (design["darts"] === "without dart"){
    top.without_dart(s);
    let lines = s.data.comp.lines_by_key("type");
    lines.waistline[0].swap_orientation();
    lengthen.lengthen_top_without_dart(s, mea, 0.5);

  } else if (design["darts"] === "split"){
     top.waistline_simple_dart(s, 0.4);
     //top.simple_middle_dart(s, "fold", 0.5);
     let patterns = top.split_pattern(s, "shoulder", 0.7);

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
  } else if (design["darts"] === "simple dart"){
     top.simple_middle_dart(s, "armpit", 0.75);
     lengthen.lengthen_top_without_dart(s, mea, 0.75);
  } else if (design["darts"] === "waistline simple dart"){
     top.waistline_simple_dart(s, 0.2);
  } else if (design["darts"] === "wiener naht"){
     top.wiener_naht(s);
  }

};


function main_sleeve(s, design){
  if (design === "puffy top"){

  } else if (design === "puffy bottom"){

  } else if (design === "puffy"){

  }

  if (design === "shorten"){
    sleeve.shorten_length(s, 0.6);
  }
}






export default {main_top, main_sleeve};
