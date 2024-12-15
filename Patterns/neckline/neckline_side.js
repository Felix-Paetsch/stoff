import { spline } from "../../StoffLib/curves.js";
import neck from "./neckline_side_options.js";

import PatternComponent from "../core/pattern_component.js";

/*

    Long term this could be refactored:
    Move construct_base_neckline out of construcor; give 2 Points to the constructor instead of a line.

*/

export default class NecklineSide extends PatternComponent{
    constructor(parent, ...args){
        super(parent);
        this.design_config = parent.design_config["neckline"];
        if (args.length > 0){
            this.args = args;
            this.construct_base_neckline(...args);
        }

        this.side = parent.side;
    }

    construct_base_neckline(base_line){
        let p = this.sketch.point(base_line.p1.x, base_line.p2.y);
        let p2 = this.sketch.point(base_line.p1.x, base_line.p2.y);
        let vec = p.subtract(base_line.p1).scale(0.5);
        p.move_to(vec.add(base_line.p1));
        if(this.sketch.data.is_front){
            vec = p2.subtract(base_line.p2).scale(0.6);
        } else {
            vec = p2.subtract(base_line.p2).scale(0.4);
        }
        p2.move_to(vec.add(base_line.p2));

        let l = this.sketch.line_from_function_graph(base_line.p1, base_line.p2, spline.bezier(
            [base_line.p1, p, p2, base_line.p2]
        ));
        l.data.type = "neckline";
        l.data.curve = true;

        this.sketch.remove(base_line, p, p2);
        return this;
    }

    construct(){
        // Maybe want to move construct_base_neckline(.) here
        const neckline_map = {
            "round":        [neck.slim_neckline, 0.7],
            "V-Line wide":  [neck.v_line, "wide"],
            "V-Line deep":  [neck.v_line, "deep"],
            "V-Line":       [neck.v_line, "normal"],
            "round wide":   [neck.round_wide],
            "square":       [neck.square],
            "boat":         [neck.boat]
        }

        const design = this.design_config.type;
        neckline_map[design][0](this, ...neckline_map[design].slice(1));

        return this;
    }
  
}