/* 
    Part of a pattern. At the scale of closed components.
    Can be rendered alone!
*/

import { UP } from "../../StoffLib/geometry.js";
import add_seam_allowance from "./pattern_component_methods/seam_allowance.js";
import { assert } from "../../DevEnv/Debug/validation_utils.js";
import PatternPart from "./pattern_part.js";
import Point from "../../StoffLib/point.js";

export default class PatternComponent extends PatternPart{
    constructor(parent = null){
        super(parent);

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
            return this;
        } else {
            this.components.push(args[1]);
            this.components[args[0]] = args[1];
            return this;
        }
    }

    set_component(name, value){
        this.components[this.components.indexOf(this.components[name])] = value;
        this.components[name] = value;
        return this;
    }

    remove_component(name){
        if (this.components[name]){
            this.components.filter(c => c !== this.components[name]);
            delete this.components[name];
            return;
        }

        for (let key of Object.keys(this.components)){
            if (this.components[key] == name) return this.remove_component(key);
        }

        this.components.filter(c => c !== name);
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

    set_grainline(vec){
        if (this.sketch){
            this.sketch.data.up_direction = vec;
        }

        this.up_direction = vec;
        return this;
    }

    add_seam_allowance(base, values){
        assert(this.sketch, "Component doesn't have sketch!");
        if (!values){
            values = base;
            base = this.get_seam_allowance_component();
        }

        add_seam_allowance(this.sketch, base, values);
    }

    dart_lines(most_inner_pt, most_outer_pt){
        const odl = this.ordered_dart_lines(most_inner_pt, most_outer_pt);
        const res = [];
        for (let i = 0; i < odl.length; i++){
            res.push(odl[i].inner, odl[i].outer);
        }

        return res;
    }
    
    ordered_dart_lines(lines = null, most_inner_pt = null, most_outer_pt = null){
        if (lines instanceof Point){
            most_outer_pt = most_inner_pt;
            most_inner_pt = lines;
            lines = null;
        }

        if (lines == null){
            lines = this.get_lines("dart");
        }

        if (most_inner_pt == null){
            const r = this._dart_lines_default_inner_outer_poitns();
            most_inner_pt = r[0];
            most_outer_pt = r[1];
        }

        assert(most_inner_pt !== most_outer_pt, "Ordering Points must be different");
        const res = [];

        const start_pt = most_inner_pt;
        const stop_pt  = most_outer_pt;

        const directions = start_pt.get_adjacent_lines();
        directions.forEach(line => {
            const dart_lines = [];

            let current_line = line;
            let next_ep = current_line.other_endpoint(start_pt);
            while (true){
                if (
                    current_line.data.type == "dart" && lines.includes(current_line)
                ) dart_lines.push(current_line);
                if (next_ep.get_adjacent_lines().length !== 2 || next_ep == stop_pt) break;
                if (next_ep == start_pt) throw new Error("Looped back to start_pt while trying to math dart lines!");

                current_line = next_ep.other_adjacent_line(current_line);
                next_ep = current_line.other_endpoint(next_ep);
            }
            if (dart_lines.length % 2 == 1) throw new Error("Found single dart line!");
            for (let i = 0; i < dart_lines.length - 1; i += 2){
                dart_lines[i].data.dartside = "inner";
                dart_lines[i+1].data.dartside = "outer";
                res.push({
                    inner: dart_lines[i],
                    outer: dart_lines[i + 1]
                })
            }
        });

        return res;
    }

    set_computed_dart_sides(...args){
        return this.ordered_dart_lines(...args);
    }

    render(){
        throw new Error("Unimplemented for this component type");
    }
}
