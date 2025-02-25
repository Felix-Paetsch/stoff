import { spline } from "../../../Core/StoffLib/curves.js";
import neck from "./neckline_side_options.js";

import PatternPart from "../../core/pattern_part.js";

export default class NecklineSideHalf extends PatternPart{
    constructor(parent, ...args){
        super(parent);

        this.design_config = parent.design_config["neckline"];
        this.side = parent.side;

        if (args.length > 0){
            this.args = args;
            this.construct_base_neckline(...args);
        }
    }

    construct_base_neckline(p1, p2){
        const help1 = this.sketch.point(p1.x, 0.5 * (p2.y + p1.y));

        let help2;
        if(this.sketch.data.is_front){
            help2 = this.sketch.point(0.4 * p2.x + .6 * p1.x, p2.y);
        } else {
            help2 = this.sketch.point(0.6 * p2.x + .4 * p1.x, p2.y);
        }

        let l = this.sketch.line_from_function_graph(p1, p2, spline.bezier(
            [p1, help1, help2, p2]
        ));
        l.data.type = "neckline";
        l.data.curve = true;

        this.sketch.remove(help1, help2);
        return this;
    }

    construct_neckline_type(){
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
        if (neckline_map[design]){
            neckline_map[design][0](this, ...neckline_map[design].slice(1));
        }

        return this;
    }
}