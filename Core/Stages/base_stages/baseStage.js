import assert from "../../assert.js";

export default class BaseStage{
    constructor(){
        this.state = "unentered"; // active, exited

        // Will be set before on_enter;
        this.parent = null;
        this.wd = null;

        // May overwrite in subclass
        this.name = null;

        this.exposed_removed = ["on_enter", "on_exit", "finish", "remove_exposed", "add_exposed"];
        this.exposed_added = {};
    }

    // For pattern constructor
    _exposes(obj){
        return (typeof this[obj] === "function" || typeof this.exposed_added[obj] === "function") 
        && !obj.startsWith("_") 
        && !obj.startsWith("#")
        && !this.exposed_removed.includes(obj);
    } 

    _get(obj){
        assert(this._exposes(obj), `Stage does not expose method you try to call: ${ obj }`);
        return this.exposed_added[obj] || this[obj].bind(this);
    }

    // Methods to call on stage
    advance_stage(){
        this.parent.__advance_stage();
    }

    remove_exposed(key){
        this.exposed_removed.push(key);
        return this;
    }

    add_exposed(key, value){
        this.exposed_added[key] = value;
        this.exposed_removed = this.exposed_removed.filter(k => key !== k);
        return this;
    }

    on_enter(){
        this.state = "active";
    }
    on_exit(){
        this.state = "exited";
    }  
    finish(){
        assert.THROW("Stage doesn't implement finish.");
    }

    set_working_data(data){
        this.wd = data
    }
}