import ConfigElement from "./_config_element.js";

// Initial Config object

export default class Config extends ConfigElement{
    constructor(...children){
        super("Config");
        if (children.length == 1 && children[0] instanceof Config){
            this.children = children[0].children;
            return this;
        }

        this.children = this.as_unfolded_components(children);
    }
}

ConfigElement.prototype.classDecendents.Config = Config;