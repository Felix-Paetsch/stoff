import Sketch from "../../../StoffLib/sketch.js";

export default function() {
    const s = new Sketch();
    const pts =  [s.add(0,0), s.add(1, 0)];
    
    const l = s.plot(...pts, (x) => Math.sin(3*Math.PI*x));

    s.dev.hot_at_url("/hot_simple");
    s.copy(l).smooth_out(.2);
    s.copy(l).smooth_out(.6);
    s.copy(l).smooth_out(1);
    s.copy(l).smooth_out(1.3);
    s.copy(l).smooth_out(1.7);
    s.copy(l).smooth_out(2.5);
    s.copy(l).smooth_out(2);

    return s;
}
