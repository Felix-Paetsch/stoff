import ConfigElement from "./_config_element.js";

// Holds an array of choices from which at most one can be selected

export default class COption extends ConfigElement{
    constructor(name, ...children){
        // You can either put the children as seperate argument to the constructor
        // or give them in one single array. (Composition of the two also works.)

        super(name);
        
        this.children = ConfigElement.as_unfolded_components(children);
        this.selected = 0;
        this.assert(this.children.length > 0, "Option must have at least one child");
    }

    select(i){
        this.selected = Math.max(
            0,
            Math.min(
                i, 
                this.children.length
            )
        );

        return this;
    }
}

ConfigElement.classDecendents.COption = COption;