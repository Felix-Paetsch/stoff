//const dummay_pattern = require("./dummy_pattern.js");
import { Sketch } from '../StoffLib/sketch.js';
import { Vector } from '../StoffLib/geometry.js';

import mea from './measurements.js';
import basic_pattern_top from './top/pattern_top.js';
import pattern_top_new from './top/pattern_top_new.js';
import basic_pattern_sleeve from './sleeves/pattern_sleeve.js';
import change from './simple_main.js';
import lengthen from './lengthen/top.js';
// ToDo!!! Wenn ein einfacher Abnaeher einen bestimmten Winkel überschreitet,
// sollte eine Warung ausgegeben werden!

import { Config, cContainer, cBoolean, cNumber, cSelection, cOption, cStatic } from "../StoffLib/Config/exports.js";


export default {
    design_config: new Config(

        cContainer(
          "Schnittmuster",
          cOption(
            "für",
            "Felix",
            "Debby",
            "Leonie",
            "Isa",
            0
          )
        ),
        cContainer(
          "top designs",
            cOption(
              "type",
              "without change",
              "without dart",
              "single dart",
              "double dart",
              "styleline",
              "added fullness",
              1
            ),
            /*
            cSelection(
              "position",
              "waistline",
              "side middle",
              "french",
              "shoulder middle",
              //"shoulder tip",
              "side", // wird ohne Abnäher an die Seite gebracht, nur für double dart
              [0]
            ),
            */
            cOption(
              "position",
              "waistline",
              "side middle",
              "french",
              "shoulder",
              "waistline and side middle",
              "waistline and french",
              "waistline and shoulder",
              "side middle and shoulder",
              "french and shoulder",
              0
            ),
            cOption(
              "styleline",
              "classic princess",
              "panel side",
              "panel shoulder",
              1
            ),
            cBoolean("closed", false),
            cOption(
              "dartstyle",
              "normal",
              "tuck",
        //      "gathering",
              0
            )
        ),
        cContainer(
          "neckline",
          cOption(
            "type",
            "round",
            "round wide",
            "V-Line",
            "V-Line deep",
            "V-Line wide",
            "square",
            "boat",
            //"straps",
            0
          )
        ),
        cContainer(
          "sleeve",
          /*
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
          */
          cOption(
            "type",
            "straight",
            "slim",
            "extra slim",
            "puffy",
            "puffy top",
            "puffy bottom",
            "flared",
            "cap",
            "ruffles",
            "casual",
            /*
            "kimono short straight",
            "kimono short curve",
            "sleeveless snug",
            "sleeveless loose",
            "sleeveless american",
            // vorerst abgewählt, da kein Ärmel, sondern das Vorder- und Rückenteil
            // verändert wird.
            */
            0
          ),
          cNumber(
            "length",{
              default: 0.5,
              min: 0,
              max: 1,
              step_size: 0.01
            }
          )
        )
    ),
    create_design: (design_config) => {
      let temp = design_config.Schnittmuster["für"];
      let measurements;
      if ( temp === "Debby"){
        console.log("Debby");
        measurements = { ...mea.debby };
      } else if (temp === "Felix"){
        console.log("Felix");
        measurements = { ...mea.felix  };
      } else if (temp === "Leonie") {
        console.log("Leonie");
        measurements = { ...mea.leonie};
        measurements = mea.calculate_measurements(measurements);
    //    console.log(measurements)
      } else {
        console.log("Isa");
        measurements = { ...mea.isa};
        //console.log(measurements)
        measurements = mea.calculate_measurements(measurements);
    //    console.log(measurements)
      }
/*
      measurements.bust_width_front += 6;
      measurements.bust_width_back += 6;
      measurements.waist_width_front += 5;
      measurements.waist_width_back += 5;
      measurements.waist_height = measurements.waist_height * (2 / 3) + 4;

      measurements.across_front = measurements.across_front * (15 / 16);
      measurements.across_back = measurements.across_back * (15 / 16);

      measurements.bottom_width_back += 4;
      measurements.bottom_width_front += 4;

      measurements["center_height_front"] += 3;
      //measurements["center_height_back"] += 3;
      measurements["shoulder_height_back"] -= 1;
      */

      measurements["arm"] += 2;
      measurements["arm length"] += 4;
      measurements.wristwidth += 3;
      measurements["ellbow_width"] += 4;

  //    return pattern_top_new.back(measurements);

      let back = pattern_top_new.back(measurements);
      let front = pattern_top_new.front(measurements);


      front = change.main_top(front, design_config["top designs"], measurements, design_config["neckline"]);
      back = change.main_top(back, design_config["top designs"], measurements, design_config["neckline"]);
      /*

      front.remove_point(front.data.pt);
      back.remove_point(back.data.pt);
      front.data.pt = false;
      back.data.pt = false;

      */
      let height_sleeve;
      let sleeve;
      /*
      if (design_config["top designs"].type === "styleline"){
        height_sleeve = back[0].data.height_sleeve + front[0].data.height_sleeve;
        sleeve = basic_pattern_sleeve.sleeve(measurements, height_sleeve, design_config["sleeve"].sleeveheight, front[0].data.length_sleeve, back[0].data.length_sleeve);
      } else {
        height_sleeve = back.data.height_sleeve + front.data.height_sleeve;
        sleeve = basic_pattern_sleeve.sleeve(measurements, height_sleeve, design_config["sleeve"].sleeveheight, front.data.length_sleeve, back.data.length_sleeve);
      }

      sleeve = change.main_sleeve(sleeve, design_config["sleeve"], measurements);
      */

      let s = new Sketch();
      let sketches = change.main_merge(front, back, design_config["top designs"]);
    //  sketches.push(sleeve);

      if(design_config["top designs"].type === "styleline"){
        lengthen.lengthen_styleline(sketches, design_config["top designs"].closed);
      }

      s = change.paste_sketches(s, sketches);
      //s.save_on_A4("renders");
      return s;
    }
}
