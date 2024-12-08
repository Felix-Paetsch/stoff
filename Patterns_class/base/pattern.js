
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector, rotation_fun, triangle_data } from '../../StoffLib/geometry.js';
import { spline } from "../../StoffLib/curves.js";


import {line_with_length, point_at, get_point_on_other_line2} from '../funs/basicFun.js';

import sleeve from '../sleeves/simple_sleeve.js';
import utils from '../funs/utils.js';
import neck from '../neckline/neckline.js';
import top from '../top/simple_top.js';
import lengthen from '../lengthen/top.js';
import dart from '../darts/simple_dart.js';


import { split, split_tip} from '../funs/simple_split.js';

import SingleDart from '../basic_patterns/single_dart.js';
import DoubleDart from '../basic_patterns/double_dart.js';
import Styleline from '../basic_patterns/styleline.js';
import WithoutDart from '../basic_patterns/without_dart.js';

export default class Pattern{
  constructor(measurements = {}, design_front = {}, design_back = {}){
      this.mea = measurements;
      this.measurements = measurements;
      this.design_front = design_front.get();
      this.design_back = design_back.get();
      let front = this.parse_pattern_type("front", this.design_front);
      let back = this.parse_pattern_type("back", this.design_back);

      this.components = front.concat(back);

  }


  parse_pattern_type(side, design_data){
    const type = design_data["top designs"].type;
    let arr = [];
    if(type === "without dart"){
      return [new WithoutDart(this.mea, design_data, side)];
    } else if (type === "single dart"){
      return [new SingleDart(this.mea, design_data, side)];
    } else if (type === "double dart"){
      return [new DoubleDart(this.mea, design_data, side)];
    } else if (type === "styleline"){
      arr.push(new Styleline(this.mea, design_data, side));
      let temp = arr[0].get_splitted_part();
      arr.push(temp);
      arr.reverse();
      return arr;
    }
  }


  get_components(){
    return this.components;
  }

  get(name, side){
    return this.components.filter(elem => elem.name() === name).filter(elem => elem.side() === side)[0];
  }


  finish_pattern_for_print(){
    let s = new Sketch();


    this.components.filter(elem => elem.dart === true).forEach((elem) => {
      this.dart(elem.get_sketch());
      this.dart_trim(elem.get_sketch());
    });

    this.components.forEach((elem) => {
      this.seam_allowance(elem.get_sketch());
      this.remove_unnessesary_things(elem.get_sketch());
    });

    this.components.forEach((elem) => {
      elem.mirror();
    });


    return this.paste_sketches(s, this.components);

  }

  paste_sketches(s, arr){
    let [sk] = arr.splice(0,1);
    sk = sk.get_sketch();

    s.paste_sketch(sk, null, new Vector(0,0));
    arr.forEach((i) => {
      utils.position_sketch(s, i.get_sketch());
    });

  return s;
  }


// Aktuell macht diese Funktion noch nichts, soll aber am Ende alle Teile die
// es noch brauchen die zusätzlichen Linien des Abnähers hinzufügen
  dart_trim(s){

  }

  dart(s){
    let lines = s.lines_by_key("type").dart;
    lines = utils.sort_dart_lines(lines);
    while(lines.length > 0){
      s.remove(dart.single_dart(s, [lines[0], lines[1]]));
      lines.splice(0, 2);
    }
  }


// aktuell auch noch nicht programmiert
// soll je nach Art der Linie (seite, hals, saum) unterschiedliche
// längen an Nahtzugabe geben
  seam_allowance(s){

  }

// später ggf. anders umsetzen, erstmal übergangsfunktion zum schön sein
  remove_unnessesary_things(s){
    s.remove(s.data.pt);
    delete s.data.pt;

    let waistlines = s.lines_by_key("type").waistline;

    if (waistlines){
      waistlines.forEach((ln) => {
        s.remove(ln);
      });
    }


  }
}
