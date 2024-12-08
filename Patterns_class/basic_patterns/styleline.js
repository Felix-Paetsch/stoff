import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector, rotation_fun, triangle_data , vec_angle} from '../../StoffLib/geometry.js';
import { spline } from "../../StoffLib/curves.js";

import TShirtBasePattern from "../base/t-shirt_base.js";
import Middle from './middle.js';

import {line_with_length, point_at, get_point_on_other_line2} from '../funs/basicFun.js';

import sleeve from '../sleeves/simple_sleeve.js';
import utils from '../funs/utils.js';
import neck from '../neckline/neckline.js';
import top from '../top/simple_top.js';
import lengthen from '../lengthen/top.js';


import { split, split_tip} from '../funs/simple_split.js';


export default class Styleline extends TShirtBasePattern{
  constructor(mea, design, side = "front"){
    super(mea, design["top designs"].ease, design, side);

    this.parse_design_position();
    this.set_grainline_basic();
    this.split_into_styleline();
    this.lengthen();

    /*
    this.shift_dart();
    */

  }

  #calculate_upright_position(s){
    // finden, bei wie viel % der Abnäher liegen muss, damit er genau Senkrecht liegt
    let lines = s.lines_by_key("type").dart;

    lines = utils.sort_dart_lines( lines); // [0] ist am weitesten außen
    let dist = lines[0].p2.subtract(lines[1].p2).length();
    if(s.data.dartposition !== "waistline"){
      dist = dist/2;
    }

    let waist_inner = s.lines_by_key("type").waistline;
    let waist_width = waist_inner[0].get_length() + waist_inner[1].get_length();
    waist_inner = waist_inner.filter(ln => ln.data.side === "inner")[0];

    let val = waist_inner.get_length() - (dist / 2);
    let percent = val/waist_width;

    return percent;
  }


  parse_design_position(){
    let design = this.design["top designs"].styleline;
    if (design === "classic princess"){
      this.design.side = "waistline";
      this.design.percent = this.#calculate_upright_position(this.get_sketch());
      this.design.secondside = "shoulder";
      this.design.secondpercent = 0.5;
    } else if (design === "panel"){
      this.design.side = "waistline";
      this.design.percent = 0.55;
      this.design.secondside = "armpit";
      this.design.secondpercent = 0.4;
    }
  }


  split_into_styleline(){
    // Es muss immer über die Taille gehen, sonst kann man das mit dem Teilen
    // gleich vergessen
    // Später kann man schauen, ob man Teilt, aber nicht über den Abnäherpunkt
    // geht, für Jetzt ist diese Zusätzliche Variante zu viel Aufwand
    top.waistline_simple_dart(this.get_sketch(), this.dartposition());
    let angle = this.#get_angle();
    let patterns = top.split_pattern(this.get_sketch(), this.seconddartside(), this.seconddartposition());
    this.multipart = true;
    this.first_part = new Middle(patterns[1], this.mea, this.design, this.config);
    this.sketch = patterns[0];
    this.#rotate_middle(angle);
    // Maybe CutOfClass even inherits from this class - your choice
    // oder this.parts = patterns.map(p => CutOfClass3(p))
  }


  dartside(){
    return this.design.side;
  }

  seconddartside(){
    return this.design.secondside;
  }

  dartposition(){
    return this.design.percent;
  }

  seconddartposition(){
    return this.design.secondpercent;
  }

  set_positions(first, second, percentfirst, percentsecond){
    this.design.side = first;
    this.design.secondside = second;
    this.design.percent = percentfirst;
    this.design.secondpercent = percentsecond;
  }

  get_splitted_part(){
    let part = this.first_part;
    delete this.first_part;
    return part;
  }


  #rotate_middle(angle){
    let s = this.first_part.get_sketch();
    let dart = s.lines_by_key("type").dart[0];
    utils.rotate_zhk(s, angle, dart.p1);
  }

  #get_angle(){
    let darts = this.sketch.lines_by_key("type").dart;
    let angle = vec_angle(darts[0].get_line_vector(), darts[1].get_line_vector());
    return angle/2;
  }

  lengthen(){
    
  };


  mirror(){

  };
}
