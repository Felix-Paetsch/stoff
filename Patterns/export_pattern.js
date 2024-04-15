const dummay_pattern = require("./dummy_pattern.js");
const { Sketch } = require("../StoffLib/sketch.js");
const { Vector } = require("../Geometry/geometry.js");

const basic_pattern = require("./basic/basicPattern.js");
const change = require("./change/remodel.js");

// ToDo!!! Wenn ein einfacher Abnaeher einen bestimmten Winkel überschreitet,
// sollte eine Warung ausgegeben werden!


module.exports = {
    design_config: {
      /*  "Example Config": [
            {
                "name": "Interpolation Count",
                "type": Number,
                "min": 2,
                "max": 15,
                "default": 8,
                "step_size": 1
            }
        ],
        "Mesurements [Key1]": [
            {
                "name": "Kopf",
                "type": Boolean,
                "default": true
            },{
                "name": "Kopf2",
                "type": Number,
                "default": 2,
                "min": 0,
                "max": 5,
                "step_size": 0.01
            },{
                "name": "Kopf",
                "type": Boolean,
                "default": true
            },{
                "name": "Kopf2",
                "type": Number,
                "default": 2,
                "min": 0,
                "max": 5,
                "step_size": 0.01
            },{
                "name": "Kopf2",
                "type": Number,
                "default": 2,
                "min": 0,
                "max": 5,
                "step_size": 0.01
            }
        ],
        "Stuff [Key2]": [
            {
                "name": "Kopf",
                "type": Boolean,
                "default": true
            },{
                "name": "Kopf2",
                "type": Number,
                "default": 2,
                "min": 0,
                "max": 5,
                "step_size": 0.01
            }
        ] */
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
            "name": "waist_width_front",
            "type": Number,
            "default": 48,
            "min": 1,
            "max": 100,
            "step_size": 0.1
          },{
            "name": "waist_width_back",
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
          }
        ],
        "designs with merge": [
          {
            "name": "merge",
            "type": Boolean,
            "default": false
          },{
            "name": "split front",
            "type": Boolean,
            "default": true
          },{
            "name": "armpit",
            "type": Boolean,
            "default": false
          },{
            "name": "neckline",
            "type": Boolean,
            "default": false
          },{
            "name": "shoulder",
            "type": Boolean,
            "default": false
          },{
            "name": "percent of line",
            "type": Number,
            "default": 0,
            "min":0,
            "max": 1,
            "step_size": 0.05
          },{
            "name": "split back",
            "type": Boolean,
            "default": true
          },{
            "name": "armpit back",
            "type": Boolean,
            "default": false
          },{
            "name": "neckline back",
            "type": Boolean,
            "default": false
          },{
            "name": "shoulder back",
            "type": Boolean,
            "default": false
          },{
            "name": "percent of line back",
            "type": Number,
            "default": 0,
            "min":0,
            "max": 1,
            "step_size": 0.05
          },{
            "name": "extend shoulder",
            "type": Number,
            "default": 0,
            "min": 0,
            "max": 10,
            "step_size": 0.1
          }
          /*,{
            "name": "times of splitting",
            "type": Number,
            "default": 1,
            "min": 0,
            "max": 5,
            "step_size": 1
          }*/
        ],
          "designs without merge": [{
            "name": "extend shoulder",
            "type": Number,
            "default": 0,
            "min": 0,
            "max": 10,
            "step_size": 0.1
          }/*,{
            "name": "",
            "type": Boolean,
            "default": false
          }
        "test 1" : [{
          "name": "or component",
          "type": OPTION_COMPONENT,
          "options": [
            {
              "name": "wha",
              "type": Number,
              "default": 1,
              "min": 0,
              "max": 5,
              "step_size": 1
            },{
              "name": "wh",
              "type": Boolean,
              "default": true
            }
          ], */
          /*
          merge implies: splitting to side not available
          checkboxen mit wohin man noch splitten kann
          -> shoulder, side, armpit, waist (standard), neckline, fold
          complete split (von wo nach wo?)
          split on the same side more than once
          abkappen vom Abnaeher oder kürzen des Abnähers

          */

        ],
        "front": [
          {
            "name": "side hidden dart",
            "type": Boolean,
            "default": false
          },{
            "name": "waistline",
            "type": Boolean,
            "default": true
          },{
            "name": "side",
            "type": Boolean,
            "default": false
          },{
            "name": "shoulder",
            "type": Boolean,
            "default": false
          },{
            "name": "fold",
            "type": Boolean,
            "default": false
          },{
            "name": "armpit",
            "type": Boolean,
            "default": false
          },{
            "name": "neckline",
            "type": Boolean,
            "default": false
          },{
            "name": "first split percent of line",
            "type": Number,
            "default": 0.5,
            "min": 0,
            "max": 1,
            "step_size": 0.05
          },{
            "name": "split percent of dart",
            "type": Number,
            "default": 0,
            "min": 0,
            "max": 1,
            "step_size": 0.05
          },{
            "name": "second split percent of line",
            "type": Number,
            "default": 0.5,
            "min": 0,
            "max": 1,
            "step_size": 0.05
          },{
            "name": "split dart in multiple smaller ones on the same side",
            "type": Number,
            "default": 1,
            "min": 1,
            "max": 5,
            "step_size": 1
          }
        ],
        "back": [
          {
            "name": "side hidden dart",
            "type": Boolean,
            "default": false
          },{
            "name": "waistline",
            "type": Boolean,
            "default": true
          },{
            "name": "side",
            "type": Boolean,
            "default": false
          },{
            "name": "shoulder",
            "type": Boolean,
            "default": false
          },{
            "name": "fold",
            "type": Boolean,
            "default": false
          },{
            "name": "armpit",
            "type": Boolean,
            "default": false
          },{
            "name": "neckline",
            "type": Boolean,
            "default": false
          },{
            "name": "first split percent of line",
            "type": Number,
            "default": 0.45,
            "min": 0,
            "max": 1,
            "step_size": 0.05
          },{
            "name": "split percent of dart",
            "type": Number,
            "default": 0,
            "min": 0,
            "max": 1,
            "step_size": 0.05
          },{
            "name": "second split percent of line",
            "type": Number,
            "default": 0.5,
            "min": 0,
            "max": 1,
            "step_size": 0.05
          },{
            "name": "split dart in multiple smaller ones on the same side",
            "type": Number,
            "default": 1,
            "min": 1,
            "max": 5,
            "step_size": 1
          }
        ],
        "additional splits":[
          {
            "name": "bla",
            "type": Boolean,
            "default": false
          }
        ]
    },
    create_design: (design_config) => {
      design_config.measurements.bust_width_front += 3;
      design_config.measurements.bust_width_back += 3;
      design_config.measurements.tai_width_front += 3;
      design_config.measurements.tai_width_back += 3;
      design_config.measurements.tai_height = design_config.measurements.tai_height * (2/3) + 4;
      design_config.measurements.across_front = design_config.measurements.across_front * (15/16);
      design_config.measurements.across_back = design_config.measurements.across_back * (15/16);

      design_config.measurements.waist_width_back += 4;
      design_config.measurements.waist_width_front += 4;
    //  design_config["measurements"]
      //console.log(design_config);
        /* Function that takes in design config
           and returns sketch. This should only act as an interface to your real pattern entry point
           i.e. for formatting the design config, renaming parameters, ...
        */


      let back = basic_pattern.back(design_config.measurements);
      let front = basic_pattern.front(design_config.measurements);
      let s = new Sketch();

      s.paste_sketch(back, null, new Vector(0,0));
      s.paste_sketch(front, null, new Vector(55, 0));
      if (design_config["designs with merge"].merge){
        change.remodel_pattern_merge(s, design_config["designs with merge"]);
      } else {
        change.remodel_pattern(s, design_config["designs without merge"], design_config["front"], design_config["back"]);
      }
      //change.remodel_pattern(s, design_config["possible designs"], design_config["front"], design_config["back"]);

      return s;
      //  return dummay_pattern(design_config["Example Config"])
    }
}
