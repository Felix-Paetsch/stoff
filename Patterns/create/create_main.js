import { Vector, vec_angle, rotation_fun , rad_to_deg} from '../../StoffLib/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';
import { spline } from "../../StoffLib/curves.js";

import utils from '../funs/utils.js';
import {line_with_length} from '../funs/basicFun.js';
import pattern_top from '../top/pattern_top.js';

import {TShirtBasePatternFront, TShirtBasePatternBack} from '../base/t-shirt_base.js';

import ObjData from '../base/obj_data.js';
import Pattern from '../base/pattern.js';

import change from './create_basic_pattern.js';




const obj_data_front = {
  'top designs': {
    type: 'without dart',
    position: 'waistline',
    styleline: 'panel',
    closed: false,
    dartstyle: 'normal',
    length: 0.9,
    ease: 8
  },
  neckline: { type: 'boat' },
  sleeve: { type: 'straight', length: 0.5 }
};

const obj_data_back = {
  'top designs': {
    type: 'without dart',
    position: 'waistline',
    styleline: 'panel',
    closed: false,
    dartstyle: 'normal',
    length: 0.9,
    ease: 8
  },
  neckline: { type: 'round' },
  sleeve: { type: 'straight', length: 0.5 }
};




function basic_pattern(mea, data){
//  const front = new TShirtBasePatternFront(mea, obj_data_front["top designs"].ease, obj_data_front).get_sketch();
//  const back = new TShirtBasePatternBack(mea, obj_data_front["top designs"].ease, obj_data_back).get_sketch();

//  change.change_front_and_back(front, back, obj_data_front, obj_data_back);
const design_data = new ObjData(data);
  const design_data2 = new ObjData(data);

//  design_data2.set_styleline("waistline", 0.35, "neckline", 0.7);
  const type = data["top designs"].type;
  let front = new Pattern(mea, design_data, design_data2);




  //console.log(front.sketch)
  return front.finish_pattern_for_print();
}





function annotate_and_finisch_pattern(arr){

}





export default {

  basic_pattern,
  annotate_and_finisch_pattern
}
