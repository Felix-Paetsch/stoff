import Pattern from "../core/pattern.js";
import Sketch from "../../StoffLib/sketch.js";

import utils from '../funs/utils.js';
import dart from '../darts/simple_dart.js';
import { assert } from "../../Debug/validation_utils.js";

import Middle from '../shirt/middle.js';
import { Vector } from '../../StoffLib/geometry.js';

export default class ShirtBase extends Pattern{
    constructor(measurements, config){
        super(measurements, config);
    }

    build_from_side_component(SideComponent){
        this.components.push(
            new SideComponent("front", this),
            new SideComponent("back", this)
        );

        this.render = () => {
            // @TODO
            let s = new Sketch();
  
            this.components.forEach((elem) => {
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
    }

    render(){
        throw new Error("Unimplemented");
    }

    


    // Not cleaned up!!!
  paste_sketches(s, arr){
    let [sk] = arr.splice(0,1);
    sk = sk.get_sketch();

    s.paste_sketch(sk, null, new Vector(0,0));
    arr.forEach((i) => {
      utils.position_sketch(s, i.get_sketch());
    });

  return s;
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

remove_unnessesary_things(s){
    let waistlines = s.lines_by_key("type").waistline;

    if (waistlines){
      waistlines.forEach((ln) => {
        s.remove(ln);
      });
    }


  }}