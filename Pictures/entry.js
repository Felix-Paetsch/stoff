import pictures from '../Pictures/main_pictures.js';
import { Config, cContainer, cBoolean, cNumber, cSelection, cOption, cStatic } from "../StoffLib/Config/exports.js";



export default {
  design_config: new Config(
      cContainer(
        "top designs",
          cOption(
            "type",
            cStatic("Ohne Abnäher", "without dart"),
            cStatic("Ein Abnäher","single dart"),
            cStatic("Zwei Abnäher","double dart"),
            cStatic("Princess und Wiener Naht","styleline"),
            cStatic("A-Linie","added fullness"),
            1
          ),

          cOption(
            cStatic("Abnäher Position","position"),
            cStatic("Taille","waistline"),
            cStatic("Seite","side middle"),
            cStatic("Französisch (Seite Richtung Taille)","french"),
            cStatic("Schulter","shoulder"), // single dart hat nur eines
            cStatic("Taille und Seite","waistline and side middle"), // double dart hat kombinationen aus zweien
            cStatic("Taille und Französisch","waistline and french"),
            cStatic("Talle und Schulter","waistline and shoulder"),
            cStatic("Seite und Schulter","side middle and shoulder"),
            cStatic("Französisch und Schulter","french and shoulder"),
            0
          ),
          cOption( // unterkategorie von type, styleline
            "styleline",
            cStatic("Princess Naht","classic princess"),
            cStatic("Wiener Naht mit Seiten Abnäher","panel side"),
            cStatic("Wiener Naht mit Schulterabnäher","panel shoulder"),
            cStatic("Wiener Naht","panel"),
            3
          ),
          cOption(
            cStatic("Abnähertyp","dartstyle"),
            cStatic("Standard","normal"),
            cStatic("Falte","tuck"),
            0
          ),
          cNumber(
            cStatic("T-Shirt Länge","length"),{
              default: 0.9,
              min: 0,
              max: 1,
              step_size: 0.05
            }
          ),
          cNumber(
            cStatic("zusätzlicher Spielraum (0 ist liegt am Körper an. Normal ist ab 8)","ease"), {
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
          cStatic("Halsausschnitt","type"),
          cStatic("Rund","round"),
          cStatic("Rund und Weit","round wide"),
          cStatic("V-Ausschnitt","V-Line"),
          cStatic("Tiefes V", "V-Line deep"),
          cStatic("Weites V", "V-Line wide"),
          cStatic("Eckig", "square"),
          cStatic("U-Boot", "boat"),
          0
        )
      ),
      cContainer(
        "sleeve",
        cOption(
          cStatic("Ärmelform","type"),
          cStatic("Gerade","straight"),
          cStatic("Schmal","slim"),
          cStatic("Extra Schmal","extra slim"),
          cStatic("Hemdsärmel (niedrigere Armkugel und breiterer Ärmel)","casual"),
          0
        ),
        cNumber(
          cStatic("Ärmellänge","length"),{
            default: 0.5,
            min: 0,
            max: 1,
            step_size: 0.05
          }
        )
      )
  ),
  create_design: (design_config) => {
    let pic = pictures.main(design_config);

    return pic;
  }
};
