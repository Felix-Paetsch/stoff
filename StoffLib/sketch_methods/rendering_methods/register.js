
import { create_svg_from_sketch, save_as_svg } from './to_svg.js';
import { create_dev_svg_from_sketch } from "./to_dev_svg.js";
import { create_png_from_sketch, save_as_png } from './to_png.js';

import { toA4printable } from './to_A4_pages.js';
import path from 'path';

export default (Sketch) => {
    Sketch.prototype.to_svg = function(...args) {
        return create_svg_from_sketch(this, ...args)
    }
    
    Sketch.prototype.to_dev_svg = function(...args) {
        return create_dev_svg_from_sketch(this, ...args)
    }
    
    Sketch.prototype.save_as_svg = function(...args) {
        return save_as_svg(this, ...args)
    }
    
    Sketch.prototype.to_png = function(...args) {
        return create_png_from_sketch(this, ...args)
    }
    
    Sketch.prototype.save_as_png = function(...args) {
        return save_as_png(this, ...args)
    }
    
    Sketch.prototype.save_on_A4 = function(folder){
        toA4printable(this, folder);
        save_as_png(
            this,
            path.join(folder, "img.png"),
            CONF.PRINTABLE_WIDTH_CM * CONF.PX_PER_CM,
            CONF.PRINTABLE_HEIGHT_CM * CONF.PX_PER_CM,
        );
    }
}