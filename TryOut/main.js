import { Vector } from '../Geometry/geometry.js';
import { Sketch } from '../StoffLib/sketch.js';

function main(){
    const s = new Sketch();
    const p0 = s.point(0,0);

    const p1 = s.point(100,50);
    s.line_between_points(p0, p1);
    const new_s = new_sketch();
    s.paste_sketch(new_s, null, new Vector(20, 50));
    console.log(s.data);
    return s;
}

function new_sketch(){
    const s = new Sketch();
    const p0 = s.point(0,0);
    const p1 = s.point(10,0);
    const p2 = s.point(10,10);
    s.line_between_points(p0, p1);
    s.line_between_points(p2, p1);
    s.line_between_points(p0, p2);

    s.data = {
        "some": "random",
        "point": p0
    }
    return s;
}

main().save_as_png("renders/out.png", 500, 500);