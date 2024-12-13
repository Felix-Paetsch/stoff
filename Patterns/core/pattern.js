import Sketch from "../../StoffLib/sketch.js";

export default class Pattern extends PatternComponent{
    constructor(measurements = {}, design_config = {}){
        super(null);

        this.mea = measurements;
        this.measurements = measurements;
        this.design_config = design_config;
    }

    render(){
        return new Sketch();
    }
}
