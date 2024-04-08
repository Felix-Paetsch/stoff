import assert from "./.js";
import SComponent from "./component.js";
import SNumber from './number';

export default class SSplit_Percent extends SComponent{
    constructor(name, number_inputs, total = 100){
        super(name, null, number_inputs);
        this.total = total;

        const allowed_component_classes = [SNumber];
        assert(number_inputs.map(
            comp => allowed_component_classes.some(cls => comp instanceof cls)
        ), "All components must be number inputs");
        assert(number_inputs.length > 0, "At least 1 number input");
        assert(
            new Set(number_inputs.map(ni => ni.step_size)).size == 1,
            "Step size for number inputs must be identical"
        );
        assert(
            // Sum of values
            Math.abs(
                number_inputs.map(ni => ni.value).reduce((acc, current) => acc + current, 0)
                - this.total < 0.0001
            ),
            "Values don't sum to total"
        );

        number_inputs.forEach((ni, i) => {
            ni.is_fixed = () => this.fixed_inputs.includes(i);
            ni.set = (value) => this.set_number_input(i, value);
        });
        this.fixed_inputs = [];
    }

    toggle_fix_input(i) {
        const index = this.fixed_inputs.indexOf(i);
        if (index === -1) {
            this.fix_input(i);
        } else {
            this.fixed_inputs.splice(index, 1);
        }
    }
    
    fix_input(i) {
        if (!this.fixed_inputs.includes(i)) {
            this.fixed_inputs.push(i);
        }

        if (this.fixed_inputs.length == this.children.length){
            this.fixed_inputs.shift();
        }
    }
    
    unfix_input(i) {
        const index = this.fixed_inputs.indexOf(i);
        if (index !== -1) {
            this.fixed_inputs.splice(index, 1);
        }
    }

    set(values){
        assert(this.children.length == values.length,
            "Values array should be of same length as number inputs");
        assert(
            Math.abs(
                values.reduce((acc, current) => acc + current, 0)
                - this.total < 0.0001
            ),
            "Values don't sum to total"
        );
        assert(
            values.map((v, i) => {
                return this.children[i].min <= v && v <= this.children[i].max
            }),
            "Values aren't in number input ranges"
        );

        this.values.forEach((v, i) => {
            this.children[i].value = v;
        });
    }

    set_number_input(i, value){
        this.unfix_input(i);
        // TODO
    }
}