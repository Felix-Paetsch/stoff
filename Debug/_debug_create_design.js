import Sketch from "../StoffLib/sketch.js";

export default function(){
    const s = new Sketch();
    s.sample_density = 0.04;
    const p1 = s.add(0,0);
    const p2 = s.add(1,2);
    const p3 = s.add(1,0);
    const p4 = s.add(0,1);
    const l1 = s.line_between_points(p1, p2);
    const l2 = s.line_between_points(p1, p2);
    const r = s.intersect_lines(l1, l2);
    return s;
}