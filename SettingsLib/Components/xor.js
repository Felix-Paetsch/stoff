import SBoolean from "./boolean.js";
import SStatic from "./static.js";
import assert from "./.js";
import SOption from "./option.js";

export default class SXOR extends SBoolean{
    constructor(name, component_option1, component_option2){
        // this.value = false <----> current option is option1
        super(name, false);

        const allowed_component_classes = [SOption, SStatic];
        assert([
            allowed_component_classes.some(cls => component_option1 instanceof cls),
            allowed_component_classes.some(cls => component_option1 instanceof cls)
        ], "XOR Components must be any of: Option | Static");

        this.options = [
            component_option1,
            component_option2
        ];

        this.children = [component_option1]
    }

    set(value){
        this.value = value;
        this.children = [
            this.options[Number(this.value)]
        ];
    }
}