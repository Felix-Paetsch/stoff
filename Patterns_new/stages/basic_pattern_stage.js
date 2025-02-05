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
import { Vector, triangle_data, rotation_fun, vec_angle_clockwise , vec_angle, deg_to_rad, rad_to_deg} from "../../StoffLib/geometry.js";
import Point from "../../StoffLib/point.js";
import { spline } from "../../StoffLib/curves.js";
import ConnectedComponent from "../../StoffLib/connected_component.js";

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

    #main_construction_without_waist(){

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

        pts.c.move_to(pts.c.subtract(pts.d).scale(0.75).add(pts.d));



        const len_b = 10;
        const ve = pts.c.subtract(pts.p2);
        const len_c = Math.sqrt(Math.abs((len_b * len_b) - (ve.x * ve.x)));
        const a = pts.p2;
        const vec = pts.p3.subtract(pts.p1).get_orthonormal();
        ve.x = 0;
        const vec_p = vec.scale(len_c).add(a).add(ve);
        pts.p5 = this.sketch.add_point(new Point(vec_p.x, vec_p.y)).set_color("blue");


        len = pts.p4.subtract(pts.p2).length();

        const vec_p6 = pts.p2.subtract(pts.p1).get_orthonormal().scale((this.sh.arm - 20) * (2 / 5)).add(pts.p5).add(pts.p4.subtract(pts.p2).normalize().scale(len - 2.5))//.subtract(p2)//.add(p3);
        pts.p6 = this.sketch.add_point(vec_p6).set_color("blue");
        pts.e = this.sketch.add_point(pts.p6.add(new Vector(-2.5, 0)));

        let a1;
        if ((this.sh.waist/2) - 3 <= this.sh.bust/2){
            a1 = this.sh.waist / 2;
            console.log("here")
        } else {
            let add_ease = (this.sh.waist / 2) - 3 - this.sh.bust / 2;
            a1 = (this.sh.waist / 2) - add_ease;
            console.log(add_ease)
            this.ease = this.ease + add_ease;
        }
        let c1 = pts.e.subtract(pts.b).length();
        let b1 = this.sh.side_height;


        let angle = triangle_data({ a: a1, b: b1, c: c1 }).alpha;
        let fun = rotation_fun(pts.e, angle);
        pts.f = this.sketch.add_point(pts.b.copy());
        pts.f.data.type = "f"
        pts.f.move_to(fun(pts.b));
        
        let ln = this.sketch.line_between_points(pts.e, pts.f);
        ln.data.type = "side";
        ln = this.sketch.line_between_points(pts.b, pts.f);
        ln.data.type = "waistline";
        pts.f.move_to(pts.e.subtract(pts.f).normalize().scale(-this.sh.side_height).add(pts.e));

        lns.l_help = this.sketch.line_between_points(pts.d, pts.a);
        const neck = this.#construct_neckline(lns.l_help);
        neck.data.type = "neckline";
        neck.data.curve = true;
        neck.data.direction = -1;
        neck.data.direction_split = -1;

        const pt_vec = lns.a_to_b.get_line_vector().scale(0.2).add(pts.a);
        pts.pt = this.sketch.add_point(new Point(pt_vec.x, pt_vec.y));
        this.sketch.remove_points(pts.p1, pts.p2, pts.p3, pts.p4);

        pts.p5.data.type = "p5";
        pts.p6.data.type = "p6";
        pts.e.data.type = "e";
        pts.c.data.type = "c";
      //  this.#ease();

        this.sketch.data = {
            "p5": pts.p5,
            "p6": pts.p6,
            "pt": pts.pt,
            "height_sleeve": pts.e.y - pts.c.y,
            "fside": this.side
        }
    };
    
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
        lns.b_to_f.data.type = "waistline";
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
        lns2.b_to_f.data.type = "i_to_f";
        lns2.a_to_b.data.type = "side";

        this.#ease_new();
        // bis hier könnte eine Stage sein, und das wird von den anderen zwei stages aufgerufen
        this.#merge_to_dart();
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
        console.log(this.wd.ease)

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

    #merge_to_dart(waistline_dart = false){
        let pts = this.sketch.get_typed_points("h");
        //this.sketch.merge_points(pts[0], pts[1]);
        
        if (waistline_dart){

        } else {
            let shoulder = this.sketch.get_typed_line("shoulder");
            let temp = this.sketch.split_line_at_fraction(shoulder, 0.5); // TODO: das hier ggf. ändern
            let k = temp.point;
            k.data.type = "k";
            let l = this.sketch.add_point(k.copy());
            l.data.type = "l";
            temp.line_segments[0].replace_endpoint(k, l);
            temp.line_segments[0].data.type = "d_to_l";
            temp.line_segments[1].data.type = "k_to_c";

            

            this.sketch.line_between_points(this.sketch.get_typed_line("h_to_g").p1, l).data.type = "h_to_l";
            this.sketch.line_between_points(this.sketch.get_typed_line("h_to_i").p1, k).data.type = "h_to_k";
            let h = this.sketch.get_typed_point("h");
            let angle = vec_angle_clockwise(this.sketch.get_typed_line("h_to_g").get_line_vector(), this.sketch.get_typed_line("h_to_i").get_line_vector());

            let i = this.sketch.get_typed_point("i");
            let f = this.sketch.get_typed_point("f");

            let angle2 = vec_angle_clockwise(h.subtract(i), f.subtract(i)) + deg_to_rad(90);
            let fun = rotation_fun(h, -angle - angle2);

            let comp = new ConnectedComponent(k);
            comp.transform(p => p.move_to(fun(p)));

            this.sketch.merge_points(pts[0], pts[1]);

            this.#lengthen_dart();
        }
        /*

        */
    };

    #lengthen_dart(){
        /*
        let ln1 = this.sketch.get_typed_line("h_to_g");
        let ln2 = this.sketch.get_typed_line("h_to_i");
        this.sketch.glue(ln1, ln2)
        */

       let b = this.sketch.get_typed_point("b");
       let b_to_m = this.sketch.line_at_angle(b, deg_to_rad(180), this.sh.waist_height).line;
       b_to_m.data.type = "b_to_m";
       b_to_m.p2.data.type = "m";
        let m_to_n = this.sketch.line_at_angle(b_to_m.p2, deg_to_rad(270), this.sh.bottom / 2).line;
        m_to_n.data.type = "m_to_n";
        //   console.log(this.sh);
        //console.log(m_to_n)
        m_to_n.data.type = "n";
        let vec = b_to_m.get_line_vector().scale(0.5).add(b).add(new Vector(-this.sh.belly /2, 0));
        let o = this.sketch.add_point(vec);
        /*
        o.data.type = "o";
        */
        
    }
}