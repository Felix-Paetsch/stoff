import ConfigElement from "./_config_element.js";

// Contains an array of ConfigElements

export default class CContainer extends ConfigElement {
    constructor(name, ...children){
        // Call as (name, ...children) or call directly as (...children)
        // You can either put the children as seperate argument to the constructor
        // or give them in one single array. (Composition of the two also works.)

        if (typeof name === "string"){
            super(name);
        } else {
            super();
            children.unshift(name);
        }
        
        this.children = ConfigElement.as_unfolded_components(children);
    }

    serialize(){
        return {
            "name": this.name,
            "type": "CContainer",
            "children": this.children.map((c) => c.serialize())
        }
    }

    static deserialize(data){
        return new CContainer(
            data["name"],
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