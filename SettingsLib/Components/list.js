import assert from "./.js";
import SStatic from "./static.js";
import SComponent from "./component.js";
import SOption from "./option.js";

export default class SList extends SComponent{
    constructor(name, options, default_selection = []){
        // default_selection -> list of integers, 0 is first option
        super(name, default_selection);

        const allowed_component_classes = [SStatic, SOption];
        assert(options.map(
            comp => allowed_component_classes.some(cls => comp instanceof cls)
        ), "List Options must be of type: Static | Option");

        this.options = options;
        this.children = this.options.filter((_, i) => {
            this.value.includes(i);
        });
    }

    set(selection){
        this.value = selection;
        this.children = this.options.filter((_, i) => {
            this.value.includes(i);
        });
        return this.value;
    }

    toggle_option(i) {
        const index = this.value.indexOf(i);
        if (index === -1) {
            this.value.push(i);
        } else {
            this.value.splice(index, 1);
        }
    }
    
    add_option(i) {
        if (!this.value.includes(i)) {
            this.value.push(i);
        }
    }
    
    remove_option(i) {
        const index = this.value.indexOf(i);
        if (index !== -1) {
            this.value.splice(index, 1);
        }
    }
}