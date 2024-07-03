//import dummay_pattern from './dummy_pattern.js';
import { Sketch } from '../StoffLib/sketch.js';
import { Vector } from '../Geometry/geometry.js';

import mea from './measurements.js';
import basic_pattern_top from './top/pattern_top.js';
import basic_pattern_sleeve from './sleeves/pattern_sleeve.js';
import change from './simple_main.js';
// ToDo!!! Wenn ein einfacher Abnaeher einen bestimmten Winkel überschreitet,
// sollte eine Warung ausgegeben werden!

import { Config, cContainer, cBoolean, cNumber, cSelection, cOption, cStatic } from "../Config/exports.js";

export default {
    design_config: new Config(
        cContainer(
            "Test Container",
            cSelection(
                "Test Selection",
                cStatic("Display Name", "Non Display Value"),
                "Value B",
                "Value C",
                [0, 1] // activated by default
            ),
            cOption(
                "Test Option",
                "Value A",
                "Value B",
                "Value C",
                1 // activated by default
            ),
            cNumber("length", {
                default: 3,
                min: 2.9,
                max: 4,
                step_size: 0.01
            })
        ),
        /*
        cContainer(
            "measurements",
            cNumber("shoulder_length", {
                default: 16,
                min: 1,
                max: 50,
                step_size: 0.1
            }),
            cNumber("shoulder_width", {
                default: 46,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("shoulder_w_point", {
                default: 50,
                min: 1.1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("bust_width_front", {
                default: 50,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("bust_width_back", {
                default: 45,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("bust_point_width", {
                default: 22,
                min: 1,
                max: 50,
                step_size: 0.1
            }),
            cNumber("bust_point_height", {
                default: 18,
                min: 1,
                max: 50,
                step_size: 0.1
            }),
            cNumber("shoulderblade_width", {
                default: 17,
                min: 1,
                max: 50,
                step_size: 0.1
            }),
            cNumber("shoulderblade_height", {
                default: 20,
                min: 1,
                max: 50,
                step_size: 0.1
            }),
            cNumber("tai_width_front", {
                default: 40,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("tai_width_back", {
                default: 42,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("tai_height", {
                default: 26,
                min: 1,
                max: 50,
                step_size: 0.1
            }),
            cNumber("waist_width_front", {
                default: 40,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("waist_width_back", {
                default: 42,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("waist_height", {
                default: 26,
                min: 1,
                max: 50,
                step_size: 0.1
            }),
            cNumber("shoulder_height_front", {
                default: 44,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("shoulder_height_back", {
                default: 48.5,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("center_height_front", {
                default: 31,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("center_height_back", {
                default: 44,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("across_front", {
                default: 37,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("across_back", {
                default: 36.5,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("side_height", {
                default: 22,
                min: 1,
                max: 50,
                step_size: 0.1
            }),
            cNumber("bottom_width_front", {
                default: 48,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("bottom_width_back", {
                default: 53,
                min: 1,
                max: 100,
                step_size: 0.1
            }),
            cNumber("arm", {
                default: 35,
                min: 1,
                max: 60,
                step_size: 0.1
            }),
            cNumber("arm length", {
                default: 61,
                min: 1,
                max: 90,
                step_size: 0.1
            }),
            cNumber("wristwidth", {
                default: 23.5,
                min: 1,
                max: 60,
                step_size: 0.1
            }),
            cNumber("ellbow_width", {
                default: 26,
                min: 1,
                max: 60,
                step_size: 0.1
            }),
            cNumber("ellbow_length", {
                default: 35,
                min: 1,
                max: 60,
                step_size: 0.1
            })
        ),
        */
        cContainer(
          "Schnittmuster",
          cOption(
            "für",
            "Felix",
            "Debby",
            1
          )
        ),
        cContainer(
          "top designs",
            cOption(
              "darts",
              "without dart",
              "split",
              "simple dart",
              "waistline simple dart",
              "wiener naht",
              0
            ),
            cBoolean("lengthen", true)
        ),
        cContainer(
          "sleeve",
          cOption(
            "sleeveheight",
            "eingehalten 5/6",
            "eingehalten 4/5",
            "eingehalten 3/4",
            "hemd 3/4",
            "hemd 2/3",
            "hemd 1/2",
            2
          ),
          cOption(
            "type",
            "puffy top",
            "puffy bottom",
            "puffy",
            "straight",
            2
          ),
          cSelection(
            "attributes",
            "shorten",
            [0]
          )
        )
    ),
    create_design: (design_config) => {
/*
        console.log(design_config["Test Container"]);

        const sk = new Sketch();
        const pt1 = sk.add_point(new Vector(0, 2));
        const pt2 = sk.add_point(new Vector(2, 0));

        const line = sk.line_with_length(pt1, pt2, design_config["Test Container"].length).mirror();
        line.data.name = "Horny..";
        pt1.data.descr = "Currently the data attribute is shown - and for lines additionally the length. If you want a more refined selection or have other ideas, tell me and we can figure things out.";
        return sk;
        */

        let temp = design_config.Schnittmuster["für"];
        let measurements;
        if ( temp === "Debby"){
          measurements = { ...mea.debby };
        } else {
          measurements = { ...mea.felix  };
        }

        measurements.bust_width_front += 3;
        measurements.bust_width_back += 3;
        measurements.waist_width_front += 3;
        measurements.waist_width_back += 3;
        measurements.waist_height = measurements.waist_height * (2 / 3) + 4;

        measurements.across_front = measurements.across_front * (15 / 16);
        measurements.across_back = measurements.across_back * (15 / 16);

        measurements.bottom_width_back += 4;
        measurements.bottom_width_front += 4;

        measurements["arm"] += 2;
        measurements["arm length"] += 4;
        measurements.wristwidth += 2;
        measurements["ellbow_width"] += 4;


        let back = basic_pattern_top.back(measurements);
        let front = basic_pattern_top.front(measurements);


        change.main_top(front, design_config["top designs"], measurements);
        change.main_top(back, design_config["top designs"], measurements);

        front.remove_point(front.data.pt);
        back.remove_point(back.data.pt);
        front.data.pt = false;
        back.data.pt = false;


        let height_sleeve = back.data.height_sleeve + front.data.height_sleeve;
        let sleeve = basic_pattern_sleeve.sleeve(measurements, height_sleeve, design_config["sleeve"].sleeveheight, front.data.length_sleeve, back.data.length_sleeve);
        change.main_sleeve(sleeve, design_config["sleeve"]);



        let s = new Sketch();

        s.paste_sketch(sleeve, null, new Vector(80, 0));
        s.paste_sketch(front, null, new Vector(30, 0));
        s.paste_sketch(back, null, new Vector(0, 0));

        return s;
    }
}
