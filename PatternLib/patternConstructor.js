import PatternStage from "./pattern_stages/baseStage.js";
import assert from "../StoffLib/assert.js";
import InitStage from "./pattern_stages/initStage.js";

export default class PatternConstructor {
    constructor(measurements = null, stages = []) {
        this.measurements = measurements || null;
        this.working_data = {};

        this.current_stage = -1;
        this.stages = [];
        this.add_patter_stage(InitStage);
        this.__advance_stage();

        for (const s of stages){
            this.add_patter_stage(s);
        }

        this.is_finished = false;
        
        this.proxy = new Proxy(this, this.#proxy_handler());
        return this.proxy;
    }
  
    #proxy_handler() {
        return {
            get: (_target, prop, _receiver) => {
                if (typeof this[prop] !== "undefined"){
                    return this[prop];
                }

                if (this.is_finished){
                    assert.THROW("Can't call methods on stages after finishing the pattern.");
                }

                if (this.stages[this.current_stage]._exposes(prop)){
                    return this.stages[this.current_stage]._get(prop);
                }

                while (!this.on_last_stage()) {
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

    add_patter_stage(stage, position_ident = null){
        if (!(stage instanceof PatternStage)){
            assert(stage?.prototype instanceof PatternStage, "Didn't provide valid stage.");
            stage = new stage();
        }

        stage.pattern_constructor = this;
        stage.measurements = this.measurements;
        if (position_ident === null) this.stages.push(stage);
        return this.proxy;
    }

    finish(){
        assert(!this.is_finished, "Pattern was already finished.");

        while (this.current_stage < this.stages.length - 1){
            this.__advance_stage();
        }

        this.is_finished = true;
        const r = this.stages[this.current_stage].finish(this.working_data, this.measurements);
        assert(typeof r !== "undefined", `.finish() returned >undefined<`);

        this.final_result = r;
        return this.final_result;
    }

    get_result(){
        if (!this.is_finished) return this.finish();
        return this.final_result;
    }

    _get_original(){
        return this;
    }

    on_last_stage(){
        return this.current_stage == this.stages.length -1;
    }

    __advance_stage(){
        assert(this.current_stage < this.stages.length - 1, "No further stage to advance to.");

        const current_stage = this.stages[this.current_stage];
        let new_wd = current_stage?.on_exit ? 
            current_stage.on_exit(this.working_data, this.measurements)
            : this.working_data;

        this.working_data = new_wd ? new_wd : current_stage.wd ? current_stage.wd : this.working_data;

        const next_stage = this.stages[++this.current_stage];
        next_stage.wd = this.working_data;
        next_stage.measurements = this.measurements;
        next_stage.on_enter(this.working_data, this.measurements);

        return this;
    }

    set_working_data(data){
        this.working_data = data;
        this.stages[this.current_stage].wd = data;
        return this.proxy;
    }

    get_working_data(){
        return current_stage.wd || this.working_data;
    }
}
