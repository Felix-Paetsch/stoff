import { Vector, vec_angle, rotation_fun , rad_to_deg} from '../../StoffLib/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';
import { spline } from "../../StoffLib/curves.js";

import utils from '../funs/utils.js';
import {line_with_length} from '../funs/basicFun.js';
import pattern_top from '../top/pattern_top.js';

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
  neckline: { type: 'round' },
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



function set_type(type, front){
  if(front){
    this.obj_data_front["top designs"].type = type;
  } else {

  }
}

function set_position(type, position, front){
  if(front){
    this.obj_data_front["top designs"].position = type;
    this.obj_data_front["top designs"].percent = position;
  } else {
    this.obj_data_back["top designs"].position = type;
    this.obj_data_back["top designs"].percent = position;
  }
}

function set_styleline(type, front){
  if(front){
    this.obj_data_front["top designs"].styleline = type;
  } else {
    this.obj_data_back["top designs"].styleline = type;
  }
}

function set_closed(bool, front){
  if(front){
    this.obj_data_front["top designs"].closed = bool;
  } else {
    this.obj_data_back["top designs"].closed = bool;
  }
}

function set_dartstyle(type, front){
  if(front){
    this.obj_data_front["top designs"].dartstyle = type;
  } else {
    this.obj_data_back["top designs"].dartstyle = type;
  }
}

function set_ease(width, front){
  if(front){
    this.obj_data_front["top designs"].ease = width;
  } else {
    this.obj_data_back["top designs"].ease = width;
  }
}

function set_length(len, front){
  if(front){
    this.obj_data_front["top designs"].length = len;
  } else {
    this.obj_data_back["top designs"].length = len;
  }
}

function set_neckline(type, front){
  if(front){
    this.obj_data_front["top designs"].neckline = type;
  } else {
    this.obj_data_back["top designs"].neckline = type;
  }
}



function basic_pattern(mea){
  const front = pattern_top.first_pattern(mea, obj_data_front["top designs"].ease, true);
  const back = pattern_top.first_pattern(mea, obj_data_back["top designs"].ease, false);

  change.change_front_and_back(front, back, obj_data_front, obj_data_back);

  return [front, back];
}





function annotate_and_finisch_pattern(arr){

}





export default {
  set_type,
  set_position,
  set_styleline,
  set_closed,
  set_dartstyle,
  set_ease,
  set_length,
  set_neckline,
  basic_pattern,
  annotate_and_finisch_pattern
}
