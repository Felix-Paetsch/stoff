import ConfigElement from "./_config_element.js";

// Contains an array of ConfigElements

export default class CContainer extends ConfigElement {
    constructor(name, ...children){
        // Call as (name, ...children) or call directly as (...children)
        // You can either put the children as seperate argument to the constructor
        // or give them in one single array. (Composition of the two also works.)

        if (name instanceof String){
            super(name);
        } else {
            super();
            children.unshift(name);
        }
        
        this.children = this.as_unfolded_components(children);
    }
}

ConfigElement.prototype.classDecendents.CContainer = CContainer;