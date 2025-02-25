/* 
    Part of a pattern. Abitrarily small scale.
    E.g. Armpit, Neckline
*/

import { dublicate_data } from "../../Core/StoffLib/copy.js";
import Line from "../../Core/StoffLib/line.js";
import Point from "../../Core/StoffLib/point.js";

import fill_in_darts from "./pattern_part_methods/fill_in_darts.js";

export default class PatternPart{
    constructor(parent){
        if (parent){
            this.mea = parent.mea;
            this.measurements  = parent.mea;
            this.design_config = parent.design_config;

            if (parent.sketch) {
                this.sketch = parent.sketch;
            }
        }
    }

    get_line(type){
        if (!this.sketch) throw new Error("Component has no canonical sketch!");
        return this.sketch.lines_by_key("type")[type][0];
    }

    get_lines(type){
        if (!this.sketch) throw new Error("Component has no canonical sketch!");
        return this._set_line_point_array_methods(this.sketch.lines_by_key("type")[type] || []);
    }

    get_untyped_lines(){
        return this.get_lines("_");
    }

    get_untyped_points(){
        return this.get_points("_");
    }

    get_point(type){
        if (!this.sketch) throw new Error("Component has no canonical sketch!");
        return this.sketch.points_by_key("type")[type][0];
    }

    get_points(type){
        if (!this.sketch) throw new Error("Component has no canonical sketch!");
        return this._set_line_point_array_methods(this.sketch.points_by_key("type")[type] || []);
    }

    point_between_lines(type1, type2){
        return this.points_between_lines(type1, type2)[0];
    }

    points_between_lines(check1, check2){
        if (typeof check1 == "string"){
            const type = check1;
            check1 = (ln) => ln.data.type === type 
        } else if (check1 instanceof Line){
            const checkln = check1;
            check1 = (ln) => ln == checkln;
        }

        if (typeof check2 == "string"){
            const type = check2;
            check2 = (ln) => ln.data.type === type 
        } else if (check2 instanceof Line){
            const checkln = check2;
            check2 = (ln) => ln == checkln;
        }

        const points = [];
        const lines = this.sketch.get_lines();
        const checks = lines.map(l => [check1(l), check2(l)]);

        for (let i = 0; i < lines.length - 1; i++){
            if (!checks[i][0] && !checks[i][1]){
                continue;
            }
            for (let j = i + 1; j < lines.length; j++){
                const common_endpoint = lines[i].common_endpoint(lines[j]);
                if (
                    common_endpoint &&
                    (
                        (checks[j][0] && checks[i][1])
                        || (checks[j][1] && checks[i][0])
                    )
                ){
                    points.push(common_endpoint);
                }
            }
        }

        return this._set_line_point_array_methods(points);
    }

    line_between_points(check1, check2){
        return this.lines_between_points(check1, check2)[0];
    }

    lines_between_points(check1, check2){
        if (typeof check1 == "string"){
            const type = check1;
            check1 = (ln) => ln.data.type === type 
        } else if (check1 instanceof Point){
            const checkpt = check1;
            check1 = (pt) => pt == checkpt;
        }

        if (typeof check2 == "string"){
            const type = check2;
            check2 = (ln) => ln.data.type === type 
        } else if (check2 instanceof Point){
            const checkpt = check2;
            check2 = (pt) => pt == checkpt;
        }

        const lines = [];
        const points = this.sketch.get_points();
        const checks = points.map(p => [check1(p), check2(p)]);

        for (let i = 0; i < points.length - 1; i++){
            if (!checks[i][0] && !checks[i][1]){
                continue;
            }
            for (let j = i + 1; j < points.length; j++){
                if (
                    (checks[j][0] && checks[i][1])
                    || (checks[j][1] && checks[i][0])
                ){
                    lines.push(
                        ...points[i].get_adjacent_lines().filter(
                            l => l.get_endpoints().includes(points[j])
                        )
                    );
                }
            }
        }

        return this._set_line_point_array_methods(lines);
    }

    adjacent_line(pt, check){
        return this.adjacent_lines(pt, check)[0];
    }

    adjacent_lines(pt, check = null){
        if (typeof check == "string"){
            const type = check;
            check = (ln) => ln.data.type === type 
        } else if (check == null || check == true){
            check = (ln) => true;
        }

        return this._set_line_point_array_methods(
            pt.get_adjacent_lines().filer(l => check(l))
        );
    }

    get_sketch(){
        if (this.sketch) return this.sketch;
        throw new Error("Component/Part doesn't have Sketch");
    }

    _set_line_point_array_methods(arr){
        arr.set_type = (t)    => {
            arr.forEach(x => x.data.type = t);
            return arr;
        };
        arr.set_data = (data) => {
            arr.forEach(x => {
                if (typeof data == "function") {
                    const r = data(x);
                    if (r) x.data = r;
                } else {
                    x.data = dublicate_data(data);
                }
            });
            return arr;
        };
        return arr;
    }

    render(){
        throw new Error("Unimplemented for this part");
    }
}

PatternPart.prototype.fill_in_darts = fill_in_darts;
