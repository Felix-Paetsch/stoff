import { assert } from "../../Debug/validation_utils.js";
import Sketch from "../../StoffLib/sketch.js";
import { Line } from "../../StoffLib/line.js";
import { Vector } from "../../StoffLib/geometry.js";

import { cut_with_fixed_point, cut_without_fixed_point, cut_along_line_path } from "./sketch_methods/cut.js";
import { glue_with_fixed_point, glue } from "./sketch_methods/glue.js";
import { Point } from "../../StoffLib/point.js";
import { ConnectedComponent } from "../../StoffLib/connected_component.js";
import { default_data_callback } from "../../StoffLib/copy.js";

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
                return cut_along_line_path(this, this.order_by_endpoints(...line), fixed_pt, grp1);
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

        assert(
            ident1[0].distance(ident1[1]) > 0.00000001
            && ident2[0].distance(ident2[1]) > 0.00000001
            , "Glueing points for each side must be distinct.")
    
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

    anchor(anchor_string = null, ...objects){
        // Connect everything by anchor lines. Usefull to move things, around especially when glueing
        
        if (typeof anchor_string !== "string"){
            if (anchor_string) objects.push(anchor_string);
            anchor_string = "anchor";
        }

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
                type: anchor_string
            };

            a.set_color("rgb(200,200,200)");
        }

        return this;
    }

    remove_anchors(){
        this.get_lines().filter(l => l.data?.type == "anchor").forEach(l => l.remove());
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
}

function _glue_ident_to_global_form(ident){
    if (ident instanceof Line) return [ident.p1, ident.p2];
    assert(ident instanceof Array);
    const [el1, el2] = ident;
    if (el1 instanceof Point && el2 instanceof Point) return ident;
    if (el1 instanceof Line && el2 instanceof Point) return [el2, el1.other_endpoint(el2)];
    if (el2 instanceof Line && el1 instanceof Point) return [el1, el2.other_endpoint(el1)];
    throw new Error("Bad glue identifier");
}