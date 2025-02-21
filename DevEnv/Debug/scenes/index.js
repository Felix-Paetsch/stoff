import Sketch from "../../../StoffLib/sketch.js";
import {Vector} from "../../../StoffLib/geometry.js"

export default function() {
    const s = new Sketch();
    const pts =  [s.add(0,0), s.add(1, 0)];
    
    const l = s.plot(...pts, (x) => Math.sin(2*Math.PI*x));

    s.copy(l).smooth_out(.2);
    s.copy(l).smooth_out(.6);
    s.copy(l).smooth_out(1);
    s.copy(l).smooth_out(1.3);
    s.copy(l).smooth_out(1.7);
    s.copy(l).smooth_out(2.5);
    s.copy(l).smooth_out(3);

    return s;
}
