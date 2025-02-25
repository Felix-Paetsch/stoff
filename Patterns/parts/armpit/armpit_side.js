import { Vector } from "../../../Core/StoffLib/geometry.js";
import { spline } from "../../../Core/StoffLib/curves.js";
import PatternPart from "../../core/pattern_part.js";

export default class ArmpitSide extends PatternPart{
    constructor(parent, ...args){
        super(parent);
        if (args.length > 0){
            this.args = args;
            this.construct_base_neckline(...args);
        }
    }
    
    construct(){
        const s = this.get_sketch();
        let shoulder = this.get_line("shoulder");
        let side = this.get_line("side");
        let c = shoulder.p2;
        let e = side.p1;
        let p5 = this.sketch.data.base_p5;
        let p6 = this.sketch.data.base_p6;
        p6.move_to(p6.add(new Vector(0, -1)))
        let len = c.distance(p5);
        let vec1 = shoulder.get_line_vector().get_orthonormal().scale(len).add(c).add(shoulder.get_line_vector().scale(0.1));
        let vec2 = side.get_line_vector().get_orthonormal().scale(-len).add(e);
    
        let temp = s.add_point(p5.add(new Vector(0, 20)));
        let l1 = s.line_between_points(p5, temp);
        let temp2 = s.add_point(p6.add(new Vector(20, 0)));
        let l2 = s.line_between_points(p6, temp2);
        let p = s.intersection_positions(l1, l2)[0];
        let len1 = p.subtract(c).length() / 3;
        let len2 = p.subtract(e).length() /3;
    
        p5.move_to(p.add(new Vector(0,  -len1)));
        p6.move_to(p.add(new Vector(-len2, 0)));
    
        let curve = s.line_from_function_graph(c, e, spline.catmull_rom_spline(
        [c, p5, p6, e], vec1, vec2
        ));
    
        s.remove(temp, temp2, p5, p6);
        delete s.data.base_p5;
        delete s.data.base_p6;
        curve.data.type = "armpit";
        return s;
    }
}