import Sketch from "../StoffLib/sketch.js";
import { _calculate_intersections } from "../StoffLib/unicorns/intersect_lines.js"

export default function(){
    const s = new Sketch();
    const p1 = s.add(0,0);
    const p2 = s.add(1,0);
    const p3 = s.add(0.7,0.5);

    const l1 = s.plot(p1, p2, x => 0.3*Math.sin(2*Math.PI*x));
    const l2 = s.line_between_points(p1, p2);
    
    s.add_point(l1.closest_position(p3)).set_color("red");

    return s;
}