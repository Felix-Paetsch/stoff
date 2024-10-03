import Sketch from "../StoffLib/sketch.js";
import { _calculate_intersections } from "../StoffLib/unicorns/intersect_lines.js"
import { Vector } from "../StoffLib/geometry.js";

export default function(){
    const s = new Sketch();

    s.dev.start_recording();

    const p1 = s.point(2,2);
    const p2 = s.point(1,1);
    s.line_between_points(p1, p2);

    s.dev.stop_recording().to_mp4("test.mp4");

    return s;
}