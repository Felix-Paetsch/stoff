import ChildrenHaving from "./_chilren_having.js";
import ConfigElement from "./_config_element.js";

// Contains an array of ConfigElements

export default class CContainer extends ChildrenHaving {
    constructor(name, ...children){
        // Call as (name, ...children) or call directly as (...children)
        // You can either put the children as seperate argument to the constructor
        // or give them in one single array. (Composition of the two also works.)

        if (typeof name !== "string"){
            
            children.unshift(name);
            name = null;
        }

        super(name, children);
    }

    serialize(){
        return {
            "name": this.name,
            "type": "CContainer",
            "children": this.serialize_children(),
            id: this.id
        }
    }

    static deserialize(data){
        return new CContainer(
            data["name"],
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