import ConfigElement from "./_config_element.js";
import { assert } from "../Debug/validation_utils.js";

// Initial Config object

export default class Config extends ConfigElement{
    constructor(...children){
        super("Config");
        if (children.length == 1 && children[0] instanceof Config){
            this.children = children[0].children;
            return this;
        }

        this.children = ConfigElement.as_unfolded_components(children);
    }

    serialize(){
        return {
            "type": "Config",
            "path": ["BASE"],
            "children": this.children.map((c) => c.serialize())
        }
    }

    static deserialize(data){
        assert(data["type"] === "Config", "Expected type to be Config");
        return new Config(
            data["children"].map(c => ConfigElement.deserialize_component(c))
        );
    }

    to_obj(){
        const res = {};
        this.children.forEach(c => {
            res[c.name] = c.to_obj();
        })
        
        return res;
    }

    /* frontend stuff */
    render(dir){
        return this.children.map((c, i) => c.render(dir, ["BASE", i])).join("\n");
    }

    on_dom_load(){
        this.children.forEach(
            (c, i) => c.on_dom_load(["BASE", i])
        );
    }
}

ConfigElement.classDecendents.Config = Config;