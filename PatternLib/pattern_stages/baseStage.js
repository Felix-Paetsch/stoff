import assert from "../../StoffLib/assert.js";

export default class PatternStage{
    constructor(){
        // Will be set before on_enter;
        this.pattern_constructor = null;
        this.measurements = null; 
        this.wd = null;

        // May overwrite in subclass
        this.name = null;
    }

    __exposes(obj){
        return typeof this[obj] === "function" 
        && !obj.startsWith("_") 
        && !obj.startsWith("#")
        && !["on_enter", "on_exit", "finish"].includes(obj);
    } 

    __get(obj){
        assert(this.__exposes(obj), `Stage does not expose method you try to call: ${ obj }`);
        return this[obj];
    }

    on_enter(){}
    on_exit(){}
    finish(){
        assert.THROW("Stage doesn't implement finish.");
    }
}