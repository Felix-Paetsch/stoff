import BaseStage from "./base_stages/baseStage.js";
import assert from "../assert.js";
import Logger from "./debug/logger.js";

export default class StageProcess {
    constructor(wd = {}, stages = []) {
        // Todo: Log activation / Gets / Calls
        this.logger = new Logger();

        this.working_data = wd;
        this.stages = [];
        for (const s of stages){
            this.add_stage(s);
        }

        this.is_finished = false;
        this.proxy = new Proxy(this, this.__proxy_handler());
        return this.proxy;
    }

    // Stage access & transitions
    // ----------------------------
  
    __proxy_handler() {
        return {
            get: (_target, prop, _receiver) => {
                if (typeof this[prop] !== "undefined"){
                    return this[prop];
                }

                assert(!this.is_finished, "Can't call methods on stages after finishing the stage process.");
                while (!this.__after_last_stage()){
                    if (this.__current_stage()._exposes(prop)){
                        return this.__current_stage()._get(prop);
                    }
                    this.advance_stage();
                }

                assert.THROW(`No future stage exposes thing "${prop}"`);
            },
            set: (target, prop, value, receiver) => {
                return Reflect.set(target, prop, value, receiver);
            }
        };
    }

    __mark_current_stage_exited(){
        const stage = this.__current_stage();
        assert.THROW(!!stage, "There is no current stage");
        let new_wd = stage.on_exit(this.working_data);
        this.working_data = new_wd || stage.wd || this.working_data;
    }

    __current_stage(){
        for (const stage of this.stages){
            if (stage.state == "active") return stage;
            if (stage.state == "unentered") {
                stage.set_working_data(this.working_data);
                stage.on_enter(this.working_data);
                return stage;
            }
        }
        assert.THROW("There is no current stage");
    }

    __after_last_stage(){
        return this.stages.length == 0 || this.stages[this.stages.length - 1].state === "exited";
    }

    call_stage_method(method_name, args = []){
        return this[method_name](...args);
    }

    advance_stage(){
        this.__mark_current_stage_exited();
    }

    finish(){
        assert(!this.is_finished, "Stage process was already finished.");
        while (!this.__after_last_stage()){
            this.advance_stage();
        }

        this.is_finished = true;
        const r = this.stages[this.stages.length - 1].finish(this.working_data);
        assert(typeof r !== "undefined", `.finish() returned >undefined<`);

        this.final_result = r;
        return this.final_result;
    }

    get_result(){
        if (!this.is_finished) return this.finish();
        return this.final_result;
    }

    // Adding Stages
    // -------------

    add_stage(stage, position_ident = null){
        assert(!this.is_finished, "Stage process was already finished.");

        if (!(stage instanceof BaseStage)){
            assert(stage?.prototype instanceof BaseStage, "Didn't provide valid stage.");
            stage = new stage();
        }

        stage.parent = this;
        if (position_ident === null) this.stages.push(stage);
        return this.proxy;
    }

    // Working Data
    // --------------------

    set_working_data(data){
        this.working_data = data;
        this.__current_stage().set_working_data(data);
        return this.proxy;
    }

    get_working_data(){
        return this.__current_stage().get_working_data() || this.working_data;
    }

    // Logging && Debug
    // ----------------

    log_string(){
        let res = `StageProcess[${ this.is_finished ? "finished" : "unfinished"}]\n------------------------ \n`;
        for (const stage of this.stages){
            res += stage.log_string() + "\n";
        }

        res = res.slice(0, res.length - 1);
        return res;
    }

    process_log_string(){
        return this.log_string();
    }

    log(){
        console.log(this.log_string());
    }

    process_log(){
        this.log();
    }
}