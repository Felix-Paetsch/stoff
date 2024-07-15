import Sketch from "../StoffLib/sketch.js";
import { _calculate_intersections } from "../StoffLib/unicorns/intersect_lines.js"

export default function(){
    const s = new Sketch();
    s.sample_density = 0.0001;
    const p1 = s.add(0,0);
    const p2 = s.add(1,0);
    const p3 = s.add(0,1);
    const p4 = s.add(1,1);

    const l1 = s.plot(p1, p4, x => 0.5*Math.sin(80*Math.PI*x));
    const l2 = s.plot(p2, p3, x => 0.5*Math.sin(79*Math.PI*x));

    s.intersect_lines(l1, l2);
    return s;
}