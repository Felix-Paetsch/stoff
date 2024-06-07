import ConfigElement from "./_config_element.js";

// Represents a static thing, i.e. an option or a title

export default class CStatic extends ConfigElement {
    constructor(name, value = null){
        super(name);
        this.value = value === null ? name : value;
    }

    render(dir, own_path){
        return this._dev_render("static_component.ejs", dir, own_path);
    }
}

ConfigElement.classDecendents.CStatic = CStatic;