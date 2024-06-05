import ConfigElement from "./_config_element.js";

// Represents a number which can be chosen from a range

export default class CBoolean extends ConfigElement {
    constructor(name, _default = false){
        // Settings may contain the following:
        /*
            {
                "min": 1,
                "max": 50,
                "default": 16,
                "step_size": 0.1
            }
        */

        super(name);

        this.value = _default;
        this.default = _default;
    }

    set(value = true){
        this.assert(value instanceof Boolean, "value must be a boolean");
        this.value = value;
    }
}

ConfigElement.prototype.classDecendents.CBoolean = CBoolean;