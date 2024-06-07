//import dummay_pattern from './dummy_pattern.js';
import { Sketch } from '../StoffLib/sketch.js';
import { Vector } from '../Geometry/geometry.js';

import basic_pattern from './basic/basicPattern.js';
import change from './simple/simple_main.js';
// ToDo!!! Wenn ein einfacher Abnaeher einen bestimmten Winkel überschreitet,
// sollte eine Warung ausgegeben werden!

import { Config, cContainer, cBoolean, cNumber } from "../Config/exports.js";

export default {
    design_config: new Config(
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
        ),
        cContainer(
            "temp",
            cNumber("length", {
                default: 3,
                min: 2.9,
                max: 4,
                step_size: 0.01
            })
        )
    ),
    create_design: (design_config) => {
      /*const sk = new Sketch();
      const pt1 = sk.add_point(new Vector(0, 2));
      const pt2 = sk.add_point(new Vector(2, 0));

      sk.line_with_length(pt1, pt2, design_config.temp.length).mirror();
      return sk;*/


      design_config.measurements.bust_width_front += 3;
      design_config.measurements.bust_width_back += 3;
      design_config.measurements.waist_width_front += 3;
      design_config.measurements.waist_width_back += 3;
      design_config.measurements.waist_height = design_config.measurements.tai_height * (2/3) + 4;
      design_config.measurements.across_front = design_config.measurements.across_front * (15/16);
      design_config.measurements.across_back = design_config.measurements.across_back * (15/16);

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
      s.paste_sketch(front, null, new Vector(30,0));
      s.paste_sketch(back, null, new Vector(0,0));

      return s;
    }
}
