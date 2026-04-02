
import parse_fancy from "./parse_fancy_design_config.js"




export default function parse_config(design_config, fabric){
  let new_config = {
    basic: {
      width: {
        bust: 2,
        waistline: 2,
        bottom: 5
      },
      ease: 0, // sollte bald abgeschafft werden
      lenght: 0.8,
      one_waistline_dart: true,
      fabric: fabric,
      additional: {}
    },
    sleeve: {
      type: "0_standard_kurz",
      length: 0.5,
      shoulder_length: 0.7,
      additional: {}
    },
    front: {
      dart_type: "normal",
      dart_waistline: "both", // "inner", "outer", "none"
      neckline: "v_line",
      darts: [],
      dart_number_split: [],
      base_type: 1,
      fabric_adjustment_needed: false,
      additional: {}
    },
    back: {
      dart_type: "normal",
      dart_waistline: "both", // "inner", "outer", "none"
      neckline: "v_line",
      darts: [],
      dart_number_split: [],
      base_type: 1,
      fabric_adjustment_needed: false,
      additional: {}
    }
  };

  if(fabric == "jersey"){

    switch (design_config["Main_Body"]) {
      case "oversize":
      new_config.basic.width.bust = 6;
      new_config.basic.width.waistline = 10;
      new_config.basic.width.bottom = 15;
      new_config.basic.length = 1;
      break;
      case "standard":
      new_config.basic.width.bust = 5;
      new_config.basic.width.waistline = 8;
      new_config.basic.width.bottom = 8;
      new_config.basic.length = 0.8;
      break;
      case "fitted":
      new_config.basic.width.bust = 4;
      new_config.basic.width.waistline = 4;
      new_config.basic.width.bottom = 4;
      new_config.basic.length = 0.8;
      break;

      default:

    }
  } else if (fabric == "cotton"){
    switch (design_config["Main_Body"]) {
      case "oversize":
        new_config.basic.width.bust = 15;
        new_config.basic.width.waistline = 15;
        new_config.basic.width.bottom = 20;
        new_config.basic.length = 1;
        break;
      case "standard":
        new_config.basic.width.bust = 10;
        new_config.basic.width.waistline = 10;
        new_config.basic.width.bottom = 13;
        new_config.basic.length = 0.8;
        break;
      case "fitted":
        new_config.basic.width.bust = 5;
        new_config.basic.width.waistline = 8;
        new_config.basic.width.bottom = 8;
        new_config.basic.length = 0.8;
        break;

      default:
    }
  }


  if(design_config["Fancy"] != "0_none"){
    parse_fancy(design_config, new_config);
    return new_config;
  }

  switch (design_config["Darts fitted"]) {
    case "0_nothing":
      new_config.front.dart_waistline = "none";
      new_config.front.base_type = 2;
      break;
    case "double_shoulder_dart":
      new_config.front.dart_waistline = "none";
      new_config.front.darts = [["shoulder", 0.7, 0.6], ["shoulder", 0.3, 0.4]];
      break;
    case "double_waistline_dart":
      new_config.basic.one_waistline_dart = false;
      new_config.front.dart_waistline = "both";
      new_config.front.base_type = 2;
      new_config.front.fabric_adjustment_needed = true;
      break;
    case "french":
      new_config.front.dart_waistline = "none";
      new_config.front.darts = [["side", 0.9, 1]];
      break;
    case "one_waistline_cut_outer":
      new_config.front.dart_number_split = [1];
      new_config.basic.one_waistline_dart = false;
      new_config.front.dart_waistline = "outer";
      break;
    case "one_waistline_cut":
      new_config.front.dart_number_split = [1];
      new_config.front.dart_waistline = "inner";
      break;
    case "side_dart":
      new_config.front.dart_waistline = "none";
      new_config.front.darts =  [["side", 0.3, 1]];
      break;
    case "single_shoulder_dart":
      new_config.front.darts = [["shoulder", 0.7, 1]];
      new_config.front.dart_waistline = "none";
      break;
    case "single_waistline_dart":
  //    new_config.basic.one_waistline_dart = false;
      new_config.front.dart_waistline = "inner";
      new_config.front.base_type = 2;
      new_config.front.fabric_adjustment_needed = true;
      break;
    case "triple_shoulder_dart":
      new_config.front.darts = [["shoulder", 0.7, 0.4], ["shoulder", 0.4, 0.3], ["shoulder", 0.2, 0.3]];
      new_config.front.dart_waistline = "none";
      break;
    case "shoulder_dart_one_waistline_dart":
    //  new_config.front.dart_waistline = "inner";
      new_config.front.darts = [["shoulder", 0.7, 1]];
      new_config.front.fabric_adjustment_needed = true;
      new_config.front.additional.top_dart_manipulation = true
      new_config.front.additional.waistline_dart_manipulation = true
      break;

    default:

  }


  switch (design_config["Darts standard"]) {
    case "0_nothing":
      new_config.back.dart_waistline = "none";
      new_config.back.base_type = 2;
      break;
    case "double_shoulder_dart":
      new_config.back.dart_waistline = "none";
      new_config.back.darts = [["shoulder", 0.7, 0.6], ["shoulder", 0.3, 0.4]];
      break;
    case "double_waistline_dart":
      new_config.basic.one_waistline_dart = false;
      new_config.back.dart_waistline = "both";
      new_config.back.base_type = 2;
      new_config.back.fabric_adjustment_needed = true;
      break;
    case "french":
      new_config.back.dart_waistline = "none";
      new_config.back.darts = [["side", 0.9, 1]];
      break;
    case "one_waistline_cut_outer":
      new_config.back.dart_number_split = [1];
      new_config.basic.one_waistline_dart = false;
      new_config.back.dart_waistline = "outer";
      break;
    case "one_waistline_cut":
      new_config.back.dart_number_split = [1];
      new_config.back.dart_waistline = "inner";
      break;
    case "side_dart":
      new_config.back.dart_waistline = "none";
      new_config.back.darts =  [["side", 0.3, 1]];
      break;
    case "single_shoulder_dart":
      new_config.back.darts = [["shoulder", 0.7, 1]];
      new_config.back.dart_waistline = "none";
      break;
    case "single_waistline_dart":
      //new_config.basic.one_waistline_dart = false;
      new_config.back.dart_waistline = "inner";
      new_config.back.base_type = 2;
      new_config.back.fabric_adjustment_needed = true;
      break;
    case "triple_shoulder_dart":
      new_config.back.darts = [["shoulder", 0.7, 0.4], ["shoulder", 0.4, 0.3], ["shoulder", 0.2, 0.3]];
      new_config.back.dart_waistline = "none";
      break;
    case "shoulder_dart_one_waistline_dart":
      //  new_config.front.dart_waistline = "inner";
      new_config.back.darts = [["shoulder", 0.7, 1]];
      new_config.back.fabric_adjustment_needed = true;
      break;

    default:

  }



  new_config.front.neckline = design_config["Neckline"];

  switch (design_config["Sleeves"]) {
    case "0_standard_kurz":
      new_config.sleeve.type = "straight";
      new_config.sleeve.length = 0.3;
  //    new_config.sleeve.shoulder_length = 1;
      break;
    case "0_standard_lang":
      new_config.sleeve.type = "straight";
      new_config.sleeve.length = 1;
  //    new_config.sleeve.shoulder_length = 1;
      break;
    case "flared":
      new_config.sleeve.type = design_config["Sleeves"];
      new_config.sleeve.length = 1;
      new_config.sleeve.additional.flare_distance = 3;
  //    new_config.sleeve.shoulder_length = 1;
      break;
    case "latern":
      new_config.sleeve.type = design_config["Sleeves"];
      new_config.sleeve.length = 1;
  //    new_config.sleeve.shoulder_length = 1;
      new_config.sleeve.additional.cut_length = 0.7
      break;
    case "puffy_both":
      new_config.sleeve.type = design_config["Sleeves"];
      new_config.sleeve.length = 1;
  //    new_config.sleeve.shoulder_length = 1;
      break;
    case "puffy_bottom":
      new_config.sleeve.type = design_config["Sleeves"];
      new_config.sleeve.length = 1;
  //    new_config.sleeve.shoulder_length = 1;
      break;
    case "puffy_top":
      new_config.sleeve.type = design_config["Sleeves"];
      new_config.sleeve.length = 1;
  //    new_config.sleeve.shoulder_length = 1;
      break;
    case "ruffles":
      new_config.sleeve.type = design_config["Sleeves"];
      new_config.sleeve.length = 5;
  //    new_config.sleeve.shoulder_length = 1;
      break;

    default:

  }
  return new_config;
}
