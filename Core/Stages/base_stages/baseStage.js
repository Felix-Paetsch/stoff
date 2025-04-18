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

        const old_on_enter = this.on_enter.bind(this);
        const old_on_exit  = this.on_exit.bind(this);
        this.on_enter = ((...args) => {
            this.state = "active"
            return old_on_enter(...args);
        });
        this.on_exit = ((...args) => {
            const res = old_on_exit(...args);
            this.state = "exited"
            return res;
        });
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
        this.parent.advance_stage();
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

    on_enter(){}
    on_exit(){}

    finish(){
        assert.THROW("Stage doesn't implement finish.");
    }

    set_working_data(data){
        this.wd = data;
    }

    get_working_data(){
        return this.wd;
    }

    process_log_string(){
        return this.parent.process_log_string();
    }

    log_string(){
        return `${ this.constructor.name }${ this.name ? ": " + this.name + " " : ""}[${ this.state }]`;
    }

    log(){
        console.log(this.log_string());
    }

    process_log(){
        console.log(this.process_log_string());
    }

    call_stage_method(method_name, args = []){
        return this.parent.call_stage_method(method_name, args);
    }
}