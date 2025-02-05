import Sketch from "../../StoffLib/sketch.js";
import {UP, LEFT, RIGHT} from "../../StoffLib/geometry.js"

export default function() {
    const s = new Sketch();
    const pts = [];
    const k = 1;
    const n = 5;

    s.dev.start_recording();
    for (let i = 2*k; i < 2 * n; i++){
        if (i % 2 == 0){
            pts.push(s.add_point(i, i))
        } else {
            pts.push(s.add_point(i - 0.5, i - 0.5))
        }
    }

    for (let i = 0; i < n - k; i++) {
        s.line_from_function_graph(
            pts[2*i], pts[2*i + 1],
            t => Math.sin(6*t),
            t => Math.sin(2.8*(i+k)*t)
        );

        s.data.index = i;
    }
    
    s.dev.stop_recording().at_url("/test");

    console.log(UP.rotate(Math.PI/2).equals(RIGHT));

    return s;
}
