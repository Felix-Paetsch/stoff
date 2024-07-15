import Sketch from "../StoffLib/sketch.js";
import { _calculate_intersections } from "../StoffLib/unicorns/intersect_lines.js"
import { Vector } from "../Geometry/geometry.js";

export default function(){
    const s = new Sketch();
    const p1 = s.add(0,0);
    const p2 = s.add(1,0);
    
    s.plot(p1, p2, (t) => Math.sin(5*t), t => Math.sin(5*t));
    
    return s;
}