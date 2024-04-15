const { Sketch } = require("../../StoffLib/sketch.js");
const { Point } = require("../../StoffLib/point.js");
const { Vector } = require("../../Geometry/geometry.js");



function evaluate_type(design){
  let options;
  if(design["shoulder"]){
    options.push("shoulder");
  }
  if(design["side"]){
    options.push("side");
  }
  if(design["fold"]){
    options.push("fold");
  }
  if(design["neckline"]){
    options.push("neckline");
  }
  if(design["armpit"]){
    options.push("armpit");
  }
  if(design["waistline"]){
    options.push("waistline");
  }
  if(design["side hidden dart"]){
    options.push("side hidden dart");
  }
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
  let options;
  if(design["shoulder"]){
    options.push("shoulder");
  }
  if(design["armpit"]){
    options.push("armpit");
  }
  if(design["neckline"]){
    options.push("neckline");
  }
  if(design["shoulder back"]){
    options_back.push("shoulder");
  }
  if(design["armpit back"]){
    options_back.push("armpit");
  }
  if(design["neckline back"]){
    options_back.push("neckline");
  }

  return {
    options,
    options_back
  };

}
