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

        ConfigElement.set_if_unset(settings, "min", 0);
        ConfigElement.set_if_unset(settings, "max", 10);
        ConfigElement.set_if_unset(settings, "default", 5);
        ConfigElement.set_if_unset(settings, "step_size", 0.1);

        this.settings = settings;
        this.set(settings.default);
    }

    set(value){
        if (value == this.value) return this;
        this.assert(typeof value === "number", "Value must be a number");
        this.assert(value >= this.settings.min && value <= this.settings.max, "Value not in range");

        this.value = value;
        this.changed();
        return this;
    }

    serialize(){
        return {
            "name": this.name.serialize(),
            "type": "CNumber",
            "settings": this.settings,
            "value": this.value,
            id: this.id
        }
    }

    static deserialize(data){
        return new CNumber(
            ConfigElement.deserialize_component(data["name"]),
            data["settings"]
        ).set(data["value"]).set_id(data.id);
    }

    to_obj(){
        return this.value;
    }

    /* FontEnd stuff  */
    render(dir, own_path, data = {}){
        return this._dev_render("number_component.ejs", dir, own_path, data);
    }

    on_dom_load(own_path){
        const serialized_path = ConfigElement.serialize_path(own_path);
        const dom_el = document.querySelector(`[x-component-path="${ serialized_path }"]`);

        const input = dom_el.querySelector('input[type="range"]');
        input.value = input.getAttribute('x-default');

        input.addEventListener("input", () => {
            dom_el.querySelector(".numper_input_value").textContent = input.value;
            this.set(+input.value);
            request_img();
        });
    }
}

ConfigElement.classDecendents.CNumber = CNumber;
