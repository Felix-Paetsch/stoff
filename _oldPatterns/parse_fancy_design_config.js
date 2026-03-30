


export default function parse_fancy(design_config, new_config){

  switch (design_config.Fancy) {
    case "cape":
      new_config.basic.additional.fancy = "cape";

      new_config.front.dart_waistline = "none";
    //  new_config.front.darts =  [["side", 0.5, 1]];
      new_config.front.base_type = 2;

    //  new_config.back.darts = [["side", 0.5, 1]];
      new_config.back.dart_waistline = "none";
      new_config.back.base_type = 2;

      new_config.sleeve.type = "straight";
      new_config.sleeve.length = 1;
      new_config.sleeve.additional.fancy = "cape";

      new_config.front.neckline = "round"

      break;
    default:

  }

  return new_config;
}
