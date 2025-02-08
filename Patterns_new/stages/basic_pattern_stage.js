/*
    entry: base, erst bis taille, dann auch komplett? was machen mit den zusätzlichen Abnähern bei Michael' Fällen?
        ease umsetzen

    exit: data ist front & back + Ärmel

    Funktionen: 
    - Halsausschnitt 
    - abnäher verschieben & aufspalten in mehrere
    - Abnäher "löschen"
    - Ärmel

*/

import PatternStage from "../../PatternLib/pattern_stages/baseStage.js";
import SewingSketch from "../../PatternLib/sewing_sketch.js";
import { Vector, triangle_data, rotation_fun, vec_angle_clockwise , vec_angle, deg_to_rad} from "../../StoffLib/geometry.js";
import Point from "../../StoffLib/point.js";
import { spline } from "../../StoffLib/curves.js";
import ConnectedComponent from "../../StoffLib/connected_component.js";
import assert from "../../StoffLib/assert.js";
import DartData from "./dart_data.js";
import { EPS } from "../../StoffLib/geometry.js";


// To be ported
// import NecklineSideHalf from "../../Patterns/parts/neckline/neckline_side_half.js"

export default class BasicPatternStage extends PatternStage{
    constructor(t){
        super();
    }

    on_enter(){
        const s = new SewingSketch();
        this.wd.sketch = s;

        this.sketch = s;
        this.side = "front";
        this.#initialize_shorthands();
        this.#main_construction();
        this.wd.direction_swap_of_k_l = false;
    }

    finish() {
        return this.wd.sketch;
    }

    #initialize_shorthands() {
        const shorthand_map = {
            "center": ["center_height_front", "center_height_back"],
            "shoulder": ["shoulder_height_front", "shoulder_height_back"],
            "across": ["across_front", "across_back"],
            "bust": ["bust_width_front", "bust_width_back"],
            "diagonal": ["diagonal_front", "diagonal_back"],
            "point_width": ["bust_point_width", "shoulderblade_width"],
            "point_height": ["bust_point_height", "shoulderblade_height"],
            "waist": ["waist_width_front", "waist_width_back"],
            "bottom": ["bottom_width_front", "bottom_width_back"],
            "over_bust": ["over_bust_front", "over_bust_back"],
            "belly": ["belly_front", "belly_back"],
        }

        this.sh = { ... this.measurements };
        for (const key of Object.keys(shorthand_map)) {
            if (typeof shorthand_map[key] == "string") {
                this.sh[key] = this.measurements[shorthand_map[key]];
            } else {
                this.sh[key] = this.side == "front" ? this.measurements[shorthand_map[key][0]] : this.measurements[shorthand_map[key][1]];
            }
        }
    }

    #construct_neckline(neckline_base){
        let p = this.sketch.point(neckline_base.p1.x, neckline_base.p2.y);
        let p2 = this.sketch.point(neckline_base.p1.x, neckline_base.p2.y);
        let vec = p.subtract(neckline_base.p1).scale(0.5);
        p.move_to(vec.add(neckline_base.p1));
        if(this.sketch.data.is_front){
            vec = p2.subtract(neckline_base.p2).scale(0.6);
        } else {
            vec = p2.subtract(neckline_base.p2).scale(0.4);
        }
        p2.move_to(vec.add(neckline_base.p2));

        let l = this.sketch.line_from_function_graph(neckline_base.p1, neckline_base.p2, spline.bezier(
            [neckline_base.p1, p, p2, neckline_base.p2]
        ));
        l.data.type = "neckline";
        this.sketch.remove(neckline_base, p, p2);
        return l;
    }

    #main_construction(){
        // I want an image for (in) the docs!
        /*
        
            One could change the order in which things are drawn to make this more clear.
            I like the create_neckline fn a lot.
            But I probably prefer to see this fn as a black box anyway, so it doesn't matter to much.
        
        */

        const pts = {}
        const lns = {}

        pts.a = this.sketch.point(0, 0);
        pts.b = this.sketch.point(0, this.sh.center);
        lns.a_to_b = this.sketch.line_between_points(pts.a, pts.b);
        lns.a_to_b.data.type = "fold";

        pts.p1 = this.sketch.point(pts.b.subtract(new Vector(0, this.sh.shoulder)));
        pts.p2 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.across / 2, 0)));
        pts.p3 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.shoulder_width / 2, 0)));
        pts.p4 = this.sketch.point(pts.p1.subtract(new Vector(this.sh.bust / 2, 0)));

        let len = Math.sqrt(Math.pow(this.sh.diagonal, 2) - Math.pow(this.sh.shoulder_width / 2, 2));
        pts.c = this.sketch.point(pts.b.add(new Vector(pts.p3.x, -len)));
        
        len = Math.sqrt(Math.pow(this.sh.shoulder_length, 2) - Math.pow(pts.c.y - pts.p1.y, 2));
        
        pts.d = this.sketch.point(pts.c.add(new Vector(len, pts.p1.y - pts.c.y)));
        lns.c_to_d = this.sketch.line_between_points(pts.d, pts.c);
        lns.c_to_d.data.type = "shoulder";
        
        
        lns.b_to_f = this.sketch.line_at_angle(pts.b, - Math.PI / 2, this.sh.waist / 2).line;
        lns.b_to_f.data.type = "b_to_g";
        pts.f = lns.b_to_f.p2;
        pts.f.data.type = "f";


        let vec_h = pts.b.subtract(new Vector(this.sh.point_width / 2, this.sh.point_height));
        pts.h = this.sketch.add_point(new Point(vec_h.x, vec_h.y));
        pts.h.data.type = "h";

        let angle;
        if (this.sh.bust > this.sh.over_bust){
            len = this.sh.side_height - this.sh.point_height; 
            // nur erstmal zur sicherheit, falld das nicht im Abschnitt vorher gemacht wurde
        
            let diff = this.sh.bust / 2 - this.sh.over_bust / 2;
            let pt = this.sketch.add_point(pts.h.subtract(new Vector(diff/2, -len)));
            let pt2 = this.sketch.add_point(pt.add(new Vector(diff, 0)));
                    
            angle = vec_angle(pt.subtract(pts.h), pt2.subtract(pts.h)) ;

            this.sketch.remove(pt, pt2);
        }

        if (this.sh.bust > this.sh.waist){
            let diff = this.sh.bust - this.sh.waist;
            pts.g = this.sketch.add_point(pts.b.subtract(new Vector((this.sh.point_width - diff)/2), 0));
            
            let temp = this.sketch.add_point(pts.g.subtract(new Vector(diff, 0)));
            angle = angle + vec_angle_clockwise(pts.g.subtract(pts.h), temp.subtract(pts.h));
            this.sketch.remove_points(temp, pts.g);
            
            /*
            */
        }

        let temp = this.sketch.split_line_at_length(lns.b_to_f, this.sh.point_width / 2);
        let rest_len = temp.line_segments[1].get_length();
        this.sketch.remove_point(pts.f);
        pts.f = temp.point;
        pts.f.data.type = "f";

        lns.c_to_h = this.sketch.line_between_points(pts.c, pts.h);
        lns.h_to_f = this.sketch.line_between_points(pts.h, pts.f);
        
        this.sketch.remove_points(pts.p1, pts.p2, pts.p3, pts.p4);


        const pts2 = {}
        const lns2 = {}

        pts2.a = this.sketch.add_point(-60, 15);
        pts2.b = this.sketch.add_point(-60, 15 + this.sh.side_height);
        lns2.a_to_b = this.sketch.line_between_points(pts2.a, pts2.b);

        //lns2.b_to_f = this.sketch.line_at_angle(pts2.b, rad_to_deg(90), rest_len);
        pts2.f = this.sketch.add_point(pts2.b.subtract(new Vector(-rest_len, 0)));
        lns2.b_to_f = this.sketch.line_between_points(pts2.b, pts2.f);

        pts2.h = this.sketch.add_point(pts2.b.subtract(new Vector(-(this.sh.bust - this.sh.point_width) / 2, this.sh.point_height)));

        let temp_angle = vec_angle_clockwise(pts.c.subtract(pts.h), lns.h_to_f.get_line_vector());

        pts2.c = this.sketch.add_point(pts2.f.copy());
        let fun = rotation_fun(pts2.h, -temp_angle - angle/2);
        pts2.c.move_to(fun(pts2.c));
        let vec = pts2.c.subtract(pts2.h).normalize().scale(lns.c_to_h.get_length());
        pts2.c.move_to(pts2.h.add(vec));

        lns2.c_to_h = this.sketch.line_between_points(pts2.c, pts2.h);
        lns2.h_to_f = this.sketch.line_between_points(pts2.h, pts2.f);

        vec = lns2.h_to_f.get_line_vector().normalize().scale(lns.h_to_f.get_length());
        pts2.f.move_to(pts2.h.add(vec));

        vec = pts2.h.subtract(pts.h);
        Object.keys(pts2).forEach(key => {
            const p = pts2[key];
            p.move_to(p.subtract(vec));
        });
        angle = vec_angle_clockwise(pts2.c.subtract(pts.h), pts.c.subtract(pts.h));
        fun = rotation_fun(pts.h, angle);
        Object.keys(pts2).forEach(key => {
            const p = pts2[key];
            p.move_to(fun(p));
        });

        this.sketch.remove(pts2.c, lns.c_to_h);

        pts.a.data.type = "a";
        pts.b.data.type = "b";
        pts.c.data.type = "c";
        pts.d.data.type = "d";
        pts.f.data.type = "g";
        pts2.a.data.type = "e";
        pts2.b.data.type = "f";
        pts2.f.data.type = "i";
        pts2.h.data.type = "h";
        pts.h.data.type = "h";

        lns.a_to_b.data.type = "fold";
        lns.b_to_f.data.type = "b_to_g";
        lns.h_to_f.data.type = "h_to_g";

        lns2.h_to_f.data.type = "h_to_i";
        lns.h_to_i = lns2.h_to_f;
        lns2.b_to_f.swap_orientation();
        lns2.b_to_f.data.type = "i_to_f";
        lns.i_to_f = lns2.b_to_f;
        lns2.a_to_b.data.type = "side";
        lns.e_to_f = lns2.a_to_b;

        this.#ease_new();
        // bis hier könnte eine Stage sein, und das wird von den anderen zwei stages aufgerufen

        // Ich habe mich dazu entschieden, die Verlängerung noch allgemein zu machen und 
        // anschließend erst zu spliten für Styleline o.ae.
        
        this.#merge_to_dart();
        /*
    */
        /*
        */
       this.sketch.validate();
       /*
        this.sketch.remove_points(pts.p1, pts.p2, pts.p3, pts.p4, pts.p7, pts.p8);

       // this.add_component("neckline", new NecklineSideHalf(this, pts.d, pts.a));

        const center_vec = lns.a_to_b.get_line_vector().scale(0.2).add(pts.a);
        this.sketch.data = {
            "base_p5": pts.p5,
            "base_p6": pts.p6,
            "center": center_vec,
            "is_front": this.side == "front"
        }
        */
    };

    #ease(){
        let s = this.sketch;
        let line = s.get_typed_line("shoulder")

        let temp = s.split_line_at_length(line, 0.5*line.get_length());
        let pt = s.add_point(temp.point.copy());

        temp.line_segments[0].replace_endpoint(temp.point, pt);
        let pts = {};
        pts.c = s.get_typed_point("c");
        pts.d = pts.c.get_adjacent_line().other_endpoint(pts.c);
        pts.p5 = s.get_typed_point("p5");
        pts.p6 = s.get_typed_point("p6");
        pts.e = s.get_typed_point("e");
        pts.f = s.get_typed_point("f");

        let vec = new Vector(-this.wd.ease, 0);
    //    console.log(this.wd.ease)

        // pts is an object, not an array, to iterate it you can do:
        Object.keys(pts).forEach(key => {
            const p = pts[key];
            p.move_to(p.add(vec));
            });
            /*
        */
    };

    /*
        Ich mache das so, da ich die Abnäherspitze, sowie die Schulterpasse genau so lassen will, 
        sonst verzieht sich alles. Die einzige Möglichkeit die ich habe ist also, den Bereich zwischen Seitennaht 
        und Abnäherspitze zu vergrößern. Damit sich nicht der Winkel zum Abnäher hin verzieht, bleibt mir nur,
        die Punkte der Seitennaht (e, f) zu verschieben. Was das am Ende für Auswirkungen hat, muss ich wohl noch 
        ausprobieren
    */
    #ease_new(){
        let ease = 1; // das hier sollte noch von Aussen gesteuert werden 
        // und ggf. fuer beide Punkte einzelnd die Groesse bestimmt werden
        let e = this.sketch.get_typed_point("e");
        let f = this.sketch.get_typed_point("f");

        e.move_to(e.add(new Vector(-ease, 0)));
        f.move_to(f.add(new Vector(-ease, 0)));
    };

    #merge_to_dart(){
        let pts = this.sketch.get_typed_points("h");
        //this.sketch.merge_points(pts[0], pts[1]);
        

            let shoulder = this.sketch.get_typed_line("shoulder");
            let temp = this.sketch.split_line_at_fraction(shoulder, 0.5); // TODO: das hier ggf. ändern
            let k = temp.point;
            k.data.type = "k";
            let l = this.sketch.add_point(k.copy());
            l.data.type = "l";
            temp.line_segments[1].replace_endpoint(k, l);
            temp.line_segments[0].data.type = "d_to_k";
            temp.line_segments[1].data.type = "l_to_c";

            

            this.sketch.line_between_points(this.sketch.get_typed_line("h_to_g").p1, k).data.type = "h_to_k";
            this.sketch.line_between_points(this.sketch.get_typed_line("h_to_i").p1, l).data.type = "h_to_l";
            let h = this.sketch.get_typed_point("h");
            let angle = vec_angle_clockwise(this.sketch.get_typed_line("h_to_g").get_line_vector(), this.sketch.get_typed_line("h_to_i").get_line_vector());

            let i = this.sketch.get_typed_point("i");
            let f = this.sketch.get_typed_point("f");

            let angle2 = vec_angle_clockwise(h.subtract(i), f.subtract(i)) + deg_to_rad(90);
            let fun = rotation_fun(h, -angle - angle2);
            
            let comp = new ConnectedComponent(l);
            comp.transform(p => p.move_to(fun(p)));
            
            this.sketch.merge_points(pts[0], pts[1]);
            
            let b = this.sketch.get_typed_point("b");
            let b_to_m = this.sketch.line_at_angle(b, deg_to_rad(180), this.sh.waist_height).line;
            b_to_m.data.type = "b_to_m";
            b_to_m.p2.data.type = "m";
            let m_to_n = this.sketch.line_at_angle(b_to_m.p2, deg_to_rad(270), this.sh.bottom / 2).line;
            m_to_n.data.type = "m_to_n";
            //   console.log(this.sh);
            //console.log(m_to_n)
            m_to_n.p2.data.type = "n";
            
            
            
            
            let vec = b_to_m.get_line_vector().scale(0.5).add(b).add(new Vector(-this.sh.belly / 2, 0));
            let o = this.sketch.add_point(vec);
            
            vec = m_to_n.p2.subtract(f).scale(0.5).add(f);
            let o2 = this.sketch.add_point(vec);
            
            let diff = o2.x - o.x;
            if (diff < 0) {
                this.sketch.line_between_points(f, o2).data.type = "f_to_o";
                this.sketch.line_between_points(o2, m_to_n.p2).data.type = "o_to_n";
                o2.data.type = "o";
                this.sketch.remove(o);
                } else {
                    // bei Leuten mit viel Bauch wollen wir nicht, dass sie wie eine angezogene Murmel aussehen, 
                // daher verschieben wir auch zusätzlich die Saumbreite
                m_to_n.p2.move_to(m_to_n.p2.add(new Vector(-diff / 2, 0)));
                this.sketch.line_between_points(f, o).data.type = "f_to_o";
                this.sketch.line_between_points(o, m_to_n.p2).data.type = "o_to_n";
                o.data.type = "o";
                this.sketch.remove(o2);
            }

                /*
        */
    };


    one_waistline_dart(){
        let h_to_g = this.sketch.get_typed_line("h_to_g");
        let h_to_i = this.sketch.get_typed_line("h_to_i");
        let h = this.sketch.get_typed_point("h");
        // hier wird der Abnäher gemalt und vervollständigt
        let len;
        if (this.side == "front"){
            len = h_to_g.get_length() + this.sh.waist_height /3;
            } else {
            len = h_to_g.get_length() + this.sh.waist_height * 2 / 3;
        }
        let vec = h_to_g.get_line_vector().normalize().scale(len).add(h);
        let j = this.sketch.add_point(vec);
        j.data.type = "j";

        len = h_to_g.p2.subtract(h_to_i.p2).length() / 2;
        len = this.sketch.get_typed_line("b_to_g").get_length() - len;
        //console.log(len)
        let pt = this.sketch.split_line_at_length(this.sketch.get_typed_line("b_to_g"), len).point;
        const cut_res = this.sketch.cut([h, pt], h);
        
        this.sketch.glue(h_to_i, h_to_g);
        
        let i = this.sketch.get_typed_line("i_to_f").p1;
        let lns = i.get_adjacent_lines();
        let ln = this.sketch.merge_lines(lns[0], lns[1], true);
        ln.p1.data.type = "i";
        i = ln.p1;
        ln = i.other_adjacent_line(ln);
        ln.data.type = "h_to_i";
        ln = this.sketch.get_typed_line("b_to_g");
        let g = ln.p2;
        g.data.type = "g";
        ln = g.other_adjacent_line(ln);
        ln.data.type = "h_to_g";
        
        ln = this.sketch.line_between_points(j, g);
        ln.data.type = "j_to_g";
        ln = this.sketch.line_between_points(j, i);
        ln.data.type = "j_to_i";
        /*

        */
    }


    two_waistline_darts(){

        let h_to_g = this.sketch.get_typed_line("h_to_g");
        let h_to_i = this.sketch.get_typed_line("h_to_i");
        let h = this.sketch.get_typed_point("h");
        // hier wird der Abnäher gemalt und vervollständigt
        let len;
        if (this.side == "front") {
            len = h_to_g.get_length() + this.sh.waist_height / 3;
        } else {
            len = h_to_g.get_length() + this.sh.waist_height * 2 / 3;
        }
        let vec = h_to_g.get_line_vector().normalize().scale(len).add(h);
        let j = this.sketch.add_point(vec);
        j.data.type = "j";

        let diff = h_to_g.p2.subtract(h_to_i.p2).length();
        len = diff + this.sketch.get_typed_line("i_to_f").get_length() / 3;
        vec = new Vector(-len, 0);

        let p = this.sketch.add_point(h.add(vec));
        p.data.type = "p";
        let q = this.sketch.add_point(j.add(vec));
        q.data.type = "q";

        let r = this.sketch.add_point(new Point(p.x + diff / 4, h_to_i.p2.y));
        r.data.type = "r";
        let s = this.sketch.add_point(new Point(p.x - diff / 4, h_to_i.p2.y));
        s.data.type = "s";

        let g = this.sketch.add_point(new Point(j.x + diff / 4, h_to_g.p2.y));
        g.data.type = "g";
        let i = this.sketch.add_point(new Point(j.x - diff / 4, h_to_g.p2.y));
        i.data.type = "i";

        this.sketch.remove(h_to_g.p2, h_to_i.p2);
        
        let ln = this.sketch.line_between_points(h, g);
        ln.data.type = "h_to_g";
        ln = this.sketch.line_between_points(h, i);
        ln.data.type = "h_to_i";
        ln = this.sketch.line_between_points(j, g);
        ln.data.type = "j_to_g";
        ln = this.sketch.line_between_points(j, i);
        ln.data.type = "j_to_i";

        ln = this.sketch.line_between_points(p, r);
        ln.data.type = "p_to_r";
        ln = this.sketch.line_between_points(p, s);
        ln.data.type = "p_to_s";
        ln = this.sketch.line_between_points(q, r);
        ln.data.type = "q_to_r";
        ln = this.sketch.line_between_points(q, s);
        ln.data.type = "q_to_s";

        let f = this.sketch.get_typed_point("f");
        let b = this.sketch.get_typed_point("b");
        ln = this.sketch.line_between_points(b, g);
        ln.data.type = "b_to_g";
        ln = this.sketch.line_between_points(i, r);
        ln.data.type = "i_to_r";
        ln = this.sketch.line_between_points(s, f);
        ln.data.type = "s_to_f";
    }

    remove_outer_waistline_dart(){
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

    remove_inner_waistline_dart(){
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

    remove_waistline_darts(){
        let p = this.sketch.get_typed_point("p");
        let h = this.sketch.get_typed_point("h");
        let b = this.sketch.get_typed_point("b");
        let f = this.sketch.get_typed_point("f");
        let i = this.sketch.get_typed_point("i");
        let ln1 = this.sketch.get_typed_line("j_to_g");

        if (this.wd.split){
            if(this.sketch.get_typed_line("h_to_k")){
                this.remove_outer_waistline_dart();
            } else {
                this.remove_inner_waistline_dart();
            }
            return;
        }
        
        if (p){
            let ln2 = this.sketch.get_typed_line("q_to_r");
            let s = this.sketch.get_typed_point("s");

            this.sketch.remove(ln1.p1, ln1.p2, i, s, ln2.p1, ln2.p2);

            if (h.get_adjacent_lines().length == 0) {
                this.sketch.remove(h);
            } else if (p.get_adjacent_lines().length == 0) {
                this.sketch.remove(p);
            }
        } else {

            this.sketch.remove(ln1.p1, ln1.p2, i);

            if (h.get_adjacent_lines().length == 0) {
                this.sketch.remove(h);
            }
        }
        this.sketch.line_between_points(b, f).data.type = "waistline";
    }

    move_dart_to_outer_waistline_dart(){
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


// erst seite verschieben, dann zu anderem Dart wechseln, wenn gewünscht
    move_dart(side, percent, rotation = false){
        let h = this.sketch.get_typed_point("h");
        let h_to_k = this.sketch.get_typed_line("h_to_k");
        let h_to_l = this.sketch.get_typed_line("h_to_l");

        // TODO: Diese linie entfernen, sobald Armpit und neckline gezeichnet wird!!!!
        let temp1 = this.sketch.line_between_points(this.sketch.get_typed_point("c"), this.sketch.get_typed_point("e"));
        temp1.data.type = "armpit";
        let temp2 = this.sketch.line_between_points(this.sketch.get_typed_point("d"), this.sketch.get_typed_point("a"));
        temp2.data.type = "neckline";

 
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
            temp1 = splitted_line.line_segments[0];
            rotation = !rotation;
        } else if(side == "neckline"){
            let ln = this.sketch.get_typed_line("neckline");
            splitted_line = this.sketch.split_line_at_fraction(ln, percent);
            splitted_line.line_segments[0].data.type = "d_to_k";
            splitted_line.line_segments[1].data.type = "l_to_a";
            temp2 = splitted_line.line_segments[0];
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
            
        
        this.sketch.remove(temp1, temp2);
        /*
        */
    }

    // Verwenden, wenn der Abnäher durch den aeusseren Abnaeher geht
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


    split_double(){

    }

    // nimmt an, dass der Abnäher noch nicht verschoben wurde
    // Ich gehe davon aus, das niemand auf die Idee kommt, solche Faxen zu machen wie 
    // "shoulder" 0; "neckline" 0, da dies der selbe, bereits vorhandene Punkt ist 
    split_up_dart(...dart_data){
        // ...[[line_type, fraction_along_line, dart_amount]]
        let dart_at_f = null;
        let data = new DartData(dart_data);



        let rot_vec = this.sketch.get_typed_line("b_to_m").get_line_vector();

        // ToDo: Das kommt noch raus
        let temp1 = this.sketch.line_between_points(this.sketch.get_typed_point("d"), this.sketch.get_typed_point("a"));
        temp1.data.type = "neckline";
        let temp2 = this.sketch.line_between_points(this.sketch.get_typed_point("c"), this.sketch.get_typed_point("e"));
        temp2.data.type = "armpit";

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
        lines.forEach(line =>{
            let points_temp = [];
            data.sort_line(line);
            let percentages = data.get_fractions_along_line(line);
            let ln = this.sketch.get_typed_line(line);
          //  let first = [];
            let last = [];
            percentages.forEach(arr =>{
                let x = arr[0];
                let y = arr[1];
                if(x == 0){
                    points.push([ln.p1, y]);
                } else if (x == 1){
                    if(line == "shoulder"){
                        dart_at_f = y;
                    } else {
                        last = [ln.p2, y];
                        ln.p2.data.rotation = y;
                        p.data.dart = "cut_point";
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
            if (last.length > 0){
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
        for (let i = 1; i < path.points.length; i++){ // The first point is f
            points_with_left_line.push({
                pt: path.points[i],
                left_line: path.lines[i-1]
            })
        }
        const cut_points_with_left_line = points_with_left_line.filter(d => d.pt.data.dart == "cut_point");
        cut_points_with_left_line.reverse(); // From b to f; so we dont need to keep track of total rotation (although a bit more computation)
        cut_points_with_left_line.forEach(({pt, left_line}) => {
            const { rotation } = pt.data;
            const cut_res = this.sketch.cut([pt, fixed], fixed);
            const left_cut_part = cut_res.cut_parts.filter(p => left_line.is_adjacent(p.point))[0];
            const rotation_component = this.sketch.path_between_points(left_cut_part.point, f_pt, left_line);
            const points_to_rotate = rotation_component.points;
            points_to_rotate.forEach(p => {
                p.move_to(p.rotate(-rotation * total_angle_rad, fixed));
            })
        });

        let f_pts = this.sketch.get_typed_points("f");
        let vec = f_pts[0].vector().subtract(f_pts[1].vector());
        if (vec.x < EPS.TINY && vec.y < EPS.TINY){
            this.sketch.remove(temp_cut.cut_parts[0].line, temp_cut.cut_parts[1].line);
            this.sketch.merge_points(f_pts[0], f_pts[1]);
        }
        this.sketch.points_by_key("dart").cut_point.forEach(p =>{
            delete p.data.dart;
            p.data.darttip = "h";
        })
        
        return;
    }
    

}


