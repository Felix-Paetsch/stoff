import Sketch from "../../StoffLib/sketch.js";

export default function() {
    console.time("start");
    const s = new Sketch();
    const pts = [];
    const k = 1;
    const n = 5;
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
    }

    console.time("validate");
    for (let i = 0; i < 100; i++) {
        s.validate();
    }
    console.timeEnd("validate");
    console.timeEnd("start");

    return s;
}
