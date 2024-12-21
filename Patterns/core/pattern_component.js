import { dublicate_data } from "../../StoffLib/copy.js";
import { UP } from "../../StoffLib/geometry.js";
import { Line } from "../../StoffLib/line.js";
import { Point } from "../../StoffLib/point.js";

export default class PatternComponent{
    constructor(parent = null){
        if (parent){
            this.mea = parent.mea;
            this.measurements  = parent.mea;
            this.design_config = parent.design_config;

            if (parent.sketch) {
                this.sketch = parent.sketch;
            }
        }

        this.parent = parent;
        this.components = [];
        this.up_direction = UP;
    }

    get_component_names(){
        return Object.keys(this.components).filter(k => !/^\d+$/.test(k));
    }
    
    get_components(){
        return this.components;
    }

    get_component(name){
        return this.components[name];
    }

    add_component(...args){
        if (args.length == 1){
            this.components.push(args[0]);
            return args[0];
        } else {
            this.components.push(args[1]);
            this.components[args[0]] = args[1];
            return args[1];
        }
    }

    construct_component(...args){
        if (typeof args[0] == "string"){
            const component = new args[1](this, ...args.slice(2));
            component.construct();
            this.components.push(component);
            this.components[args[0]] = component;
            return component;
        } else {
            const component = new args[0](...args.slice(1));
            component.construct();
            this.components.push(component);
            return component;
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
        throw new Error("Component doesn't have Sketch");
    }

    set_grainline(vec){
        if (this.sketch){
            this.sketch.data.up_direction = vec;
        }

        this.up_direction = vec;
        return this;
    }

    _set_line_point_array_methods(arr){
        arr.set_type = (t)    => arr.forEach(x => x.data.type = t);
        arr.set_data = (data) => arr.forEach(x => {
            if (typeof data == "function") {
                const r = data(x);
                if (r) x.data = r;
            } else {
                x.data = dublicate_data(data);
            }
        });
        return arr;
    }

    render(){
        throw new Error("Unimplemented for this component type");
    }
}
