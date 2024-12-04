import ChildrenHaving from "./_chilren_having.js";
import ConfigElement from "./_config_element.js";

// Contains an array of ConfigElements

export default class CContainer extends ChildrenHaving {
    constructor(name, ...children){
        super(name, children);
    }

    serialize(){
        return {
            "name": this.name.serialize(),
            "type": "CContainer",
            "children": this.serialize_children(),
            id: this.id
        }
    }

    static deserialize(data){
        return new CContainer(
            ConfigElement.deserialize_component(data["name"]),
            ChildrenHaving.deserialize_children(data["children"])
        ).set_id(data.id);
    }

    /* frontend stuff  */

    render(dir, own_path){
        return this._dev_render("design_config_component.ejs", dir, own_path);
    }

    on_dom_load(own_path){
        this.children.forEach(
            (c, i) => c.on_dom_load([...own_path, i])
        );
    }
}

ConfigElement.classDecendents.CContainer = CContainer;
