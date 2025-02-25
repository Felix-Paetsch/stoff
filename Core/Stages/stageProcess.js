import BaseStage from "./base_stages/baseStage.js";
import assert from "../assert.js";
import InitStage from "./base_stages/initStage.js";

export default class StageProcess {
    constructor(stages = [], wd = {}) {
        this.working_data = wd;

        this.current_stage = -1;
        this.stages = [];
        this.add_stage(InitStage);
        this.__advance_stage();

        for (const s of stages){
            this.add_stage(s);
        }

        this.is_finished = false;
        this.proxy = new Proxy(this, this.__proxy_handler());
        return this.proxy;
    }
  
    __proxy_handler() {
        return {
            get: (_target, prop, _receiver) => {
                if (typeof this[prop] !== "undefined"){
                    return this[prop];
                }

                if (this.is_finished){
                    assert.THROW("Can't call methods on stages after finishing the stage process.");
                }

                if (this.stages[this.current_stage]._exposes(prop)){
                    return this.stages[this.current_stage]._get(prop);
                }

                while (this.current_stage < this.stages.length){
                    this.__advance_stage();

                    if (this.stages[this.current_stage]._exposes(prop)){
                        return this.stages[this.current_stage]._get(prop);
                    }
                }

                assert.THROW(`No future stage exposes thing "${prop}"`);
            },
            set: (target, prop, value, receiver) => {
                return Reflect.set(target, prop, value, receiver);
            }
        };
    }

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

    finish(){
        assert(!this.is_finished, "Stage process was already finished.");

        while (this.current_stage !== this.stages.length - 1){
            this.__advance_stage();
        }

        this.__exit_stage();

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

    __advance_stage(){
        if (this.is_finished) return;
        this.__exit_stage();
        this.__enter_stage();
    }

    __enter_stage(){
        if (this.current_stage == this.stages.length -1){
            return this.get_result();
        }

        const next_stage = this.stages[++this.current_stage];
        next_stage.set_working_data(this.working_data);
        next_stage.on_enter(this.working_data);
    }

    __exit_stage(){
        if (this.current_stage == -1 && this.is_finished) return;
        const current_stage = this.stages[this.current_stage];
        let new_wd = current_stage?.on_exit ? 
            current_stage.on_exit(this.working_data)
            : this.working_data;

        this.working_data = new_wd ? new_wd : current_stage.wd ? current_stage.wd : this.working_data;
    }

    set_working_data(data){
        this.working_data = data;
        this.stages[this.current_stage].set_working_data(data);
        return this.proxy;
    }

    get_working_data(){
        return current_stage.wd || this.working_data;
    }
}
