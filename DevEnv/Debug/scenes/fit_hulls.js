import merge_sketches from "../../Patterns/core/merge_sketches/main.js";
import { UP, LEFT, DOWN, RIGHT, Vector } from "../../StoffLib/geometry.js";
import Sketch from "../../StoffLib/sketch.js";

export default function(){
    const hull_amt = 10;
    const vectors_per_hull = 10;
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
    
    const s = new Sketch();

    s.point(UP).set_color("red");
    s.point(LEFT).set_color("green");
    s.point(RIGHT).set_color("blue");
    s.point(DOWN).set_color("purple");
    s.point(UP.mult(2)).set_color("red");
    s.point(LEFT.mult(2)).set_color("green");
    s.point(RIGHT.mult(2)).set_color("blue");
    s.point(DOWN.mult(2)).set_color("purple");
    hulls.push(s);

    const r = merge_sketches(hulls, 0.5, {
        "width": 30
    }, true);

    r.data.height = r.get_bounding_box().height;
    return r;

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