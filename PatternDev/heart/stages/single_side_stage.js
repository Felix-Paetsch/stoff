import PatternStage from "../../../PatternLib/pattern_stages/baseStage.js";
import Sketch from "../../../PatternLib/sewing_sketch.js";
import HeartSide from "../heart_side.js";
import { arc } from "../../../StoffLib/curves.js";
import assert from "../../../StoffLib/assert.js";

export default class SingleSideStage extends PatternStage{
    constructor(){
        super();
    }

    on_enter(){
        const s = new Sketch();
        this.wd.sketch = s;

        s.dev.start_recording("/test");

        const pt1 = s.point(0,0);
        const pt2 = s.point(-1,1);
        const pt3 = s.point(0,2);

        const l1 = s.plot(pt1, pt2, arc(-0.5));
        const l2 = s.line_between_points(pt2, pt3);
        s.merge_lines(l1, l2, true);

        this.wd.bottom_point = pt3;
        this.wd.top_point = pt1;
        // Note that somehow this is not the best choice until we have references;
    }

    on_exit(){
        this.wd.sketch.unfold([this.wd.top_point, this.wd.bottom_point], (el, side, _original) => {
            el.data.side = side == "original" ? "left" : "right";
        });
    }

    get_general_heartside(){
        return new HeartSide(this.wd.top_point, this.wd.bottom_point, this.wd.top_point.get_adjacent_line());
    }

    set_length(l){
        assert(l > 0.01, "Point is to close");
        this.wd.bottom_point.move_to(0, l);
        this.wd.bottom_point.get_adjacent_line().stretch(1/this.wd.bottom_point.y);
    }
}