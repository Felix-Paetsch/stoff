import Sketch from "../../../StoffLib/sketch.js";
import {Vector} from "../../../StoffLib/geometry.js"

export default function() {
    const s = new Sketch();
    const pts =  [s.add(0,0), s.add(0,1)];
    
    const l = s._line_between_points_from_sample_points(...pts, [
        new Vector(0,0), new Vector(0,1), new Vector(1,1), new Vector(1,2), new Vector(2,2)
    ]);

    l.renormalize(0.05);
    s.copy(l).smooth_out(0.2);

    return s;
}
