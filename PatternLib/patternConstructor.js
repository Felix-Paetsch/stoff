import PatternStage from "./pattern_stages/baseStage.js";
import assert from "../StoffLib/assert.js";
import InitStage from "./pattern_stages/initStage.js";

export default class PatternConstructor {
    constructor(measurements, stages) {
        this.measurements = measurements;
        this.current_stage = 0;
        this.stages = [new InitStage(this), stages];

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

                for (let i = this.current_stage; i < this.stages.length; i++){
                    if (!this.stages[i].__exposes(prop)){
                        for (let j = this.current_stage; j < i; j++) this.#advance_stage();
                        return this.stages[i].__get(prop);
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

        while (this.current_stage < this.stages.length){
            this.#advance_stage();
        }

        this.is_finished = true;
        this.result = this.stages[this.current_stage].finish();
        return this.result;
    }

    _get_original(){
        return this;
    }

    #advance_stage(){
        assert(this.current_stage < this.stages.length, "No further stage to advance to.");
        this.stages[this.current_stage].on_exit();
        this.stages[++this.current_stage].on_enter();
        return this;
    }
}
