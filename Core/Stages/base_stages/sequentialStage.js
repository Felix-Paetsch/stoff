import assert from "../../assert.js";
import BaseStage from "./baseStage.js";

export default class SequentialStage extends BaseStage{
    constructor(pure = true, stages = []){
        super();
        
        this.substages = [];
        for (const s of stages){
            this.add_stage(s);
        }

        this.pure_exposes = pure;
        this._exposes = pure ? this._exposes_pure : this._exposes_non_pure;
        this.exposed_removed.push("add_stage");
    }

    _exposes_pure(obj){
        if (super._exposes(obj)) return true;

        for (const stage of this.substages){
            if (stage.state !== "exited" && stage._exposes(obj)){
                return true;
            }
        }

        return false;
    }

    _exposes_non_pure(obj){
        if (super._exposes(obj)) return true;

        while (true){
            if (this.#after_last_stage()){
                return false;
            }
            if (this.#current_stage()._exposes(obj)){
                return true;
            }
            this.#mark_current_stage_exited();
        }
    }

    _get(obj){
        assert(this._exposes(obj), `Stage does not expose method you try to call: ${ obj }\nSince this is a sequential stage take note that ._exposes() is not a pure function unless overwritten.`);
        if (super._exposes(obj)) return super._get(obj);

        while (true){
            if (this.#current_stage()._exposes(obj)){
                return this.#current_stage()._get(obj);
            }
            this.#mark_current_stage_exited();
        }
    }

    advance_stage(){
        if (!this.#after_last_stage()){
            return super.advance_stage()
        }

        this.#mark_current_stage_exited();
    }

    on_exit(){
        while(!this.#after_last_stage()){
            this.#mark_current_stage_exited();
        }
    }

    finish(){
        return this.substages[this.substages.length - 1].finish();
    }

    add_stage(stage, position_ident = null){
        if (!(stage instanceof BaseStage)){
            assert(stage?.prototype instanceof BaseStage, "Didn't provide valid stage.");
            stage = new stage();
        }

        stage.parent = this;
        if (position_ident === null) this.substages.push(stage);
    }

    set_working_data(data){
        super.set_working_data(data);
        if (!this.#after_last_stage()) this.#current_stage().set_working_data(data);
    }

    get_working_data(){
        return this.#after_last_stage() ? this.wd : this.#current_stage().get_working_data(data) || this.wd;
    }

    #mark_current_stage_exited(){
        const stage = this.#current_stage();
        assert.THROW(!!stage, "There is no current stage");
        let new_wd = stage.on_exit(this.wd);
        this.wd = new_wd || stage.wd || this.wd;
    }

    #current_stage(){
        for (const stage of this.substages){
            if (stage.state == "active") return stage;
            if (stage.state == "unentered") {
                stage.set_working_data(this.wd);
                stage.on_enter(this.wd);
                return stage;
            }
        }
        return null;
    }

    #after_last_stage(){
        return this.substages.length == 0 || this.substages[this.substages.length - 1].state === "exited";
    }

    log_string(){
        let res = `${ super.log_string() }\n`;
        for (let i = 0; i < this.substages.length; i++){
            res += "  "
            if (i == this.current_stage){
                res += "> "
            } else {
                res += "  "
            }
            res += this.substages[i].log_string().split("\n").join("\n  ") + "\n";
        }

        res = res.slice(0, res.length - 1);
        return res;
    }

    call_substage_method(...args) {
        assert(this._exposes(args[0]), `Substage method '${args[0]}' doesn't exist!`);
        super.call_stage_method(...args);
    }
}