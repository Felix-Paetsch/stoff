import merge_sketches from "../Patterns/core/merge_sketches/main.js";
import { convex_hull, Vector } from "../StoffLib/geometry.js";
import Sketch from "../StoffLib/sketch.js";

export default function(){

    /*
        const p1 = s.add_point(new Point(0,0));
        const p2 = s.add_point(new Point(5,0));
        const l =  s.plot(p1,p2,(t) => Math.sin(t), (t) => t*Math.cos(8*t));
        s.line_with_offset(l, .7, false);

        const r = s.convex_hull();

        const pts = [];
        for (let i = 0; i < r.length; i++){
            pts.push(s.point(r[i]).set_color("green"));
        }
        for (let i = 0; i < r.length; i++){
            s.line_between_points(pts[i], pts[(i + 1) % r.length]).set_color("green");
        }

        const sketches = [];

        for (let i = 0; i < 3; i++){
            sketches.push(s.copy());
        }
    */

    // =================================

    const hull_amt = 20;
    const vectors_per_hull = 20;
    const max_x = 10;
    const max_y = 10;

    const hulls = (new Array(hull_amt))
            .fill(generateRandomVectors)
            .map(v => v())
            .map(h => {
                const s = new Sketch();
                for (let pt of h){
                    s.point(pt);
                }
                return s;
            });

    return merge_sketches(hulls, 4, true);

    function generateRandomVectors() {
        const vectors = [];
        for (let i = 0; i < vectors_per_hull; i++) {
            const x = Math.random() * max_x;
            const y = Math.random() * max_y;
            vectors.push(new Vector(x, y));
        }
        return vectors;
    }
}