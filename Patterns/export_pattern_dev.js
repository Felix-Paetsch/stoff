//import dummay_pattern from './dummy_pattern.js';
import { Sketch } from '../StoffLib/sketch.js';
import { Vector } from '../Geometry/geometry.js';
import { arc, spline } from "../StoffLib/curves.js";

import mea from './measurements.js';
import basic_pattern_top from './top/pattern_top.js';
import basic_pattern_sleeve from './sleeves/pattern_sleeve.js';
import change from './simple_main.js';
// ToDo!!! Wenn ein einfacher Abnaeher einen bestimmten Winkel überschreitet,
// sollte eine Warung ausgegeben werden!

import { Config, cContainer, cBoolean, cNumber, cSelection, cOption, cStatic, cCondition } from "../Config/exports.js";

export default {
    design_config: new Config(
        cBoolean("Test Bool", false).set_id("test_bool"),
        cCondition(["test_bool"], (test_bool) => test_bool,
            cStatic("Hellllloooo")
        )
    ),
    create_design: (design_config) => {
        console.log(design_config);
        const s = new Sketch();
        return s;
    }
}
