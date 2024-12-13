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

import seam from '../seam_allowance/simple_seam.js';


import { split, split_tip} from '../funs/simple_split.js';


export default class Styleline extends TShirtBasePattern{
  constructor(mea, design, side = "front"){
    super(mea, design["top designs"].ease, design, side);

    this.parse_design_position();
    this.set_grainline_basic();
    this.split_into_styleline();
    this.lengthen();
    this.shorten();
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
    if(!this.design.percent){
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
    this.first_part = new Middle(patterns[1], this.sh, this.design, this.config, this.seam_allowances);
    this.sketch = patterns[0];
    this.#rotate_middle(angle);
    /*
    */
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
    const s = this.get_sketch();
    let lines = s.lines_by_key("type");
    let darts = lines.dart;
    if(darts){
      darts.forEach(elem =>{
        elem.data.type = "side";
      });
    }
    let waistline = lines.waistline[0];
    let ratio_front = waistline.get_length()/(this.sh.waist/2);
    let add_len_f = 2 * (1- ratio_front);

    let ln1_len_f = (this.sh.bottom / 2)* ratio_front;
    let fold_bottom = line_with_length(s, waistline.p1, this.sh.waist_height + 2, 0).set_color("green");
    fold_bottom.data.type = "fold_bottom";

    let vec = this.get_vec(fold_bottom.p2, waistline.p2, ln1_len_f, this.sh.waist_height + add_len_f);

    let p1 = s.add_point(vec);
    let bottom = s.line_between_points(fold_bottom.p2, p1);
    let side_bottom = s.line_between_points(waistline.p2, p1);
    bottom.data.type = "bottom";
    side_bottom.data.type = "side_bottom";
    lengthen.correct_belly(s, this.sh, ratio_front);

    this.first_part.lengthen(((this.sh.bottom /2) - ln1_len_f), this.sh.waist_height + add_len_f, this.sh.waist_height);
  }

  // muss noch genauer angesehen und überarbeitet werden
  get_vec(p1, p2, len1, len2){
    let diff = p1.subtract(p2).length();

    let angle = triangle_data({a: diff, b: len2, c: len1}).beta;
    let fun = rotation_fun(p1, -angle);

    return fun(p2).subtract(p1).normalize().scale(len1).add(p1);

  };


  // Wenn man die Falte an der gespiegelt werden soll zerscheidet, kann es sein, dass
  // gar nicht oder falsch gespiegelt wird.
  // Das ganze System muss also überarbeitet werden
  mirror(){
    let lines = this.get_sketch().lines_by_key("type");
    let fold = lines.fold[0];
    let fold_bottom = lines.fold_bottom[0];
    let line = this.get_sketch().merge_lines(fold_bottom, fold, true);

    this.sketch = utils.mirror_on_fold(this.get_sketch());
  };


  shorten(){
    this.get_sketch().lines_by_key("type").side[1].data.type = "side_bottom";
    lengthen.shorten_length_new(this.get_sketch(), this.design["top designs"].length);
    this.first_part.shorten();
  };

  // soll je nach Art der Linie (seite, hals, saum) unterschiedliche
  // längen an Nahtzugabe geben
  seam_allowance(s){

    let lines = s.lines_by_key("type");
    lines.side[0].data.s_a = "side";
    lines.shoulder[0].data.s_a = "side";

    if (lines.armpit){
      lines.armpit[0].data.s_a = "armpit";
      seam.seam_allow(s, [lines.side[0], lines.armpit[0], lines.shoulder[0]], this.seam_allowances);
    } else {
      seam.seam_allow(s, [lines.side[0], lines.shoulder[0]], this.seam_allowances);

    }
  }


}
