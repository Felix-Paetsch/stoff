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
        this._default = _default;
    }

    set(value = true){
        if (this.value == value) return this;

        this.assert(typeof value === "boolean", "value must be a boolean");
        this.value = value;
        this.changed();
        return this;
    }

    toggle(){
        return this.set(!this.value);
    }

    serialize(){
        return {
            "name": this.name.serialize(),
            "type": "CBoolean",
            "default": this.default,
            "value": this.value,
            id: this.id
        }
    }

    static deserialize(data){
        return new CBoolean(
            ConfigElement.deserialize_component(data["name"]),
            data.default
        ).set(data.value).set_id(data.id);
    }

    to_obj(){
        return this.value;
    }

    render(dir, own_path, data = {}){
        return this._dev_render("boolean_component.ejs", dir, own_path, data);
    }

    on_dom_load(own_path){
        const serialized_path = ConfigElement.serialize_path(own_path);
        const dom_el = document.querySelector(`[x-component-path="${ serialized_path }"]`);

        const checkbox = dom_el.querySelector(".boolean_checkbox");
        checkbox.addEventListener("click", () => {
            this.toggle();

            if (this.value){
                checkbox.querySelector(".fa-hexagon").classList.add("hidden");
                checkbox.querySelector(".fa-hexagon-check").classList.remove("hidden");
            } else {
                checkbox.querySelector(".fa-hexagon").classList.remove("hidden");
                checkbox.querySelector(".fa-hexagon-check").classList.add("hidden");
            }

            request_img();
        });
    }
}

ConfigElement.classDecendents.CBoolean = CBoolean;
