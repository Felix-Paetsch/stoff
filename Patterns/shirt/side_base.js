import PatternComponent from "../core/pattern_component.js";

export default class DartAllocationSideBase extends PatternComponent{
    constructor(side, parent){
        super(parent);
        this.side = side;
    }

    static from_side_half(side_half){
        const side = new DartAllocationSideBase(side_half.side, side_half.parent);
        side.sketch = side_half.unfolded_sketch();
        side.up_direction = side_half.compute_grainline();
        return side;
    }

    get_seam_allowance_component(){
        return this.get_line("side").connected_component();
    }
}