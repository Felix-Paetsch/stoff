import { people_measurements } from '../Data/measurements.js';
import adjusted_measurements from './adjust_measurements.js';

import config_compiler from "./config_compiler.js";

import { Config, cContainer, cBoolean, cNumber, cOption } from "../StoffLib/Config/exports.js";
import { construct_shirt } from './shirt/shirt_constructor.js';

import assert from './core/assert.js';
import Sketch from '../StoffLib/sketch.js';

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
              "without dart",
              "single dart",
              "double dart",
              "styleline",
              "added fullness",
              1
            ),
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
            "cap",
            "ruffles",
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
      
      const s = new Sketch();
      const p = s.add(2,3);
      const q = s.add(5,6);
      s.line_between_points(p,q);
      assert.IS_ISOLATED(p);

      let measurements = adjusted_measurements(people_measurements[fuer], design_config);
      return construct_shirt(measurements, config_compiler(design_config)).render();
    }
}
