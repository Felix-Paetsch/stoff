
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector, rotation_fun, triangle_data } from '../../StoffLib/geometry.js';
import { spline } from "../../StoffLib/curves.js";

import TShirtBasePattern from "../base/t-shirt_base.js";

import {line_with_length, point_at, get_point_on_other_line2} from '../funs/basicFun.js';

import sleeve from '../sleeves/simple_sleeve.js';
import utils from '../funs/utils.js';
import neck from '../neckline/neckline.js';
import top from '../top/simple_top.js';
import lengthen from '../lengthen/top.js';


import { split, split_tip} from '../funs/simple_split.js';


export default class DoubleDart extends TShirtBasePattern{
  constructor(mea, design, side = "front"){
    super(mea, design["top designs"].ease, design, side);
    this.dart = true;

  //  sleeve.armpit(this.get_sketch());

    this.parse_design_position();
    this.shift_dart();
    if (this.switch_io_dart){
      let dart = this.get_sketch().lines_by_key("type").dart.filter(elem => elem.data.dartposition === this.switch_io_dart);
      utils.switch_inner_outer_dart(dart);
    }

    this.set_grainline_basic();
    this.lengthen();
  };



    parse_design_position(){
      if(this.design["top designs"].percent){
        // dieser Fall tritt nur auf, wenn bereits selber änderungen vorgenommen wurden
        // noch unsicher, ob zusätzliche änderungen vorgenommen werden müssen
      } else {
        switch (this.design["top designs"].position) {
          case "waistline":
            this.design.percent = this.#calculate_upright_position(this.get_sketch());
            this.design.side = "waistline";
            break;
          case "french":
            this.design.percent = 0.9;
            this.design.side = "side";
            this.switch_io_dart = "side";
            break;
          case "side middle":
            this.design.percent = 0.3;
            this.design.side = "side";
            break;
          case "shoulder":
            this.design.percent = 0.5;
            this.design.side = "shoulder";
            break;

          case "waistline and side middle":
            this.design.percent = this.#calculate_upright_position(this.get_sketch());
            this.design.side = "waistline";
            this.design.secondpercent = 0.3;
            this.design.secondside = "side";
            break;
          case "waistline and french":
            this.design.percent = this.#calculate_upright_position(this.get_sketch());
            this.design.side = "waistline";
            this.design.secondpercent = 0.9;
            this.design.secondside = "side";
            this.switch_io_dart = "side";
            break;
          case "waistline and shoulder":
            this.design.percent = this.#calculate_upright_position(this.get_sketch());
            this.design.side = "waistline";
            this.design.secondpercent = 0.5;
            this.design.secondside = "shoulder";
            break;
          case "side middle and shoulder":
            this.design.percent = 0.3;
            this.design.side = "side";
            this.design.secondpercent = 0.5;
            this.design.secondside = "shoulder";
            break;
          case "french and shoulder":
            this.design.percent = 0.9;
            this.design.side = "side";
            this.design.secondpercent = 0.5;
            this.design.secondside = "shoulder";
            break;
          default:
        }
      }
    };

    shift_dart(distribution = 0.5){

      if(!this.seconddartside()){
        top.without_dart(this.get_sketch(), distribution);
      }
      if(this.dartside() === "waistline"){
        top.waistline_simple_dart(this.get_sketch(), this.dartposition());
      } else {
        top.simple_middle_dart(this.get_sketch(), this.dartside(), this.dartposition());
      }

      if (!this.seconddartside()){
        return;
      }

      this.#second_dart(distribution);
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

    // macht den zweiten Abnäher rein, und teilt den Abnäher mit dem
    // gegebenen Verhaeltnis auf
    #second_dart(distribution = 0.5){
      const s = this.get_sketch();
      let lines = s.lines_by_key("type");
      let line = lines[this.seconddartside()][0];
      let percent = this.seconddartposition();

      if(this.seconddartside() === "shoulder" && this.dartside() !== "waistline"){
        utils.switch_inner_outer_dart(s.lines_by_key("type").dart);
      }

      let dart_parts = lines.dart;
      // sollte genau die zwei Schenkel vom Abnäher enthalten von simple_dart_web o.ä.

      let p = s.add_point(s.position_at_length(line, line.get_length() * percent));
      let angle = split(s, line, p);

      let outer = s.lines_by_key("type").dart.filter(ln => ln.data.side === "outer")[0];
      let inner = s.lines_by_key("type").dart.filter(ln => ln.data.side === "inner")[0];
      // ist egal welche von zwei Möglichkeiten hier genommen wird, da
      // beide den selben Punkt als p1 haben
      if (angle > Math.PI){
        utils.rotate_zhk(s, -(angle * distribution) + Math.PI , outer.p1);
      } else {
        utils.rotate_zhk(s, -(angle * distribution) , outer.p1);
      }
      s.merge_points(inner.p1, outer.p1);
      let point = s.add_point(outer.p1.copy());
      dart_parts[0].set_endpoints(point, dart_parts[0].p2);
      dart_parts[1].set_endpoints(point, dart_parts[1].p2);

/*
      if(this.seconddartside() === "shoulder"){
        utils.switch_inner_outer_dart(dart_parts);
      }
      */
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

    set_sides(first, second, percentfirst, percentsecond){
      this.design.side = first;
      this.design.secondside = second;
      this.design.percent = percentfirst;
      this.design.secondpercent = percentsecond;
    }

    lengthen(){
      if (this.dartside() === "waistline"){
        lengthen.lengthen_top_with_dart(this.get_sketch(), this.mea, this.get_length());
      } else {
        lengthen.lengthen_top_without_dart_new(this.get_sketch(), this.mea, this.get_length());
      }
    }

    // Wenn man die Falte an der gespiegelt werden soll zerscheidet, kann es sein, dass
    // gar nicht oder falsch gespiegelt wird.
    // Das ganze System muss also überarbeitet werden
    mirror(){
      let lines = this.get_sketch().lines_by_key("type");
      let fold = lines.fold[0];
      let fold_bottom = lines.fold_bottom;

      if(fold_bottom){
        let line = this.get_sketch().merge_lines(fold_bottom[0], fold, true);
      }

      this.sketch = utils.mirror_on_fold(this.get_sketch());
    };

    seam_allowance(s){
    //  this.get_sketch().lines_by_key("type").side[0].swap_orientation();
      super.seam_allowance(s);
    }

/*
    shorten(){
      if(this.design.side === "waistline"){
        lengthen.shorten_with_dart(this.get_sketch(), this.design["top designs"].length);
      } else {
        lengthen.shorten_length_new(this.get_sketch(), this.design["top designs"].length);
      }
    }*/
};
