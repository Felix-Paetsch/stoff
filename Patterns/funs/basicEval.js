import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector } from '../../Geometry/geometry.js';

function evaluate_type(design){
  let options = [];
  if(design["side"]){
    options.push("side");
  }
  if(design["shoulder"]){
    options.push("shoulder");
  }
  if(design["fold"]){
    options.push("fold");
  }
  if(design["armpit"]){
    options.push("armpit");
  }
  if(design["neckline"]){
    options.push("neckline");
  }
  if(design["waistline"]){
    options.push("waistline");
  }
/*  if(design["side hidden dart"]){
    options.push("side hidden dart");
  }*/
  return options;
}


function evaluate_percent(design){
  return {
    first: design["first split percent of line"],
    second: design["second split percent of line"],
    percent: design["split percent of dart"]
  };
}

function evaluate_type_merge(design){
  let options = [];
  let options_back = [];
  if(design["armpit"]){
    options.push("armpit");
  }
  if(design["neckline"]){
    options.push("neckline");
  }
  if(design["shoulder"]){
    options.push("shoulder");
  }
  if(design["armpit back"]){
    options_back.push("armpit");
  }
  if(design["neckline back"]){
    options_back.push("neckline");
  }
  if(design["shoulder back"]){
    options_back.push("shoulder");
  }

  return {
    options,
    options_back
  };

}

function eval_sleeve(type){
  if (type === "eingehalten 5/6"){
    return 5/6;
  } else if (type === "eingehalten 4/5"){
    return 4/5;
  } else if (type === "eingehalten 3/4"){
    return 3/4;
  } else if (type === "hemd 3/4"){
    return 3/4;
  } else if (type === "hemd 2/3"){
    return 2/3;
  } else if (type === "hemd 1/2"){
    return 1/2;
  }
}

function eval_sleeve_eingehalten(type){
  if (type === "eingehalten 5/6" || type === "eingehalten 4/5" || type === "eingehalten 3/4"){
    return true;
  }
  return false;
}

export default {evaluate_type_merge, evaluate_type, evaluate_percent, eval_sleeve, eval_sleeve_eingehalten};
