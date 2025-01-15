import assert from "../../StoffLib/assert.js";

export default class PatternStage{
    constructor(){
        // Will be set before on_enter;
        this.pattern_constructor = null;
        this.measurements = null; 
        this.wd = null;

        // May overwrite in subclass
        this.name = null;

        this.exposed_removed = ["on_enter", "on_exit", "finish", "remove_exposed", "add_exposed"];
        this.exposed_added = {};
    }

    // For pattern constructor
    __exposes(obj){
        return (typeof this[obj] === "function" || typeof this.exposed_added[obj] === "function") 
        && !obj.startsWith("_") 
        && !obj.startsWith("#")
        && !this.exposed_removed.includes(obj);
    } 

    __get(obj){
        assert(this.__exposes(obj), `Stage does not expose method you try to call: ${ obj }`);
        return this.exposed_added[obj] || this[obj];
    }

    // Methods to call on stage
    advance_stage(){
        return this.pattern_constructor.__advance_stage();
    }

    remove_exposed(key){
        this.exposed_removed.push(key);
    }

    add_exposed(key, value){
        this.exposed_added[key] = value;
        this.exposed_removed = this.exposed_removed.filter(k => key !== k);
    }

    on_enter(){}
    on_exit(){}
    finish(){
        assert.THROW("Stage doesn't implement finish.");
    }
}