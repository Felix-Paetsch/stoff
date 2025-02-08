import assert from "../StoffLib/assert.js";
import Sketch from "../StoffLib/sketch.js";
import Line from "../StoffLib/line.js";
import { Vector, polygon_contains_point, EPS, VERTICAL } from "../StoffLib/geometry.js";

import { cut_with_fixed_point, cut_without_fixed_point, cut_along_line_path } from "./sketch_methods/cut.js";
import { glue_with_fixed_point, glue } from "./sketch_methods/glue.js";
import add_type_based_methods from "./sketch_methods/type_based.js";

import Point from "../StoffLib/point.js";
import ConnectedComponent from "../StoffLib/connected_component.js";
import { default_data_callback } from "../StoffLib/copy.js";

/*

    The sewing sketch implements methods that are usefull in the more specific context of sewing patterns.
    Some methods from pattern_component are not put here, as they depend more on the specific implementation choice we did.
    This mainly includes dealin with lines (and points) by their data.type

*/

export default class SewingSketch extends Sketch{
    constructor(){
        super();
    }

    order_by_endpoints(...lines){
        if (lines.length == 0) return [];
        const res = lines.pop();
        const smth_found = null;
        while (lines.length > 0){
            for (let i = lines.length - 1; i >= 0; i--){
                if (res[0].common_endpoint(lines[i]) && !res[1]?.common_endpoint(lines[i])){
                    smth_found = true;
                    res.unshift(...lines.splice(i,1));
                } else if (res[res.length - 1].common_endpoint(lines[i]) && !res[res.length - 2]?.common_endpoint(lines[i])){
                    smth_found = true;
                    res.push(...lines.splice(i,1));
                }
            }

            if (!smth_found) throw new Error("Lines dont form a connected segment");
        }

        return res;
    }

    cut(line, fixed_pt = null, grp1 = "smart", grp2 = "smart"){
        /*
            Cuts a Sketch at a given line (i.e. copying it and some of its endpoints and attatch the other lines correctly)
            The following signatures are supported:

            (1) - line, true | fixed_pt, grp1, grp2
            (2) - line, true | fixed_pt, grp1
            (3) - line, true | fixed_pt, "smart"
            (4) - line, true | fixed_pt

            (5) - line, grp1, grp2
            (6) - line, grp1
            (7) - line, true | fixed_pt
            (8) - line

            (9)  - line[], grp1, grp2
            (10) - line[], grp1
            (11) - line[], "smart"
            (12) - line[], "force"
            (13) - line[]

            Line here may be replaced with 2 points which have a line between them or will form a straight line.
            Grp can also be given as a single line

            There are various reasons this can fail. To be documented. I.g. this fails if the input doesn't make sense in the current context.
            You should log the sketch and the stuff you put in right before.
        */
       
        if (line instanceof Array){
            if (line[0] instanceof Line){
                return cut_along_line_path(this, this.order_by_endpoints(...line), fixed_pt, grp1, grp2);
            }
            // The line is given by the two endpoints
            if (fixed_pt === true){
                fixed_pt = line[0];
            }
            line = line[0].common_line(line[1]) || this.line_between_points(line[0], line[1]);
        }

        if (fixed_pt === true){
            fixed_pt = line.p1;
        }

        if (line.p1.common_lines(line.p2) > 1) throw new Error("Endpoints of cut line have another line between them!");

        // We are in case (5) or (6)
        if (fixed_pt instanceof Array || fixed_pt instanceof Line){
            grp2 = grp1;
            grp1 = fixed_pt;
            fixed_pt = null;
        }

        if (grp1 instanceof Line){
            grp1 = [grp1]
        }

        if (grp2 instanceof Line){
            grp2 = [grp2]
        }

        if (fixed_pt instanceof Point) return cut_with_fixed_point(this, line, fixed_pt, grp1, grp2);
        else return cut_without_fixed_point(this, line, grp1, grp2);
    }

    glue(ident1, ident2, data = {}){
        /*
            IN:
                    ----x-----   or      x-----------|
                        |                  \
                        |                    \
                    ----x-----              ----
            Out:
                    ----------   or                |
                                                   |
                                                   |
                    ----------                     |

            (ident_1, ident_2, {
                points: > "merge"  <, "delete", "delete_both", callback
                lines:  > "delete" <, "keep", "merge", callback
            })

            Ident Data can be:

            line
                              ~> [pt1, pt2]  
            [point1, point2]
            [line1, pt1]      ~> [pt1, other_endpoint]

            if (two points agree they are automatically both pushed to position1);
        */

        /*
            Global form:
            [p1, p2], [p1, p2]
        */

        ident1 = _glue_ident_to_global_form(ident1);
        ident2 = _glue_ident_to_global_form(ident2);

        assert.VEC_NOT_EQUAL(ident1[0], ident1[1]);
        assert.VEC_NOT_EQUAL(ident2[0], ident2[1]);

        if (ident1[0] == ident2[1]){
            ident2 = [ident2[1], ident2[0]];
        } else if (ident1[1] == ident2[0]){
            ident1 = [ident1[1], ident1[0]];
        } else if (ident1[1] == ident2[1]){
            ident1 = [ident1[1], ident1[0]];
            ident2 = [ident2[1], ident2[0]];
        }

        data.points = data.points || "merge";
        data.lines = data.lines || "delete";
        if (data.points.startsWith("delete") && typeof data.lines == "string") {
            data.lines = default_data_callback;
        }

        if (data.points == "merge"){
            data.points = default_data_callback;
        }

        if (data.lines == "merge"){
            data.lines = default_data_callback;
        }

        data.anchors = data.anchors || "keep";

        if (ident1[0] == ident2[0]) return glue_with_fixed_point(this, ident1, ident2, data);
        return glue(this, ident1, ident2, data);
    }

    anchor(...objects){
        // Connect everything by anchor lines. Usefull to move things, around especially when glueing
        
        const pts = [];
        const lns = [];

        for (let i = 0; i < objects.length; i++){
            if (objects[i] instanceof ConnectedComponent){
                objects[i] = objects[i].root_el;
            }

            if (objects[i] instanceof Point) {
                pts.push(objects[i]);
            } else {
                pts.push(objects[i]);
            }
        }

        let connected_components = this.get_connected_components().map(c => c.obj());
        if (objects.length > 0){
            connected_components = connected_components.filter(c => {
                return c.points.some(p => pts.includes(p)) || c.lines.some(l => lns.includes(l)) 
            });
        }

        if (connected_components.length == 0) throw new Error("Nothing to anchor!");
        for (let i = 1; i < connected_components.length; i++){
            const a = this.line_between_points(
                connected_components[0].points[0],
                connected_components[i].points[0]
            );
            
            a.data = {
                __anchor: true
            };

            a.set_color("rgb(200,200,200)");
        }

        return this;
    }

    remove_anchors(){
        this.get_lines().filter(l => l.data?.__anchor).forEach(l => l.remove());
        return this;
    }

    oriented_component(el){
        /* Gibt zurück: 
            { 
                lines: Die Linien im Uhrzeigersinn,
                points: Die Punkte im Uhrzeigersinn, 
                        startend mit dem Endpunkt der ersten Linie am weitesten vorne im Uhrzeigersinn
                orientation: Für jede Linie, ob p1 -> p2 im Uhrzeigersinn verläuft        
                }
        */
        if (el instanceof ConnectedComponent) return this.oriented_component(el.root_el);

        let lines = [];
        if (el instanceof Array){
            lines.push(el.shift());

            let smth_changed = false;
            while (el.length > 0){
                for (let i = 0; i < el.length; i++){
                    if (el[i].common_endpoint(lines[lines.length - 1])){
                        lines.push(el.splice(i, 1));
                        smth_changed = true;
                    }
                }
                

                if (!smth_changed) throw new Error("Component lines don't form cycle.");
                smth_changed = true;
            }
            
            assert(lines[0].common_endpoint(lines[lines.length - 1]), "Component lines don't form cycle.");
        } else {
            if (el instanceof Line) lines = [el]
            else lines = [el.get_adjacent_lines()[0]];

            // Collect Lines (assert circle)
            let current_ep   = lines[0].p2;
            let current_line = lines[0];
            while (true){
                assert(current_ep.get_adjacent_lines().length == 2, "Component lines don't form cycle.");
                const next_line = current_ep.other_adjacent_line(current_line);
                if (next_line == lines[0]){
                    break;
                }
                lines.push(next_line);
                current_ep = next_line.other_endpoint(current_ep);
                current_line = next_line;
            }
        }

        if (!lines[1].has_endpoint(lines[0].p2)){
            // Make it so that the second line contains p2 of the first line
            const temp = lines.shift();
            lines.reverse();
            lines.unshift(temp);
        }

        const lines_with_orientation = [{
            "line": lines[0],
            "orientation": true
        }];

        for (let i = 1; i < lines.length; i++){
            lines_with_orientation.push({
                "line": lines[i],
                "orientation": lines_with_orientation[i - 1].orientation ?
                    lines[i - 1].p2 == lines[i].p1 : lines[i - 1].p1 == lines[i].p1

                // l1 -> l2 -> l3 -> l4
                // orientation TRUE: line in this chain is [p1, p2]
                // orientation FLASE: line in this chain is [p2, p1]
            });
        }

        // Figure out if test vec inside/outside polygon
        //      Construct Test Vec
        const cp = lines[0].position_at_fraction(0.5);
        const tv = lines[0].get_tangent_vector(cp);
        const test_vec = cp.add(tv.get_orthogonal().scale(EPS.FINE));

        //      Construct Polygon         
        const polygon = [].concat(...lines_with_orientation.map(l => {
            const abs = l.line.get_absolute_sample_points();
            if (!l.orientation){
                abs.reverse();
            }
            return abs;
        }));

        if (polygon_contains_point(polygon, test_vec)){
            lines_with_orientation.reverse();
            lines_with_orientation.forEach(l => l.orientation = !l.orientation);
        }

        const points = lines_with_orientation.map(l => {
            return l.orientation ? l.line.p1 : l.line.p2; // Den Anfangspunkt im Kreis
        });

        return {
            lines: lines_with_orientation.map(l => l.line),
            points,
            orientations: lines_with_orientation.map(l => l.orientation)
        }
    }

    path_between_points(p1, p2, line = null){
        if (line == null){
            assert.ONE_ADJACENT_LINE(p1);
            line = p1.get_adjacent_line();
        }

        assert.HAVE_SKETCH([line, p1, p2], this);
        assert.IS_LINE(line);
        assert.IS_POINT(p1);
        assert.IS_POINT(p2)

        const points = [p1];
        const lines = [line];
        let last_line_p2 = lines[0].other_endpoint(p1);
        while (last_line_p2 !== p2){
            points.push(last_line_p2);
            const new_line = last_line_p2.other_adjacent_line(lines[lines.length-1]);
            lines.push(new_line);

            assert(new_line instanceof Line, "There is no path from p1 to p2.");
            assert(last_line_p2 != p1, "There is no path from p1 to p2.");
            last_line_p2 = new_line.other_endpoint(last_line_p2);
        }
        points.push(p2);

        return {
            lines,
            points
        };
    }

    decompress_components(){
        const cc = this.get_connected_components().map(c => c.obj());
        if (cc.length == 0) return this;

        const cols = Math.floor(Math.sqrt(cc.length) * 1.5);

        let current_TL = new Vector(0,0);
        let current_index = 0;
        let max_height = 0;

        while (current_index < cc.length){
            for (let i = 0; i < cols && current_index < cc.length; i++){
                const c = cc[current_index];
                const off_by = current_TL.subtract(c.bounding_box.top_left);
                c.points.forEach(pt => pt.offset_by(off_by));

                current_index ++;
                current_TL.x += c.bounding_box.width + 3;
                max_height = Math.max(max_height, c.bounding_box.height);
            }

            current_TL.set(0, current_TL.y + max_height + 3);
            max_height = 0;
        }

        return this;
    }

    unfold(along_line, callback = (_element, _type, _original) => {}, in_place = true){
        if (!(along_line instanceof Line)){
            assert(
                along_line instanceof Array
                && along_line.length == 2, "Unfold data has wrong format."
            );
    
            assert.HAS_SKETCH(along_line[0], this);
            assert.HAS_SKETCH(along_line[1], this);
    
            const common = along_line[0].common_lines(along_line[1]);
            assert(common.length < 2, "Expected at most one glue line between glue points");
           
            along_line = this.line_between_points(...along_line);
            along_line.data.__temp = true;
        }
    
        along_line.data.__unfold_line = true;
        if (!in_place){
            const copy = this.copy();
            this.remove_underscore_attributes("__unfold_line");
            if (along_line.data.__temp) this.remove(along_line);
            return copy.unfold(copy.lines_by_key("__unfold_line")[true][0], false);
        }

        // In Place, along Line is a line;
        this.anchor();
        this.mirror(VERTICAL); // The "orignal" lines should keep orientation
        const cc = this.connected_component();

        const old_pts = [...this.points];
        const old_lines = [...this.lines];
        old_lines.forEach(l => l.data.__unfoldUID = tUID());
        old_pts.forEach(p => p.data.__unfoldUID = tUID());

        this.paste_sketch(this);
        cc.mirror(VERTICAL);

        const glue_lines = this.lines_by_key("__unfold_line")[true];
        this.glue(...glue_lines, { lines: "delete", anchors: "delete" });

        this.lines.forEach(l => {
            const ref = old_lines.filter(l => l.data.__unfoldUID == l.data.__unfoldUID)[0];
            if (ref == l) callback(l, "original", l)
            else callback(l, "mirror", ref);
        });

        this.points.forEach(l => {
            const ref = old_pts.filter(l => l.data.__unfoldUID == l.data.__unfoldUID)[0];
            if (ref == l) callback(l, "original", l)
            else callback(l, "mirror", ref);
        });

        return this;
    }

    remove_underscore_attributes(...attr){
        this.points.concat(this.lines).forEach(p => {
            for (const key of Object.keys(p.data)){
                if (
                    key.startsWith("__") 
                    && (
                        attr.length == 0
                        || attr.includes(key) || attr.includes(key.slice(2))
                    )
                ){
                    delete p.data[key];
                }
            }
        });

        return this
    }

    delete_with_underscore_attributes(...attr){
        this.lines.concat(this.points).forEach(p => {
            for (const key of Object.keys(p.data)){
                if (
                    key.startsWith("__") 
                    && (
                        attr.length == 0
                        || attr.includes(key) || attr.includes(key.slice(2))
                    )
                ){
                    this.remove(p);
                }
            }
        });

        return this;
    }
}

add_type_based_methods(SewingSketch);

function _glue_ident_to_global_form(ident){
    if (ident instanceof Line) {
        ident.data.__glue_line = true;
        return [ident.p1, ident.p2]
    };
    assert(ident instanceof Array, "Invalid glue ident");
    const [el1, el2] = ident;
    if (el1 instanceof Point && el2 instanceof Point) return ident;
    if (el1 instanceof Line && el2 instanceof Point){
        el1.data.__glue_line = true;
        return [el2, el1.other_endpoint(el2)];
    }
    if (el2 instanceof Line && el1 instanceof Point){
        el2.data.__glue_line = true;
        return [el1, el2.other_endpoint(el1)]
    };
    throw new Error("Bad glue identifier");
}

const _tUIDgen = tUID_gen();
const tUID = () => _tUIDgen.next().value
function* tUID_gen() {
    const MAX_SAFE_INT = Number.MAX_SAFE_INTEGER;
    let current = 0;

    while (true) {
        yield "tUID_" + current;
        current = (current + 1) >= MAX_SAFE_INT - 1 ? 0 : current + 1;
    }
}
