import SComponent from "./component.js";

export default class SNumber extends SComponent{
    constructor(name, default_value = null, min = 0, max = 1, step_size = 0.01){
        super(name, default_value);
        this.min = min;
        this.max = max;
        this.step_size = step_size;

        this.valid_con(() => {
            return this.min <= this.value && this.value <= this.max;
        });
    }

    increment(){
        return this.set(
            Math.min(this.value + 1, this.max)
        );
    }

    decrement(){
        return this.set(
            Math.max(this.value - 1, this.min)
        );
    }
}