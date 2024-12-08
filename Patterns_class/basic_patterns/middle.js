
import sleeve from '../sleeves/simple_sleeve.js';
import utils from '../funs/utils.js';
import neck from '../neckline/neckline.js';
import top from '../top/simple_top.js';
import lengthen from '../lengthen/top.js';

import { Vector, rotation_fun, triangle_data } from '../../StoffLib/geometry.js';

import PatternComponent from "../base/pattern_component.js";

import { split, split_tip} from '../funs/simple_split.js';


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

  };
}
