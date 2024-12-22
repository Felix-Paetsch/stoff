// A full Pattern; also having methods for he website and so on

import PatternComponent from "../core/pattern_component.js";

export default class Pattern extends PatternComponent{
    constructor(measurements = {}, design_config = {}){
        super(null);

        this.mea = measurements;
        this.measurements = measurements;
        this.design_config = design_config;
    }

    

    render(){
        if (this.sketch) return this.sketch;
        throw new Error("Unimplemented");
    }

    render_print(){
        return this.render();
    }

    render_guide(){
        return this.render();
    }
}
