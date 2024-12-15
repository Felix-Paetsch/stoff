import { UP } from "../../StoffLib/geometry.js";

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
        } else {
            this.components.push(args[1]);
            this.components[args[0]] = args[1];
        }
    }

    get_line(type){
        if (!this.sketch) throw new Error("Component has no canonical sketch!");
        return this.sketch.lines_by_key("type")[type][0];
    }

    get_lines(type){
        if (!this.sketch) throw new Error("Component has no canonical sketch!");
        return this.sketch.lines_by_key("type")[type];
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

    render(){
        throw new Error("Unimplemented for this component type");
    }
}
