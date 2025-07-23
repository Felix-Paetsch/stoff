import { people_measurements } from "../Data/measurements.js";
import adjusted_measurements from "./adjust_measurements.js";

import config_compiler from "./config_compiler.js";

import {
    Config,
    cContainer,
    cBoolean,
    cNumber,
    cOption,
} from "../Core/Config/exports.js";
import {
    main_pattern_construction,
    main_sleeve_construction,
} from "./main_standard_pattern.js";

export default {
    design_config: new Config(
        cContainer(
            "Schnittmuster",
            cOption("für", ...Object.keys(people_measurements), 2)
        ),
        cContainer(
            "top designs",
            cOption(
                "type",
                "without dart",
                "single dart",
                "double dart",
                "multiple darts",
                "styleline",
                //"added fullness",
                1
            ),
            cBoolean("single waistline dart", true),

            cOption(
                "position",
                "waistline",
                "side",
                "french",
                "shoulder",
                "neckline",
                "armpit",
                "waistline and side",
                "waistline and french",
                "waistline and shoulder",
                "waistline and armpit",
                "waistline and neckline",
                "shoulder and side",
                "shoulder and french",
                "shoulder and neckline",
                "shoulder and armpit",
                0
            ),
            cNumber("number of multiple darts", {
                default: 2,
                min: 2,
                max: 3,
                step_size: 1,
            }),
            cOption("styleline", "classic princess", "panel", 1),
            //     cBoolean("closed", false),
            cOption("dartstyle", "normal", "tuck", 0),
            cNumber("length", {
                default: 0.9,
                min: 0,
                max: 1,
                step_size: 0.05,
            }),
            cNumber("ease", {
                default: 8,
                min: 0,
                max: 20,
                step_size: 0.25,
            })
        ),
        cContainer(
            "neckline",
            cOption(
                "type",
                "round",
                "round wide",
                "round deep",
                "V-Line",
                "V-Line deep",
                "V-Line wide",
                "square",
                "boat",
                0
            )
        ),
        cContainer(
            "sleeve",
            cOption(
                "type",
                "straight",
                "slim",
                "extra slim",
                "casual",
                "puffy",
                "puffy top",
                "puffy bottom",
                "flared",
                //        "cap",
                "ruffles",
                "latern",
                0
            ),
            cNumber("length", {
                default: 0.5,
                min: 0,
                max: 1,
                step_size: 0.01,
            })
        )
    ),
    create_design: (design_config) => {
        let fuer = design_config.Schnittmuster["für"];
        let measurements = adjusted_measurements(
            people_measurements[fuer],
            design_config
        );
        // console.log(measurements.waist_width_front)
        // console.log(measurements.waist_width_back)
        let wd = main_pattern_construction(
            measurements,
            config_compiler(design_config)
        );
        return main_sleeve_construction(wd, design_config).sketch; //.paste_sketch(wd.sketch);
        // return wd.sketch
    },
};
