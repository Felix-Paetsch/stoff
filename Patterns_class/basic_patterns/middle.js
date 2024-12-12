
import sleeve from '../sleeves/simple_sleeve.js';
import utils from '../funs/utils.js';
import neck from '../neckline/neckline.js';
import top from '../top/simple_top.js';
import lengthen from '../lengthen/top.js';
import seam from '../seam_allowance/simple_seam.js';


import { Vector, rotation_fun, triangle_data } from '../../StoffLib/geometry.js';

import PatternComponent from "../base/pattern_component.js";

import { split, split_tip} from '../funs/simple_split.js';

import {line_with_length} from '../funs/basicFun.js';


export default class Middle extends PatternComponent{
  constructor(sketch, mea, design, config){
    super(mea, config, design);
    this.sketch = sketch;

    this.set_grainline_basic();
  }


  get_sketch(){
      return this.sketch;
  }



  set_grainline(vec){
    this.sketch.data.up_direction = vec;
  }

  set_grainline_basic(){
    this.set_grainline_upwards();
  };

  set_grainline_upwards(){
      this.sketch.data.up_direction = new Vector(0, -1);
  }


  mirror(){
    let new_middle = this.copy();
    utils.mirror_sketch(new_middle.get_sketch());
    return new_middle;
  };


  copy(){
    let elem = new Middle(this.sketch.copy(), this.mea, this.design, this.config);
    return elem;
  }

  // soll je nach Art der Linie (seite, hals, saum) unterschiedliche
  // längen an Nahtzugabe geben
  seam_allowance(s){
    let seam_allowances = {
      neckline: 0.5,
      armpit: 1,
      hem: 2,
      side: 1
    };
    seam.seam_allowance_middle(s, seam_allowances);
  }


  // muss noch genauer angesehen und überarbeitet werden
  lengthen(len_bottom, len_side_addition, len_side){
    lengthen.lengthen_middle(this.get_sketch(), len_bottom, len_side_addition, len_side);
    lengthen.correct_belly_middle(this.get_sketch(), this.mea);
  }

  shorten(){
    let fold_bottom = this.get_sketch().lines_by_key("type").fold_bottom;
    this.get_sketch().merge_lines(fold_bottom[0], fold_bottom[1], true);
    lengthen.shorten_length_new(this.get_sketch(), this.design["top designs"].length);
    let s = this.get_sketch();
  //  s.lines_by_key("type").dart[0].set_color("red")
    utils.merge_to_curve(s, s.lines_by_key("type").dart.concat(s.lines_by_key("type").fold_bottom));
  }
}