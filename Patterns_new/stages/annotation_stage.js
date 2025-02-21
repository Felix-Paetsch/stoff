import PatternStage from "../../PatternLib/pattern_stages/baseStage.js";
import ConnectedComponent from "../../StoffLib/connected_component.js";
import { Vector, triangle_data, rotation_fun, vec_angle_clockwise, vec_angle, deg_to_rad } from "../../StoffLib/geometry.js";


/*
    entry: ?
    exit: Nahtzugabe hinzufügen

    funktionen:
    - annotate dart
    - linie bei Abnähern (vergessen wie es heißt)
    - anpassen Abstand Nahtzugabe 
    - Beschreibung von Linien oder so?
    

*/



export default class AnnotationStage extends PatternStage {
    constructor() {
        super();
    }

    on_enter(){
        this.sketch = this.wd.sketch;
        this.wd.sketch = this.sketch;
    }


    finish() {
        return this.wd.sketch;
    }

    // diese Funktion soll noch raus / anders werden. 
    // Dafür muss geklärt werden, ob nach dem Trennen, die Komponenten auf eigene Sketches gepackt werden sollen oder nicht
    curve_lines(){
        let lns_h = this.sketch.get_typed_lines("cut h");
        let lns_p = this.sketch.get_typed_lines("cut p");
        
        let comp = new ConnectedComponent(lns_p[0]);
        this.curve_outer_lines(comp.lines_by_key("type")["cut p"]);
        /*
        */
    }


    curve_outer_lines(lines){
        lines = this.sketch.order_by_endpoints(lines);
        const target_endpoints = lines[0].endpoint_from_orientation(lines.orientations[0]);
        
        lines.forEach(line => {
            line.set_color("red")
        });
    }

    move_dart_outside(dart_number, distance = 3){
        let lines = this.sketch.lines_by_key("dart_number")[dart_number];
    

        let pt = this.sketch.add_point(lines[0].p1.copy());
        lines[0].replace_endpoint(lines[0].p1, pt);
        lines[1].replace_endpoint(lines[1].p1, pt);
        
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
    /*
        We fill in the dart with the line sgement adjacent to the outer one.
        If that segment is to short we take the next line, we expect the next line then to be well defined.
        #madeByFelix
    */
   let s = this.sketch;
   let dart_lines = this.sketch.lines_by_key("dart_number")[dart_number];

    // 1, Constructing (half of) the line with which to fill the dart at the correct position
    const center_pt = dart_lines[0].common_endpoint(dart_lines[1]);

    let outer_line;
    let inner_line;
    if (reverse){
        outer_line = dart_lines.filter(l => l.p2.data.p == "p1")[0];
        inner_line = dart_lines.filter(l => l.p2.data.p == "p2")[0];
    } else {
       outer_line = dart_lines.filter(l => l.p2.data.p == "p2")[0];
       inner_line = dart_lines.filter(l => l.p2.data.p == "p1")[0];
    }

    const outer_pt = outer_line.other_endpoint(center_pt);
    const original_line_to_mirror = outer_pt.other_adjacent_line(outer_line);
    const copy_line_to_mirror = s.copy_line(
        original_line_to_mirror,
        ...original_line_to_mirror.get_endpoints()
    );

    const outer_outer_pt = copy_line_to_mirror.other_endpoint(outer_pt);
    const original_line_to_mirror_extension = outer_outer_pt.other_adjacent_line(copy_line_to_mirror, original_line_to_mirror);
    const copy_line_to_mirror_extension = s.copy_line(
        original_line_to_mirror_extension,
        ...original_line_to_mirror_extension.get_endpoints()
    );

    const full_line_to_mirror = s.merge_lines(copy_line_to_mirror, copy_line_to_mirror_extension);
    const most_outer_pt = full_line_to_mirror.other_endpoint(outer_pt);

    // Create Half Line
    const dart_full_angle = vec_angle_clockwise(outer_pt, inner_line.other_endpoint(center_pt), center_pt);
    const half_line_at_angle = s.line_at_angle(center_pt, dart_full_angle / 2, 100, outer_pt);

    const mirror_center_vec = half_line_at_angle.line.closest_position(most_outer_pt);
    const most_outer_pt_mirrored = s.add(most_outer_pt.mirror_at(mirror_center_vec));
    full_line_to_mirror.set_endpoints(outer_pt, most_outer_pt_mirrored).mirror();

    // Cut the line at the right position
    const intersections = s.intersect_lines(full_line_to_mirror, half_line_at_angle.line);
    const target_line = intersections.l1_segments[0];

    s.remove(
        intersections.l1_segments[1],
        ...intersections.l2_segments,
        most_outer_pt_mirrored,
        half_line_at_angle.other_endpoint
    );

    const fill_in_center_pt = target_line.other_endpoint(outer_pt);

    // Copy the line over
    const target_line_mirror = s.copy_line(
        target_line,
        inner_line.other_endpoint(center_pt),
        fill_in_center_pt,
    ).mirror();

    const merged = s.merge_lines(target_line, target_line_mirror);
    s.remove(fill_in_center_pt);
    merged.data.type = "fill in";
    merged.data.dart_number = dart_number;
    // merges has on the side of merge.p1 the "outer" side and on merge.p2 the "inner" site
    return merged;
}

}