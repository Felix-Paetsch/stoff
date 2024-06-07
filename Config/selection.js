import ConfigElement from "./_config_element.js";

// Holds an array of choices from which arbitrarily many can be selected

export default class CSelection extends ConfigElement{
    constructor(name, ...children){
        // You can either put the children as seperate argument to the constructor
        // or give them in one single array. (Composition of the two also works.)

        super(name);
        
        this.children = ConfigElement.as_unfolded_components(children);
        this.activated = [];
    }
}

ConfigElement.classDecendents.CSelection = CSelection;