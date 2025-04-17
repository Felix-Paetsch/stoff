import BaseStage from "../../../Core/Stages/base_stages/baseStage.js";
import ConnectedComponent from "../../../Core/StoffLib/connected_component.js";
import { spline, arc } from "../../../Core/StoffLib/curves.js";
import { Vector, triangle_data, rotation_fun, vec_angle_clockwise, vec_angle, deg_to_rad } from "../../../Core/StoffLib/geometry.js";
import assert from "../../../Core/assert.js";



export default class NecklineBaseStage extends BaseStage{
    constructor(t){
        super();
    };


    finish() {
        return this.wd.sketch;
    }


    on_enter(){
        this.sketch = this.wd.sketch;

    }

    v_line(){
        const neckline = this.sketch.get_typed_line("neckline");
        let p1 = neckline.p1;
        let vec = neckline.p2.add(new Vector(0, 3));
        let p4 = neckline.p2;
        p4.move_to(vec);

        vec = neckline.position_at_fraction(0.6);
        let p2 = this.sketch.add_point(vec);

       
        let curve = this.sketch.line_from_function_graph(p1, p4, spline.bezier(
            [p1, p2, p4]
        ));
        this.sketch.remove(neckline, p2);
        curve.data.type = "neckline";
    }

    wide_neckline(percent){
        let d = this.sketch.get_typed_point("d");
        const shoulder = d.get_adjacent_line();

        let vec = shoulder.get_line_vector().scale(percent * 0.95);

        shoulder.p1.move_to(shoulder.p1.add(vec));
    }

    deep_neckline(percent){
        let a = this.sketch.get_typed_point("a");
        const fold = a.get_adjacent_line();

        let vec = fold.get_line_vector().normalize().scale(percent * 10);

        fold.p1.move_to(fold.p1.add(vec));
    }

    // möchte man das tiefer oder weiter haben, sollte man dies vor dem Aufruf dieser 
    // Funktion mit den obrigen Funktionen machen!
    round_neckline(){
 
        let a = this.sketch.get_typed_point("a");
        let d = this.sketch.get_typed_point("d");
        let p = this.sketch.point(d.x, a.y);
        let p2 = this.sketch.point(p.copy());

        let vec2 = d.get_adjacent_line().get_line_vector().get_orthonormal().scale(d.subtract(a).length()).add(d);
        p2.move_to(p2.subtract(new Vector(vec2.x, 0)));
        p.move_to(p.subtract(new Vector(vec2.x, 0)));
        let vec = p.subtract(d).scale(0.5).add(d);
        p.move_to(vec);

        /*
        if(this.side == "front"){
            vec = p2.subtract(a).scale(0.6);
        } else {
            vec = p2.subtract(a).scale(0.4);
        }
        p2.move_to(vec.add(a));
        */
        let l = this.sketch.line_from_function_graph(d, a, spline.bezier(
            [d, p, p2, a]
        ));
        l.data.type = "neckline";
        l.set_color("black");
        this.sketch.remove(p, p2);

        return l;
    }

    square_neckline(){
        let a = this.sketch.get_typed_point("a");
        let d = this.sketch.get_typed_point("d");
        let p = this.sketch.point(d.x, a.y);


        let ln1 = this.sketch.line_between_points(p, a);
        p.move_to(ln1.get_line_vector().scale(0.15).add(p));
        let ln2 = this.sketch.line_between_points(d, p);

        let ln = this.sketch.merge_lines(ln1, ln2, true);
        ln.data.type = "neckline";
    }
}