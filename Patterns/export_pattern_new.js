//import dummay_pattern from './dummy_pattern.js';
import { Sketch } from '../StoffLib/sketch.js';
import { Vector } from '../Geometry/geometry.js';
import { arc, spline } from "../StoffLib/curves.js";

import basic_pattern from './basic/basicPattern.js';
import change from './simple/simple_main.js';
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
        cContainer(
            "top designs",
            cBoolean("without dart", true),
            cBoolean("split", false),
            cBoolean("simple dart", false),
            cBoolean("waistline simple dart", false),
            cBoolean("wiener naht", false)
        ),
        cContainer(
            "sleeveheight",
            cBoolean("eingehalten 5/6", false),
            cBoolean("eingehalten 4/5", false),
            cBoolean("eingehalten 3/4", true),
            cBoolean("hemd 3/4", false),
            cBoolean("hemd 2/3", false),
            cBoolean("hemd 1/2", false)
        ),
        cContainer(
            "sleevetype",
            cBoolean("puffy top", false),
            cBoolean("puffy bottom", false),
            cBoolean("puffy", true),
            cBoolean("shorten", false)
        )
    ),
    create_design: (design_config) => {
        const test_sk = new Sketch();
        const pt00 = test_sk.point(0, 0);
        const pt10 = test_sk.point(1, 0);
        const pt20 = test_sk.point(2, 0);
        const pt30 = test_sk.point(3, 0);

        
        const pt01 = test_sk.point(0, 1);
        const pt12 = test_sk.point(1, 2);
        const pt23 = test_sk.point(3, 3);
        const pt31 = test_sk.point(3, 1);

        
        test_sk.plot(pt00, pt31, spline.catmull_rom_spline(
            [pt00, pt01, pt12, pt31]
        ).plot_control_points(test_sk));

        return test_sk;

        design_config.measurements.bust_width_front += 3;
        design_config.measurements.bust_width_back += 3;
        design_config.measurements.waist_width_front += 3;
        design_config.measurements.waist_width_back += 3;
        design_config.measurements.waist_height = design_config.measurements.tai_height * (2 / 3) + 4;
        design_config.measurements.across_front = design_config.measurements.across_front * (15 / 16);
        design_config.measurements.across_back = design_config.measurements.across_back * (15 / 16);

        design_config.measurements.bottom_width_back += 4;
        design_config.measurements.bottom_width_front += 4;

        design_config.measurements["arm"] += 2;
        design_config.measurements["arm length"] += 4;
        design_config.measurements.wristwidth += 2;
        design_config.measurements["ellbow_width"] += 4;


        let back = basic_pattern.back(design_config.measurements);
        let front = basic_pattern.front(design_config.measurements);


        change.main_top(front, design_config["top designs"]);
        change.main_top(back, design_config["top designs"]);

        front.remove_point(front.data.pt);
        back.remove_point(back.data.pt);
        front.data.pt = false;
        back.data.pt = false;


        let height_sleeve = back.data.height_sleeve + front.data.height_sleeve;
        let sleeve = basic_pattern.sleeve(design_config.measurements, height_sleeve, design_config["sleeveheight"], front.data.length_sleeve, back.data.length_sleeve);
        change.main_sleeve(sleeve, design_config["sleevetype"]);



        let s = new Sketch();

        s.paste_sketch(sleeve, null, new Vector(80, 0));
        s.paste_sketch(front, null, new Vector(30, 0));
        s.paste_sketch(back, null, new Vector(0, 0));

        return s;
    }
}
