import ConfigElement from "./_config_element.js";

// Represents a number which can be chosen from a range

export default class CNumber extends ConfigElement {
    constructor(name, settings = null){
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

        this.set_if_unset(settings, "min", 1);
        this.set_if_unset(settings, "max", 1);
        this.set_if_unset(settings, "default", 16);
        this.set_if_unset(settings, "step_size", 0.1);

        this.settings = settings;
        this.set(settings.value);
    }

    set(value){
        this.assert(value instanceof Number, "Value must be a number");
        this.assert(value >= this.settings.min && value <= this.settings.max, "Value not in range");

        this.value = value;
    }
}

ConfigElement.prototype.classDecendents.CNumber = CNumber;