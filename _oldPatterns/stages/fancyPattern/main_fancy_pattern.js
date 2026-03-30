
import CapeStage from "./cape.js"


export function fancy_main_pattern_construction(shirt){

  shirt.add_stage(CapeStage);

  shirt.construct_cape();

  return shirt.finish();
}


export function fancy_main_sleeve_pattern_construction(sleeve){
  sleeve.add_stage(CapeStage);
  sleeve.construct_cape_sleeve();
  return sleeve.finish();
}
