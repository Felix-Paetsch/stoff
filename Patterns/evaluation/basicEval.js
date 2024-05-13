const { Sketch } = require("../../StoffLib/sketch.js");
const { Point } = require("../../StoffLib/point.js");
const { Vector } = require("../../Geometry/geometry.js");



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

module.exports = {evaluate_type_merge, evaluate_type, evaluate_percent};
