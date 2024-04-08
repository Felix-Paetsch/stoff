import SComponent from "./component.js";

export default class SBoolean extends SComponent{
    constructor(name, default_value = false){
        super(name, default_value);
    }

    toggle(){
        return this.set(!this.value);
    }
}