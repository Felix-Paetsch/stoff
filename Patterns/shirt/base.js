import Pattern from "../core/pattern.js";
import Sketch from "../core/sewing_sketch.js";

export default class ShirtBase extends Pattern{
    constructor(measurements, config){
        super(measurements, config);
        this.sketch = new Sketch();
        
        // Config
        this.seam_allowances = {
            0.5: ["neckline"],
            1:   ["shoulder", "armpit", "side"],
            2:   ["bottom"]
        };
    }

    build_from_side_half_component(SideHalfComponent){
        const front = new SideHalfComponent("front", this);
        const back = new SideHalfComponent("back", this);

        this.add_component("front", front.unfold());
        this.add_component("back",  back.unfold());

        this.get_component("front").add_seam_allowance(this.seam_allowances);
        this.get_component("back").add_seam_allowance(this.seam_allowances);

        this.components.forEach((component) => {
            const uf = component.get_sketch();
            uf.anchor();
            this.sketch.paste_sketch(uf);
        });
          
        this.sketch.decompress_components();
        this.sketch.remove_anchors();
    }
}