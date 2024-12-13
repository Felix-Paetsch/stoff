import { people_measurements } from '../Data/measurements.js';
import adjusted_measurements from './adjust_measurements.js';

import create from './create/create_main.js';

import { Config, cContainer, cBoolean, cNumber, cOption } from "../StoffLib/Config/exports.js";


export default {
    design_config: new Config(
        cContainer(
          "Schnittmuster",
          cOption(
            "für",
            ...Object.keys(people_measurements),
            3
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
              "panel",
              1
            ),
            cBoolean("closed", false),
            cOption(
              "dartstyle",
              "normal",
              "tuck",
        //      "gathering",
              0
            ),
            cNumber(
              "length",{
                default: 0.9,
                min: 0,
                max: 1,
                step_size: 0.05
              }
            ),
            cNumber(
              "ease", {
                default: 8,
                min: 0,
                max: 20,
                step_size: 0.25
              }
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
            "casual",
            "puffy",
            "puffy top",
            "puffy bottom",
            "flared",
            "cap",
            "ruffles",
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
      let fuer = design_config.Schnittmuster["für"];
      let measurements = adjusted_measurements(people_measurements[fuer], design_config);

      return create.basic_pattern(measurements, design_config);
    }
}
