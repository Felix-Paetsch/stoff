import Sketch from "../StoffLib/sketch.js";
import { Point } from "../StoffLib/point.js";

export default function(){
    const s = new Sketch();

    const p1 = s.add_point(new Point(0,0));
    const p2 = s.add_point(new Point(5,0));
    const l =  s.plot(p1,p2,(t) => Math.sin(7*t), (t) => t*Math.cos(20*t));
    s.line_with_offset(l, .7, false);
    s.validate();

    return s;
}