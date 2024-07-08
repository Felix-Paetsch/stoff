//const dummay_pattern = require("./dummy_pattern.js");
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
          "Schnittmuster",
          cOption(
            "für",
            "Felix",
            "Debby",
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
      measurements.wristwidth += 3;
      measurements["ellbow_width"] += 4;

      let back = basic_pattern_top.back(measurements);
      let front = basic_pattern_top.front(measurements);


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
      if (design_config["top designs"].type === "styleline"){
        height_sleeve = back[0].data.height_sleeve + front[0].data.height_sleeve;
        sleeve = basic_pattern_sleeve.sleeve(measurements, height_sleeve, design_config["sleeve"].sleeveheight, front[0].data.length_sleeve, back[0].data.length_sleeve);
      } else {
        height_sleeve = back.data.height_sleeve + front.data.height_sleeve;
        sleeve = basic_pattern_sleeve.sleeve(measurements, height_sleeve, design_config["sleeve"].sleeveheight, front.data.length_sleeve, back.data.length_sleeve);
      }

      sleeve = change.main_sleeve(sleeve, design_config["sleeve"], measurements);
      /*
      */

      let s = new Sketch();
      let sketches = change.main_merge(front, back, design_config["top designs"]);
      sketches.push(sleeve);

      s = change.paste_sketches(s, sketches);

      return s;
    }
}
