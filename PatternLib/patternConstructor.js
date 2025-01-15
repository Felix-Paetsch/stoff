import PatternStage from "./pattern_stages/baseStage.js";
import assert from "../StoffLib/assert.js";
import InitStage from "./pattern_stages/initStage.js";

export default class PatternConstructor {
    constructor(measurements = null, stages = []) {
        this.measurements = measurements || null;

        this.stages = [];
        this.add_patter_stage(InitStage);
        this.current_stage = 0;
        for (const s of stages){
            this.add_patter_stage(s);
        }

        this.is_finished = false;
        this.working_data = {};
        
        this.proxy = new Proxy(this, this.#proxy_handler());
        return this.proxy;
    }
  
    #proxy_handler() {
        return {
            get: (_target, prop, _receiver) => {
                if (typeof this[prop] !== "undefined"){
                    return this[prop];
                }

                for (let i = this.current_stage; i < this.stages.length; i++){
                    if (this.stages[i].__exposes(prop)){
                        for (let j = this.current_stage; j < i; j++) this.__advance_stage();
                        const r = this.stages[i].__get(prop);
                        if (typeof r == "function"){
                            return r.bind(this.stages[i]);
                        }
                        return r;
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
            stage = new stage(this.proxy);
        }

        stage.pattern_constructor = this;
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

    __advance_stage(){
        assert(this.current_stage < this.stages.length - 1, "No further stage to advance to.");
        
        const current_stage = this.stages[this.current_stage];
        const new_wd = current_stage.on_exit(this.working_data, this.measurements);
        this.working_data = new_wd ? new_wd : current_stage.wd ? current_stage.wd : this.working_data;

        const next_stage = this.stages[++this.current_stage];
        next_stage.wd = this.working_data;
        next_stage.measurements = this.measurements;
        next_stage.on_enter(this.working_data, this.measurements);

        return this;
    }
}
