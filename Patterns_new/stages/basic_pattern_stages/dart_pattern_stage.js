import PatternStage from "../../../PatternLib/pattern_stages/baseStage.js";
import SewingSketch from "../../../PatternLib/sewing_sketch.js";
import { Vector, triangle_data, rotation_fun, vec_angle_clockwise, vec_angle, deg_to_rad } from "../../../StoffLib/geometry.js";
import Point from "../../../StoffLib/point.js";
import { spline, arc } from "../../../StoffLib/curves.js";
import ConnectedComponent from "../../../StoffLib/connected_component.js";
import assert from "../../../StoffLib/assert.js";
import DartData from "./dart_data.js";
import { EPS } from "../../../StoffLib/geometry.js";




export default class DartPatternStage extends PatternStage{

    constructor(t) {
        super();
    }

    finish() {
        return this.wd.sketch;
    }

    on_enter(){
        this.sketch = this.wd.sketch;
    }

    remove_outer_waistline_dart() {
        let i = this.sketch.get_typed_point("i");
        let f = this.sketch.get_typed_point("f");

        let ln = this.sketch.get_typed_line("q_to_r");
        let ln2 = this.sketch.get_typed_line("p_to_s");

        this.sketch.remove(ln.p1, ln.p2, ln2.p2);
        ln = this.sketch.line_between_points(i, f);
        ln.data.type = "i_to_f";

        let p = this.sketch.get_typed_point("p");
        if (p.get_adjacent_lines().length == 0) {
            this.sketch.remove(p);
        }
    }

    remove_inner_waistline_dart() {
        let r = this.sketch.get_typed_point("r");
        let b = this.sketch.get_typed_point("b");

        let i = this.sketch.get_typed_point("i");
        let ln = this.sketch.get_typed_line("j_to_g");

        this.sketch.remove(ln.p1, ln.p2, i);

        ln = this.sketch.line_between_points(b, r).data.type = "b_to_r";

        let h = this.sketch.get_typed_point("h");
        if (h.get_adjacent_lines().length == 0) {
            this.sketch.remove(h);
        }
    }


    remove_waistline_darts() {
        let p = this.sketch.get_typed_point("p");
        let h = this.sketch.get_typed_point("h");
        let b = this.sketch.get_typed_point("b");
        let f = this.sketch.get_typed_point("f");
        let i = this.sketch.get_typed_point("i");
        let ln1 = this.sketch.get_typed_line("j_to_g");

        if (this.wd.split) {
            if (!this.sketch.get_typed_line("cut p")) {
                this.remove_outer_waistline_dart();
            } else if (!this.sketch.get_typed_line("cut h")) {
                this.remove_inner_waistline_dart();
            }
            return;
        }


        if (this.sketch.get_typed_line("p_to_r")) {
            let ln2 = this.sketch.get_typed_line("q_to_r");
            let s = this.sketch.get_typed_point("s");

            if (ln1.get_length() > 0) {
                this.sketch.remove(ln1.p1, ln1.p2, i, s, ln2.p1, ln2.p2);
            } else {
                this.sketch.remove(s, ln2.p1, ln2.p2);
            }


            if (h.get_adjacent_lines().length == 0) {
                this.sketch.remove(h);
            }
            if (p.get_adjacent_lines().length == 0) {
                this.sketch.remove(p);
            }
        } else {

            if (ln1.get_length() > 0) {
                this.sketch.remove(ln1.p1, ln1.p2, i);
            }

            if (h.get_adjacent_lines().length == 0) {
                this.sketch.remove(h);
            }
        }
        this.sketch.line_between_points(b, f).data.type = "waistline";

    }

    move_dart_to_outer_waistline_dart() {
        let p = this.sketch.get_typed_point("p");
        let ln = this.sketch.get_typed_line("h_to_k");
        let ln2 = this.sketch.get_typed_line("h_to_l");

        this.sketch.line_between_points(p, ln.p2).data.type = "p_to_k";
        this.sketch.line_between_points(p, ln2.p2).data.type = "p_to_l";

        this.sketch.remove(ln, ln2);

        let h = this.sketch.get_typed_point("h");
        if (h.get_adjacent_lines().length == 0) {
            this.sketch.remove(h);
        }
    }

    /*
    // erst seite verschieben, dann zu anderem Dart wechseln, wenn gewünscht
        move_dart(side, percent, rotation = false){
            let h = this.sketch.get_typed_point("h");
            let h_to_k = this.sketch.get_typed_line("h_to_k");
            let h_to_l = this.sketch.get_typed_line("h_to_l");
    
    
     
            let splitted_line;
            if (side == "side"){
                let ln = this.sketch.get_typed_line("side");
                splitted_line = this.sketch.split_line_at_fraction(ln, percent);
                splitted_line.line_segments[0].data.type = "e_to_k";
                splitted_line.line_segments[1].data.type = "l_to_f";
                rotation = !rotation;
            } else if (side == "fold") {
                let ln = this.sketch.get_typed_line("fold");
                splitted_line = this.sketch.split_line_at_fraction(ln, percent);
                splitted_line.line_segments[0].data.type = "a_to_k";
                splitted_line.line_segments[1].data.type = "l_to_b";
                this.wd.direction_swap_of_k_l = true;
            } else if (side == "armpit"){
                let ln = this.sketch.get_typed_line("armpit");
                splitted_line = this.sketch.split_line_at_fraction(ln, percent);
                splitted_line.line_segments[0].data.type = "c_to_k";
                splitted_line.line_segments[1].data.type = "l_to_f";
                rotation = !rotation;
            } else if(side == "neckline"){
                let ln = this.sketch.get_typed_line("neckline");
                splitted_line = this.sketch.split_line_at_fraction(ln, percent);
                splitted_line.line_segments[0].data.type = "d_to_k";
                splitted_line.line_segments[1].data.type = "l_to_a";
                this.wd.direction_swap_of_k_l = true;
            } else if (side == "shoulder"){
                let ln;
                if(percent == 0.5){
                    this.sketch.remove(temp1, temp2);
                    return;
                } else if (percent < 0.5){
                    ln = this.sketch.get_typed_line("d_to_k");
                    splitted_line = this.sketch.split_line_at_fraction(ln, percent * 2);
                    splitted_line.line_segments[0].data.type = "d_to_k";
                    splitted_line.line_segments[1].data.type = "part";
                } else {
                    ln = this.sketch.get_typed_line("l_to_c");
                    splitted_line = this.sketch.split_line_at_fraction(ln, (percent - 0.5)* 2);
                    splitted_line.line_segments[0].data.type = "part";
                    splitted_line.line_segments[1].data.type = "l_to_c";
                    rotation = !rotation;
                }
            }
            let pt = splitted_line.point;
            splitted_line.line_segments[0].data.point = "k";
            splitted_line.line_segments[1].data.point = "l";
            
            this.sketch.cut([h, pt], h);
            
            if(rotation){
                this.sketch.glue(h_to_k, h_to_l, {point:"delete"});
            } else {
                this.sketch.glue(h_to_l, h_to_k, { point: "delete" });
            }
            
            // neu benennen der Linien
            splitted_line.line_segments[0].p2.data.type = splitted_line.line_segments[0].data.point;
            delete splitted_line.line_segments[0].data.point;
            
            splitted_line.line_segments[1].p1.data.type = splitted_line.line_segments[1].data.point;
            delete splitted_line.line_segments[1].data.point;
            
            splitted_line.line_segments[0].p2.other_adjacent_line(splitted_line.line_segments[0]).data.type = "h_to_k";
            splitted_line.line_segments[1].p1.other_adjacent_line(splitted_line.line_segments[1]).data.type = "h_to_l";
    
            if(side == "shoulder"){
                if(percent < 0.5){
                    this.sketch.merge_lines(this.sketch.get_typed_line("l_to_c"), splitted_line.line_segments[1], true).data.type = "l_to_c";
                } else {
                    this.sketch.merge_lines(this.sketch.get_typed_line("d_to_k"), splitted_line.line_segments[0], true).data.type = "d_to_k";
                }
            } else {
                this.sketch.merge_lines(this.sketch.get_typed_line("d_to_k"), this.sketch.get_typed_line("l_to_c"), true).data.type = "d_to_c";
            }
           
        }
    
        // Verwenden, wenn der Abnäher durch den aeusseren Abnaeher geht
        // zu unallgemein
        correct_second_dart(shift = true){
            let p = this.sketch.get_typed_point("p");
            let h_to_l = this.sketch.get_typed_line("h_to_l");
            if (shift){
                let q = this.sketch.get_typed_point("q");
                let ln = this.sketch.line_between_points(p, q);
                let pt = this.sketch.intersection_positions(ln, h_to_l)[0];
                p.move_to(pt);
                this.sketch.remove(ln);
            } else {
                let p_to_r = this.sketch.get_typed_line("p_to_r");
                let p_to_s = this.sketch.get_typed_line("p_to_s");
                let pt = this.sketch.intersection_positions(p_to_s, h_to_l)[0];
                let ps = this.sketch.add_point(pt);
                ps.data.type = "ps";
                let temp = this.sketch.point_on_line(ps, p_to_s);
                let len = temp.line_segments[1].get_length();
                temp = this.sketch.split_line_at_length(p_to_r, p_to_r.get_length() - len);
                temp.point.data.type = "pr";
                this.sketch.remove(p);
                
            }
        }
    
        split_at_dart(){
            this.wd.split = true;
            let h_to_k = this.sketch.get_typed_line("h_to_k");
            let h;
            let j;
            let m = this.sketch.get_typed_point("m");
            let h_to_i;
            let h_to_l;
            let j_to_i;
    
            if(h_to_k){ // dann ist der Abnäher am inneren Taillenabnäher
                h = this.sketch.get_typed_point("h");
                j = this.sketch.get_typed_point("j");
                assert.IS_POINT(j);
    
                h_to_i = this.sketch.get_typed_line("h_to_i");
                j_to_i = this.sketch.get_typed_line("j_to_i"); 
                if (this.wd.direction_swap_of_k_l) {
                    h_to_l = this.sketch.get_typed_line("h_to_k");
                } else {
                    h_to_l = this.sketch.get_typed_line("h_to_l");
                }
            } else {
                h = this.sketch.get_typed_point("p");
                j = this.sketch.get_typed_point("q");
    
                assert.IS_POINT(j);
                    
                h_to_i = this.sketch.get_typed_line("p_to_s");
                j_to_i = this.sketch.get_typed_line("q_to_s");
                if (this.wd.direction_swap_of_k_l) {
                    h_to_l = this.sketch.get_typed_line("p_to_k");
                } else {
                    h_to_l = this.sketch.get_typed_line("p_to_l");
                }
            }
    
            let vec = m.add(new Vector(j.x, 0));
            
            let split_line = this.sketch.split_line_at_length(this.sketch.get_typed_line("m_to_n"), vec.subtract(m).length());
            let u = split_line.point;
            let t = this.sketch.add_point(u.copy());
            u.data.type = "t";
            t.data.type = "t";
    
            split_line.line_segments[1].replace_endpoint(t, u);
            let j2 = this.sketch.add_point(j.copy());
            j2.data.type = j.data.type;
            j_to_i.replace_endpoint(j, j2);
            
            this.sketch.line_between_points(t, j2);
            this.sketch.line_between_points(u, j);
    
            let h2 = this.sketch.add_point(h.copy());
            h2.data.type = h.data.type;
            h_to_i.replace_endpoint(h, h2);
            h_to_l.replace_endpoint(h, h2);
    
            let comp = new ConnectedComponent(h2);
            comp.transform(p => p.move_to(p.add(new Vector(-20, 0))));
    
        }
    
        */


    // bis hier "einfache Funktionen" die untereinander auch kompatibel sind

    // nimmt an, dass der Abnäher noch nicht verschoben wurde
    // Ich gehe davon aus, das niemand auf die Idee kommt, solche Faxen zu machen wie 
    // "shoulder" 0; "neckline" 0, da dies der selbe, bereits vorhandene Punkt ist 
    split_up_dart(...dart_data) {
        // ...[[line_type, fraction_along_line, dart_amount]]
        let data = new DartData(dart_data);
        data.check_sum();
        this.wd.dart_number = data.get_number_of_darts();



        let rot_vec = this.sketch.get_typed_line("b_to_m").get_line_vector();

        let h = this.sketch.get_typed_point("h");
        let f = this.sketch.get_typed_point("f");

        let ln2 = this.sketch.get_typed_line("side");
        let grp2 = f.other_adjacent_lines(ln2);

        let temp_cut = this.sketch.cut([f, h], h, [ln2], grp2);
        let temp_glue = this.sketch.glue(this.sketch.get_typed_line("h_to_k"), this.sketch.get_typed_line("h_to_l"));
        let temp_lines = temp_glue.point.get_adjacent_lines();
        this.sketch.merge_lines(temp_lines[0], temp_lines[1], true).data.type = "shoulder";


        data.sort_lines();
        let lines = data.get_lines();

        let points = [];
        lines.forEach(line => {
            let points_temp = [];
            data.sort_line(line);
            let percentages = data.get_fractions_along_line(line);
            let ln = this.sketch.get_typed_line(line);
            //  let first = [];
            let last = [];
            percentages.forEach(arr => {
                let x = arr[0];
                let y = arr[1];
                if (x == 0) {
                    points.push([ln.p1, y]);
                } else if (x == 1) {
                    if (line == "side") {
                        dart_at_f = y;
                    } else {
                        last = [ln.p2, y];
                        ln.p2.data.rotation = y;
                        ln.p2.data.dart = "cut_point";
                    }
                } else {
                    let p = this.sketch.add_point(ln.position_at_length(x * ln.get_length()));
                    p.data.dart = "cut_point";
                    p.data.rotation = y;
                    points_temp.push([p, y]);
                }
            });

            points_temp.forEach(arr => {
                let x = arr[0];
                ln = this.sketch.point_on_line(x, ln).line_segments[1];
                points.push(arr);
            })
            if (last.length > 0) {
                points.push(last);
            }
            /*
            */
        });

        let i = 1;
        points.forEach(p => {
            p[0].data.dart_number = i;
            i++;
        })

        const total_angle_rad = - vec_angle_clockwise(temp_cut.cut_parts[0].line.get_line_vector(), temp_cut.cut_parts[1].line.get_line_vector());


        const fixed = h;
        const s_to_f = this.sketch.get_typed_line("s_to_f");
        const f_pt = this.sketch.get_typed_points("f").filter(p => !s_to_f.is_adjacent(p))[0];
        const b_pt = this.sketch.get_typed_point("b");
        const dir_line = this.sketch.get_adjacent_line(f_pt, "side");
        const path = this.sketch.path_between_points(f_pt, b_pt, dir_line);
        const points_with_left_line = [];
        for (let i = 1; i < path.points.length; i++) { // The first point is f
            points_with_left_line.push({
                pt: path.points[i],
                left_line: path.lines[i - 1]
            })
        }
        const cut_points_with_left_line = points_with_left_line.filter(d => d.pt.data.dart == "cut_point");
        cut_points_with_left_line.reverse(); // From b to f; so we dont need to keep track of total rotation (although a bit more computation)
        cut_points_with_left_line.forEach(({ pt, left_line }) => {
            const { rotation } = pt.data;
            const cut_res = this.sketch.cut([pt, fixed], fixed);
            cut_res.cut_parts[0].line.data.type = "dart";
            cut_res.cut_parts[0].line.data.dart_number = pt.data.dart_number;
            cut_res.cut_parts[0].line.data.darttip = "h";
            cut_res.cut_parts[0].line.swap_orientation();
            cut_res.cut_parts[1].line.data.type = "dart";
            cut_res.cut_parts[1].line.data.dart_number = pt.data.dart_number;
            cut_res.cut_parts[1].line.data.darttip = "h";
            cut_res.cut_parts[1].line.swap_orientation();

            const left_cut_part = cut_res.cut_parts.filter(p => left_line.is_adjacent(p.point))[0];
            const rotation_component = this.sketch.path_between_points(left_cut_part.point, f_pt, left_line);
            const points_to_rotate = rotation_component.points;
            points_to_rotate.forEach(p => {
                p.move_to(p.rotate(-rotation * total_angle_rad, fixed));
            })
        });

        let f_pts = this.sketch.get_typed_points("f");
        let vec = f_pts[0].vector().subtract(f_pts[1].vector());
        if (vec.x < EPS.TINY && vec.y < EPS.TINY) {
            this.sketch.remove(temp_cut.cut_parts[0].line, temp_cut.cut_parts[1].line);
            this.sketch.merge_points(f_pts[0], f_pts[1]);
        }
        this.sketch.points_by_key("dart").cut_point.forEach(p => {
            delete p.data.dart;
        })

        return;
    }


    // Das verschieben zur anderen Abnäherspitze führt zur Korrektur in der ein oder anderen 
    // Länge vom einer der beiden Abnäherlinien. Dadurch wird mindestens eine weitere Linie 
    // minimal im Winkel verändert. 
    // Daher bitte nicht zu oft hin und her verändern.
    move_dart_number_to_darttip(number, new_darttip = "p") {
        //     let pts = this.sketch.points_by_key("dart_number")[number];
        let lns = this.sketch.lines_by_key("dart_number")[number];
        let old_darttip = lns[0].data.darttip;
        lns[0].data.darttip = new_darttip;
        lns[1].data.darttip = new_darttip;
        let old_p = this.sketch.get_typed_point(old_darttip);
        let new_p = this.sketch.get_typed_point(new_darttip);

        assert.IS_POINT(old_p);
        assert.IS_POINT(new_p);

        lns[0].replace_endpoint(old_p, new_p);
        lns[1].replace_endpoint(old_p, new_p);
        let len = Math.max(lns[0].get_length(), lns[1].get_length());

        lns[0].p2.move_to(lns[0].get_line_vector().normalize().scale(len).add(new_p));
        lns[1].p2.move_to(lns[1].get_line_vector().normalize().scale(len).add(new_p));
    }

    // Ich gehe davon aus, dass beide Taillenabnäher nur einmal mit hilfe eines Abnähers aufgespalten werden können

    split_dart_number_to_bottom(number, darts_left = []) {
        this.wd.split = true;
        let lns = this.sketch.lines_by_key("dart_number")[number];

        let dart_lines_left = [];
        darts_left.forEach(number => {
            dart_lines_left = dart_lines_left.concat(this.sketch.lines_by_key("dart_number")[number]);
        });


        assert.CALLBACK("Abnäher wurde an p schon gespalten", () => {
            return !(this.wd.split_p && lns[0].data.darttip == "p");
        });
        assert.CALLBACK("Abnäher wurde an h schon gespalten", () => {
            return !(this.wd.split_h && lns[0].data.darttip == "h");
        });

        let temp_ln = lns[0].p2.other_adjacent_line(lns[0]);
        if (temp_ln.data.type == "neckline" || temp_ln.data.type == "fold") {
            if (lns[0].p2.data.p == "p1") {
                lns.reverse();
            }
        } else {
            if (lns[0].p2.data.p == "p2") {
                
                lns.reverse();
            }
        }
        /*
        */

        let h;
        let j;
        let h_to_i;
        let j_to_i;
        let lines = [];

        if (lns[0].data.darttip == "h") {
            h = this.sketch.get_typed_point("h");
            j = this.sketch.get_typed_point("j");
            lines.push(this.sketch.get_typed_line("j_to_g"));
            lines.push(this.sketch.get_typed_line("j_to_i"));
            j_to_i = this.sketch.get_typed_line("j_to_i");
            if (temp_ln.data.type == "neckline" || temp_ln.data.type == "fold") {
                h_to_i = this.sketch.get_typed_line("h_to_i");
            } else {
                h_to_i = this.sketch.get_typed_line("h_to_g");
            }
            lines.push(this.sketch.get_typed_line("h_to_g"));
            lines.push(this.sketch.get_typed_line("h_to_i"))

        } else {
            h = this.sketch.get_typed_point("p");
            j = this.sketch.get_typed_point("q");
            j_to_i = this.sketch.get_typed_line("q_to_s");
            lines.push(this.sketch.get_typed_line("q_to_r"));
            lines.push(this.sketch.get_typed_line("q_to_s"));
            if (temp_ln.data.type == "neckline" || temp_ln.data.type == "fold") {
                h_to_i = this.sketch.get_typed_line("p_to_s");
            } else {
                h_to_i = this.sketch.get_typed_line("p_to_s");
            }
            lines.push(this.sketch.get_typed_line("p_to_r"))
            lines.push(this.sketch.get_typed_line("p_to_s"))
        }
        assert.IS_POINT(j);
        let h2 = this.sketch.add_point(h.copy());

        let p_h = this.sketch.add_point(j.subtract(h).scale(5).add(h));
        let ln_h = this.sketch.line_between_points(h, p_h);
        let bottom_lns = this.sketch.get_typed_lines("bottom");
        let positions = this.sketch.intersection_positions(bottom_lns[0], ln_h);
        let bottom_ln;
        if (positions.length > 0) {
            bottom_ln = bottom_lns[0];
        } else {
            positions = this.sketch.intersection_positions(bottom_lns[1], ln_h);
            bottom_ln = bottom_lns[1];
        }

        p_h.move_to(positions[0]);
        p_h.data.type = "u";
        this.sketch.remove(ln_h);
        let temp = this.sketch.point_on_line(p_h, bottom_ln);
        let temp_cut = this.sketch.cut([p_h, j], null, [temp.line_segments[1], j_to_i], [temp.line_segments[0], j.other_adjacent_line(j_to_i)]);
        if (lns[0].data.darttip == "h") {
            temp_cut.cut_parts[0].line.data.type = "j_to_u";
            temp_cut.cut_parts[1].line.data.type = "j_to_u";
        } else {
            temp_cut.cut_parts[0].line.data.type = "q_to_u";
            temp_cut.cut_parts[1].line.data.type = "q_to_u";
        }

        lns[1].replace_endpoint(h, h2);
        h_to_i.replace_endpoint(h, h2);
        dart_lines_left.forEach(line => {
            line.replace_endpoint(h, h2);
        });
        lines.push(temp_cut.cut_parts[0].line);
        lines.push(temp_cut.cut_parts[1].line);
        lines = lines.concat(lns);

        lines.forEach(line => {
            line.data.old_type = line.data.type;
            line.data.type = ("cut " + lns[0].data.darttip);
        });
        let comp = new ConnectedComponent(h2);
        comp.transform(p => {
            p.move_to(p.add(new Vector(-10, 0)));
        });
        /*
*/
    }
}