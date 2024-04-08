import SList from "./list.js";
import assert from "./.js";

export default class SRadio extends SList{
    constructor(name, options, default_option = 0){
        assert(options.length > 0, "Radio Element must have at least 1 option!");
        super(name, options, [default_option]);

        this.valid_con(() => this.value.length == 1);
    }

    activate_option(i){
        this.set([i]);
        return i;
    }

    toggle_option(i) {
        return this.activate_option(i);
    }
    
    add_option(i) {
        return this.activate_option(i);
    }
    
    remove_option(i) {
        // Either Way shouldn't change smth
    }
}