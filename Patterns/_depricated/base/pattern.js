
import Sketch from '../../../Core/StoffLib/sketch.js';
import { Vector } from '../../../Core/StoffLib/geometry.js';
import utils from '../funs/utils.js';
import dart from '../darts/simple_dart.js';
import annotate from '../annotate/annotate.js';

import SingleDart from '../shirt/single_dart.js';
import DoubleDart from '../shirt/double_dart.js';
import Styleline from '../shirt/styleline.js';
import WithoutDart from '../shirt/without_dart.js';
import Middle from '../shirt/middle.js';

export default class Pattern{
  constructor(measurements = {}, design_front = {}, design_back = {}){
      this.mea = measurements;
      this.measurements = measurements;
      this.design_front = design_front;
      this.design_back  = design_back;

      let front = this.parse_pattern_type("front", this.design_front);
      let back = this.parse_pattern_type("back", this.design_back);

      this.components = front.concat(back);

  }


  parse_pattern_type(side, design_data){
    console.log(design_data);
    const type = design_data.dartAllocation.type;
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

    throw new Error("Invalid config input");
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
      if(elem.dartstyle() === "tuck"){
        this.tuck(elem.get_sketch());
      } else {
        this.dart(elem.get_sketch());
      }
    });

    this.components.forEach((elem) => {
      elem.seam_allowance(elem.get_sketch());
      this.remove_unnessesary_things(elem.get_sketch());
    });
    this.components.forEach((elem) => {
      if (elem instanceof Middle){
      //  this.seam_allowance(elem.get_sketch());
        this.components.push(elem.mirror());
      } else {
        elem.mirror();
        elem.seam_allowance_after_mirror(elem.get_sketch());
      }
    });
    /*this.seam_allowance_after_mirror(elem.get_sketch());
    */


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


  dart(s){
    let lines = s.lines_by_key("type").dart;
    lines = utils.sort_dart_lines(lines);
    while(lines.length > 0){
      this.fill_in_dart(s, [lines[0], lines[1]]);
      dart.single_dart(s, [lines[0], lines[1]]);
      annotate.annotate_dart(s, [lines[0], lines[1]]);
      lines.splice(0, 2);
    }
    annotate.remove_dart(s);
    this.connect_filling(s);

  }
  tuck(s){
    let lines = s.lines_by_key("type").dart;
    lines = utils.sort_dart_lines(lines);
    while(lines.length > 0){
      this.fill_in_dart(s, [lines[0], lines[1]]);
      dart.simple_tuck(s, [lines[0], lines[1]]);
      annotate.annotate_tuck(s, [lines[0], lines[1]]);
      lines.splice(0, 2);
    }
    annotate.remove_dart(s);
    this.connect_filling(s);
    
  }

  connect_filling(s){
    let lines = s.lines_by_key("type").filling;
    if (lines){
      lines.forEach((line) => {
        let ln1 = line.p1.other_adjacent_line(line);
        let ln2 = line.p2.other_adjacent_line(line);

        if(line.get_endpoints().includes(ln1.p2)){
          ln1 = s.merge_lines(
            ln1, line, true,
            (data_ln1, data_line) => {
              return data_ln1;
            }
          );
            s.merge_lines(ln1, ln2, true, (data_ln1, data_l2) => {
                return data_ln1;
            });

        } else {
          ln2 = s.merge_lines(
            ln2, line, true,
            (data_ln1, data_line) => {
              return data_ln1;
            }
          );
            s.merge_lines(ln2, ln1, true, (data_ln1, data_l2) => {
                return data_ln1;
            });


        }

      });
    }
  }


  fill_in_dart(s, lines){

    if(lines[0].data.dartposition === "waistline"){
      let other_lines = s.lines_by_key("type").dart_bottom;
      if (other_lines){
        if (other_lines[0].p1 !== other_lines[1].p1){
          let ln1 = s.line_between_points(lines[0].p1, other_lines[0].p1);
          ln1.data.side = "inner";
          let ln2 = s.line_between_points(lines[0].p1, other_lines[1].p1);
          ln2.data.side = "outer";
          let data1 = other_lines[0].data;
          let data2 = other_lines[1].data;
          s.remove(other_lines[0], other_lines[1]);
          dart.fill_in_dart(s, [ln1, ln2]).data.type = "filling";

          s.line_between_points(ln1.p2, lines[1].p2).data = data1;
          s.line_between_points(ln2.p2, lines[0].p2).data = data2;
          s.remove(ln1, ln2);
        } else {
          return;
        }
      } else {
        dart.fill_in_dart(s, lines).data.type = "filling";
      }
    } else {
      dart.fill_in_dart(s, lines).data.type = "filling";
    }
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
