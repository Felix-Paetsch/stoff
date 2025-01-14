import assert from "../../StoffLib/assert.js";

export default class PatternStage{
    constructor(constructor = null){
        this.pattern_constructor = constructor?._get_original ? constructor._get_original() : null;
    }

    __exposes(obj){
        return typeof this[obj] === "function" 
        && !obj.startsWith("_") 
        && !obj.startsWith("#")
        && !["on_enter", "on_exit", "finish"].includes(obj);
    } 

    __get(obj){
        assert(this.__exposes(obj), `Stage does not expose method you try to call: ${ method }`);
        return this[obj];
    }

    on_enter(){}
    on_exit(){}
    finish(){
        assert.THROW("Stage doesn't implement finish.");
    }
}