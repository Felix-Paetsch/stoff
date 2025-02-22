import PatternStage from "../../../PatternLib/pattern_stages/baseStage.js";
import ConnectedComponent from "../../../StoffLib/connected_component.js";
import { spline } from "../../../StoffLib/curves.js";
import { Vector, triangle_data, rotation_fun, vec_angle_clockwise, vec_angle, deg_to_rad } from "../../../StoffLib/geometry.js";
import assert from "../../../StoffLib/assert.js";
import fill_in_dart from "../algorithms/fill_in_dart.js";


/*
    entry: ?
    exit: Nahtzugabe hinzufügen

    funktionen:
    - annotate dart
    - linie bei Abnähern (vergessen wie es heißt)
    - anpassen Abstand Nahtzugabe 
    - Beschreibung von Linien oder so?
    

*/



export default class DartAnnotationStage extends PatternStage {
    constructor() {
        super();
    }

    on_enter(){
        this.sketch = this.wd.sketch;
        this.wd.sketch = this.sketch;
    }

    on_exit(){
        this.#mirror();
    }


    finish() {
        return this.wd.sketch;
    }

   
    #mirror(){
        let line = this.sketch.get_typed_line("fold");
        this.sketch.unfold(line);

        let a = this.sketch.get_typed_point("a");
        let m = this.sketch.get_typed_point("m");
        let lines = a.get_adjacent_lines();
        this.sketch.merge_lines(lines[0], lines[1], true);
        lines = m.get_adjacent_lines();
        this.sketch.merge_lines(lines[0], lines[1], true);
    }



    move_dart_outside(dart_number, distance = 3){
        let lines = this.sketch.lines_by_key("dart_number")[dart_number];
        let pt;
    
        if(lines[0].p1.other_adjacent_lines(lines[0]).length <= 1){
            pt = lines[0].p1;
        } else {
            pt = this.sketch.add_point(lines[0].p1.copy());
            lines[0].replace_endpoint(lines[0].p1, pt);
            lines[1].replace_endpoint(lines[1].p1, pt);
        }
        
        let vec = lines[0].p2.subtract(lines[1].p2).scale(0.5).add(lines[1].p2);
        vec = pt.subtract(vec).normalize().scale(-distance);

        pt.move_to(pt.add(vec));
    }

    // erst alle anderen Abnäher verschieben und von h und p lösen
    move_waistline_dart(distance = 3){
        let p = this.sketch.get_typed_point("p");
        let h = this.sketch.get_typed_point("h");
        let vec = new Vector(0,1);
        vec = vec.scale(distance);

        if(p){
            p.move_to(p.add(vec));
        }
        if(h){
            h.move_to(h.add(vec));
        }
    }


    fill_in_dart(dart_number, reverse = false) {
        fill_in_dart(this.sketch, dart_number, reverse);
    }



    dart_annotation(dart_number, shift_length = 3){
        let dart_lines = this.sketch.get_typed_lines("dart").filter(line => {
            return line.data.dart_number == dart_number;
        });
        
        assert.CALLBACK("Abnähernummer"+ dart_number + "existiert nicht", () =>{
            return dart_lines.length > 0;
        })

        let vec = dart_lines[0].p1.subtract(dart_lines[1].p1).scale(0.5).add(dart_lines[1].p1);
        let pt = this.sketch.add_point(vec);
        
        vec = dart_lines[0].p2.subtract(dart_lines[1].p2).scale(0.5).add(dart_lines[1].p2);
        let pt2 = this.sketch.add_point(vec);
        pt2.data.dart_side_distance = dart_lines[0].p2.subtract(dart_lines[1].p2).length() / 2;

        pt.data.dart_lenghen = shift_length;

        let line = this.sketch.line_between_points(pt, pt2);
        line.data.type = "annotation";
        line.data.dart_number = dart_number;

        this.sketch.remove(dart_lines[0].p1);

        pt.move_to(line.get_line_vector().normalize().scale(shift_length).add(pt));
        return line;
    }

    annotate_inner_waistline_dart(){

    }

    annotate_outer_waistline_dart(){

    }
}