// Note that this stage doen't behave perfectly nicely
// You will have to choose it you want to use _exposes_pure or _exposes_non_pure
// For checking if stage exposes something

import assert from "../../assert.js";
import BaseStage from "./baseStage.js";
import InitStage from "./initStage.js";

export default class SequentialStage extends BaseStage{
    constructor(pure = false){
        super();
        
        this.current_stage = -1;
        this.substages = [];
        this.add_stage(InitStage);
        this.__advance_stage();

        for (const s of stages){
            this.add_stage(s);
        }

        this.pure_exposes = pure;
        this._exposes = pure ? this._exposes_pure : this._exposes_non_pure;
    }

    _exposes_pure(obj){
        if (super._exposes(obj)) return true;

        for (let i = this.current_stage; i < this.substages.length; i++){
            if (this.substages[this.current_stage]._exposes(i)){
                return true;
            }
        }

        return false;
    }

    _exposes_non_pure(obj){
        if (super._exposes(obj)) return true;

        while (true){
            if (this.substages[this.current_stage]._exposes(obj)){
                return true;
            }
            if (this.current_stage != this.substages.length - 1){
                this.advance_stage();
                break;
            }
        }

        return false;
    }

    _get(obj){
        assert(this._exposes(obj), `Stage does not expose method you try to call: ${ obj }\nSince this is a sequential stage take note that ._exposes() is not a pure function unless overwritten.`);
        return this.exposed_added[obj] || this[obj].bind(this);
    }

    advance_stage(){
        if (this.current_stage == this.substages.length - 1){
            return super.advance_stage()
        }

        this.#substage_exit();
        this.#substage_enter();
    }

    on_enter(...args){
        super.on_enter(...args);
        this.#substage_enter();
    }

    on_exit(){
        for (let i = this.current_stage; i < this.substages.length - 1; i++){
            this.#substage_exit();
            this.#substage_enter();
        }
        if (this.#current_stage().state == "active"){
            this.#substage_exit();
        }
        super.on_exit();
    }

    add_stage(stage, position_ident = null){
        if (!(stage instanceof BaseStage)){
            assert(stage?.prototype instanceof BaseStage, "Didn't provide valid stage.");
            stage = new stage();
        }

        stage.parent = this;
        if (position_ident === null) this.stages.push(stage);
    }

    set_working_data(data){
        super.set_working_data(data);
        this.#current_stage().set_working_data(data);
    }

    #substage_exit(){
        if (this.current_stage == -1) return; // Initialization
        
        assert(this.current_stage < this.substages.length);
        const current_stage = this.#current_stage();

        assert(this.current_stage.state == "active");
        let new_wd = current_stage.on_exit(this.wd);
        this.wd = new_wd ? new_wd : current_stage.wd ? current_stage.wd : this.wd;
    }

    #substage_enter(){
        assert(this.current_stage < this.substages.length - 1);
        this.current_stage++;
        
        const next_stage = this.#current_stage();
        assert(next_stage.stage == "unentered")
        
        next_stage.set_working_data(this.wd);
        next_stage.on_enter(this.wd);
    }

    #current_stage(){
        return this.substages[this.current_stage];
    }
}