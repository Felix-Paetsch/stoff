//import dummay_pattern from './dummy_pattern.js';
import { Sketch } from '../StoffLib/sketch.js';
import { Vector } from '../Geometry/geometry.js';

import basic_pattern from './basic/basicPattern.js';
import change from './simple/simple_main.js';
// ToDo!!! Wenn ein einfacher Abnaeher einen bestimmten Winkel überschreitet,
// sollte eine Warung ausgegeben werden!

export default {
    design_config: {
        "measurements": [
          {
            "name": "shoulder_length",
            "type": Number,
            "default": 16,
            "min": 1,
            "max": 50,
            "step_size": 0.1
          },{
            "name": "shoulder_width",
            "type": Number,
            "default": 46,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "shoulder_w_point",
            "type": Number,
            "default": 50,
            "min": 1.1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "bust_width_front",
            "type": Number,
            "default": 50,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "bust_width_back",
            "type": Number,
            "default": 45,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "bust_point_width",
            "type": Number,
            "default": 22,
            "min": 1,
            "max": 50,
            "step_size": 0.1
          },{
            "name": "bust_point_height",
            "type": Number,
            "default": 18,
            "min": 1,
            "max": 50,
            "step_size": 0.1
          },{
            "name": "shoulderblade_width",
            "type": Number,
            "default": 17,
            "min": 1,
            "max": 50,
            "step_size": 0.1
          },{
            "name": "shoulderblade_height",
            "type": Number,
            "default": 20,
            "min": 1,
            "max": 50,
            "step_size": 0.1
          },{
            "name": "tai_width_front",
            "type": Number,
            "default": 40,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "tai_width_back",
            "type": Number,
            "default": 42,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "tai_height",
            "type": Number,
            "default": 26,
            "min": 1,
            "max": 50,
            "step_size": 0.1
          },{
            "name": "waist_width_front",
            "type": Number,
            "default": 40,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "waist_width_back",
            "type": Number,
            "default": 42,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "waist_height",
            "type": Number,
            "default": 26,
            "min": 1,
            "max": 50,
            "step_size": 0.1
          },{
            "name": "shoulder_height_front",
            "type": Number,
            "default": 44,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "shoulder_height_back",
            "type": Number,
            "default": 48.5,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "center_height_front",
            "type": Number,
            "default": 31,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "center_height_back",
            "type": Number,
            "default": 44,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "across_front",
            "type": Number,
            "default": 37,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "across_back",
            "type": Number,
            "default": 36.5,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "side_height",
            "type": Number,
            "default": 22,
            "min": 1,
            "max": 50,
            "step_size": 0.1
          },{
            "name": "bottom_width_front",
            "type": Number,
            "default": 48,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "bottom_width_back",
            "type": Number,
            "default": 53,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "arm",
            "type": Number,
            "default": 35,
            "min": 1,
            "max": 60,
            "step_size": 0.1
          },{
            "name": "arm length",
            "type": Number,
            "default": 61,
            "min": 1,
            "max": 90,
            "step_size": 0.1
          },{
            "name": "wristwidth",
            "type": Number,
            "default": 23.5,
            "min": 1,
            "max": 60,
            "step_size": 0.1
          },{
            "name": "ellbow_width",
            "type": Number,
            "default": 26,
            "min": 1,
            "max": 60,
            "step_size": 0.1
          },{
            "name": "ellbow_length",
            "type": Number,
            "default": 35,
            "min": 1,
            "max": 60,
            "step_size": 0.1
          }
        ],
        "top designs": [
          {
            "name": "without dart",
            "type": Boolean,
            "default": true
          },{
            "name": "split",
            "type": Boolean,
            "default": false
          },{
            "name": "simple dart",
            "type": Boolean,
            "default": false
          },{
            "name": "waistline simple dart",
            "type": Boolean,
            "default": false
          },{
            "name": "wiener naht",
            "type": Boolean,
            "default": false
          }
        ],
        "sleeveheight":[
          {
            "name": "eingehalten 5/6",
            "type": Boolean,
            "default": false
          },{
            "name": "eingehalten 4/5",
            "type": Boolean,
            "default": false
          },{
            "name": "eingehalten 3/4",
            "type": Boolean,
            "default": true
          },{
            "name": "hemd 3/4",
            "type": Boolean,
            "default": false
          },{
            "name": "hemd 2/3",
            "type": Boolean,
            "default": false
          },{
            "name": "hemd 1/2",
            "type": Boolean,
            "default": false
          }
        ],
        "sleevetype":[
          {
            "name": "puffy top",
            "type": Boolean,
            "default": false
          },{
            "name": "puffy bottom",
            "type": Boolean,
            "default": false
          },{
            "name": "puffy",
            "type": Boolean,
            "default": true
          },{
            "name": "shorten",
            "type": Boolean,
            "default": false
          }
        ],
        "temp": [{
          "name": "length",
          "type": Number,
          "default": 3,
          "min": 2.9,
          "max": 4,
          "step_size": 0.01
        }]
    },
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
