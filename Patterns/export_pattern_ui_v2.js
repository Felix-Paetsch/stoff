import SewingSketch from "../Core/PatternLib/sewing_sketch.js";
import { Vector } from "../Core/StoffLib/geometry.js";

import { people_measurements } from "../Data/measurements.js";
import adjusted_measurements from "./adjust_measurements.js";
import {construct_maual} from "./manual_construction.js";

import config_compiler from "./config_compiler.js";
import {
    main_pattern_construction,
    main_sleeve_construction,
} from "./main_standard_pattern_new.js";

import parse_config from "./parse_design_config.js";

export default (design_config) => {
    let fabric = "cotton"; // jersey
    design_config = parse_config(design_config, fabric);

    //let fuer = design_config.Schnittmuster["für"];
    let fuer = "Leonie";

    let measurements = adjusted_measurements(
        people_measurements[fuer],
        design_config
    );
    // console.log(measurements.waist_width_front)
    // console.log(measurements.waist_width_back)
    let wd = main_pattern_construction(measurements, design_config, "back");
    let wd2 = main_pattern_construction(measurements, design_config, "front");
    wd.sketch.data = design_config;
    const wd_sleeve =  main_sleeve_construction(wd, design_config)
    const arr = [wd.sketch, wd2.sketch, wd_sleeve.sketch];
    return construct_maual(arr);

      //  .sketch.paste_sketch(wd.sketch, null, new Vector(-81, -12.5))
      //  .paste_sketch(wd2.sketch);
    //    const s = wd.sketch.paste_sketch(wd2.sketch, null, new Vector(-78,-2));
    //    const s = wd.sketch.paste_sketch(wd2.sketch, null, new Vector(-31, -75));
    //   s.save_on_A4("output")

    return s;
};
