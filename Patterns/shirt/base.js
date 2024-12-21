import Pattern from "../core/pattern.js";
import Sketch from "../core/sewing_sketch.js";

import utils from '../funs/utils.js';
import dart from '../darts/simple_dart.js';
import { assert } from "../../Debug/validation_utils.js";

import Middle from '../shirt/middle.js';
import { Vector } from '../../StoffLib/geometry.js';

export default class ShirtBase extends Pattern{
    constructor(measurements, config){
        super(measurements, config);
        this.sketch = new Sketch();
    }

    build_from_side_component(SideComponent){
        this.components.push(
            new SideComponent("front", this),
            new SideComponent("back", this)
        );

        this.render = () => {
            this.components.forEach((component) => {
                this.remove_unnessesary_things(component.get_sketch());
                const uf = component.unfolded_sketch();
                uf.anchor();
                this.sketch.paste_sketch(uf);
            });
        
            this.sketch.decompress_components();
            this.sketch.remove_anchors();

            return this.sketch;
        }
    }

    render(){
        throw new Error("Unimplemented");
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