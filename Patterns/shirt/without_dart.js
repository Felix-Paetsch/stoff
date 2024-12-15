
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector, rotation_fun, triangle_data } from '../../StoffLib/geometry.js';
import { spline } from "../../StoffLib/curves.js";

import TShirtBasePattern from "../base/t-shirt_base.js";

import {line_with_length, point_at, get_point_on_other_line2} from '../funs/basicFun.js';

import sleeve from '../sleeves/simple_sleeve.js';
import utils from '../funs/utils.js';
import top from '../top/simple_top.js';
import lengthen from '../lengthen/top.js';


import { split, split_tip} from '../funs/simple_split.js';


export default class WithoutDart extends TShirtBasePattern{
  constructor(mea, design, side = "front"){
    super(mea, design["top designs"].ease, design, side);

    this.shift_dart();
    this.set_grainline_basic();
    this.lengthen();
  }


  shift_dart(){
    top.without_dart(this.get_sketch());
  }

  lengthen(){
    lengthen.lengthen_top_without_dart_new(this.get_sketch(), this.mea, this.get_length());
  }

  mirror(){
    let lines = this.get_sketch().lines_by_key("type");
    let fold = lines.fold[0];
    let fold_bottom = lines.fold_bottom[0];
    let line = this.get_sketch().merge_lines(fold_bottom, fold, true);

    this.sketch = utils.mirror_on_fold(this.get_sketch());
  };

}
