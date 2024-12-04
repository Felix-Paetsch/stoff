import ConfigElement from "./_config_element.js";
import ChildrenHaving from "./_chilren_having.js";
import { assert } from "../../Debug/validation_utils.js";

// Initial Config object

export default class Config extends ChildrenHaving{
    constructor(...children){
        if (children.length == 1 && children[0] instanceof Config){
            return children[0];
        }

        super("Config", children);
        this.init();
    }

    init(){
        this.children.forEach(c => c.init(this));
    }

    serialize(){
        return {
            "type": "Config",
            "children": this.children.map((c) => c.serialize()),
            id: this.id
        }
    }

    static deserialize(data){
        assert(data["type"] === "Config", "Expected type to be Config");
        return new Config(
            data["children"].map(c => ConfigElement.deserialize_component(c))
        ).set_id(data.id);
    }

    /* frontend stuff */
    render(dir){
        return this._dev_render("config.ejs", dir, ["BASE"]);
    }

    on_dom_load(){
        this.children.forEach(
            (c, i) => c.on_dom_load(["BASE", i])
        );
    }
}

ConfigElement.classDecendents.Config = Config;