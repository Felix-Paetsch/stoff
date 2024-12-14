import WithoutDart from "./without_dart.js";
import SingleDart from "./single_dart.js";
import DoubleDart from "./double_dart.js";
import Styleline from "./styleline.js";

export default class ShirtConstructor{
    constructor(measurements, config){
        this.measurements = measurements;
        this.config = config;
    }

    construct(){
        const ShirtType = this.get_shirt_type();
        return new ShirtType(this.measurements, this.config);
    }

    get_shirt_type(){
        const types = {
            "without dart": WithoutDart,
            "single dart":  SingleDart,
            "double dart":  DoubleDart,
            "styleline":    Styleline
        }

        return types[this.config.dartAllocation.type];
    }
}

export const construct_shirt = function(...args){
    const sc = new ShirtConstructor(...args);
    return sc.construct();
}