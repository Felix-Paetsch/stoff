/* 
    Part of a pattern. At the scale of closed components.
    Can be rendered alone!
*/

import { UP } from "../../StoffLib/geometry.js";
import add_seam_allowance from "./seam_allowance.js";
import { assert } from "../../Debug/validation_utils.js";
import PatternPart from "./pattern_part.js";

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

    render(){
        throw new Error("Unimplemented for this component type");
    }
}
