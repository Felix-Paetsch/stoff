import Sketch from "../core/sewing_sketch.js";
import Pattern from "../core/pattern.js";
import ShirtSideHalfBase from "./side_half_base.js";
import lengthen from '../_depricated/lengthen/top.js';

export default function construct_shirt(measurements, design){
    const shirt = new Pattern(measurements, design);
    shirt.sketch = new Sketch();

    const seam_allowances = {
        0.5: ["neckline"],
        1:   ["shoulder", "armpit", "side"],
        2:   ["bottom"]
    };

    ["front", "back"].forEach(side => {
        const side_half = new ShirtSideHalfBase(side, shirt);

        side_half.dart = true;
        
        side_half.shift_dart_basic("side", 0.9);
        side_half.fill_in_darts();
        lengthen.lengthen_top_without_dart_new(
            side_half.get_sketch(),
            measurements,
            design.length
        );

        side_half.mark_symmetry_line();
        side_half.compute_grainline();
        const side_comp = side_half.unfold();
        side_comp.add_seam_allowance(seam_allowances);

        const uf = side_comp.get_sketch();
        uf.anchor();
        shirt.sketch.paste_sketch(uf);
    });
    
          
    shirt.sketch.decompress_components();
    shirt.sketch.remove_anchors();
    
    return shirt.render();
}