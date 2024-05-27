const { Vector } = require("../../Geometry/geometry.js");
const { Sketch } = require("../../StoffLib/sketch.js");
const { Point } = require("../../StoffLib/point.js");

const utils = require("./utils.js");
const change_fun = require("./basicChanges.js");
const split_fun = require("./split.js");
//const dart_fun = require("./rotateDart.js");
const lengthen = require("./lengthen.js");

function remodel_pattern_merge(s, design){


  change_fun.merge_sides(s);

  if(design["extend shoulder"]){
    change_fun.extend_shoulder(s.data.front.comp, design["extend shoulder"]);
    change_fun.extend_shoulder(s.data.back.comp, design["extend shoulder"]);
  }
  change_fun.armpit_new(s, s.data.front);
  change_fun.armpit_new(s, s.data.back);

  let side = utils.get_lines(s.data.front.comp, "side");
  s.remove_line(side[0]);

  split_fun.split_merge(s, design);
}


function remodel_pattern(s, design, front, back){

  if(design["extend shoulder"]){
    change_fun.extend_shoulder(s.data.front.comp, design["extend shoulder"]);
    change_fun.extend_shoulder(s.data.back.comp, design["extend shoulder"]);
  }
  change_fun.armpit_new(s, s.data.front);
  change_fun.armpit_new(s, s.data.back);



  if (front["side hidden dart"]){
   dart_fun.split_dart_to_side_new(s, s.data.front, (1 - front["split percent of dart"]));
   if(front["split percent of dart"] == 1){
     let comp = s.data.front.comp;
     let darts = utils.get_lines(comp, "dart");
     let fold = utils.get_lines(comp, "fold");
     let side = utils.get_lines(comp, "side");
     let temp = darts[1].p2;

     s.remove_point(darts[0].p2);
     s.remove_point(darts[1].p1);
     s.remove_point(temp);
     s.line_between_points(side[0].p2, fold[0].p2);
   }
 }
 if (back["side hidden dart"]){
    dart_fun.split_dart_to_side_new(s, s.data.back, (1 - back["split percent of dart"]));
    if(back["split percent of dart"] == 1){
      let comp = s.data.back.comp;
      let darts = utils.get_lines(comp, "dart");
      let fold = utils.get_lines(comp, "fold");
      let side = utils.get_lines(comp, "side");
      let temp = darts[1].p2;

      s.remove_point(darts[0].p2);
      s.remove_point(darts[1].p1);
      s.remove_point(temp);
      s.line_between_points(side[0].p2, fold[0].p2);
    }
  }

// -----------------

  if (!(front["side hidden dart"] && front["split percent of dart"] == 1)){
    split_fun.split_without_merge(s, s.data.front, front);
  }
  if (!(back["side hidden dart"] && back["split percent of dart"] == 1)){
    split_fun.split_without_merge(s, s.data.back, back, -1);
  }

// auswerten, was anliegt an Informationen
// dann split
// dann rotation
// remove von dem urspruenglichen abnaeher auf der waistline
// neuer split, wenn != 1 oder mehr als eines angeklickt ist




//if  mehr als eines angeklickt ist und nicht == 1
// split funktion, rotation
// else  nur eines, keines oder == 1 angeklickt ist
// split funktion, rotation und anschließend wieder verschließen


/*
if (!(front["side hidden dart"] && front["split percent of dart"] == 1)){


  front.inner_point = s.data.front.fold.p2;

  let front_new;

  if (front["waistline"]){
    let tem = front["side"];
    front["waistline"] = false;
    front["side"] = true;
    front_new = change_fun.rotate_dart(s, s.data.front, front, 1, front["first split percent of line"]);
    front_new["waistline"] = true;
    front_new["side"] = tem;
    front_new = change_fun.rotate_dart(s, s.data.front, front_new, 1, front["first split percent of line"]);

  } else {
    if (front["split percent of dart"] == 1){
      front_new = change_fun.rotate_dart(s, s.data.front, front, 1, front["first split percent of line"], 1, true);
    } else {
      front_new = change_fun.rotate_dart(s, s.data.front, front, 1, front["first split percent of line"]);
    }
  }

  if (front["split percent of dart"] > 0 && !front["side hidden dart"]){
    split_fun.rotate_dart(s, s.data.front, front_new, front_new["split percent of dart"], front_new["second split percent of line"]);
  }
}
*/
/*
  // -----------------
  if (!(back["side hidden dart"] && back["split percent of dart"] == 1)){

    back.inner_point = s.data.back.fold.p2;

    let back_new;



    if (back["waistline"]){
      let tem = back["side"];
      back["waistline"] = false;
      back["side"] = true;
      back_new = change_fun.rotate_dart(s, s.data.back, back, 1, back["first split percent of line"], -1);
      back_new["waistline"] = true;
      back_new["side"] = tem;
      back_new = change_fun.rotate_dart(s, s.data.back, back_new, 1, back["first split percent of line"], -1);

    } else {
      if (back["split percent of dart"] == 1){
        back_new = change_fun.rotate_dart(s, s.data.back, back, 1, back["first split percent of line"], -1, true);
      } else {
        back_new = change_fun.rotate_dart(s, s.data.back, back, 1, back["first split percent of line"], -1);
      }
    }

    if (back["split percent of dart"] > 0 && !back["side hidden dart"]){
      change_fun.rotate_dart(s, s.data.back, back_new, back_new["split percent of dart"], back_new["second split percent of line"], -1);
    }
}*/

}


function additional_settings(s, design, mea){

  lengthen.length_bottom(s, s.data.front, design, mea["tai_height"], mea["waist_width_front"]);
  lengthen.length_bottom(s, s.data.back, design, mea["tai_height"], mea["waist_width_back"]);

  if (design["length till bottom"] == 1){
    lengthen.length_dress(s, s.data.front, design);
    lengthen.length_dress(s, s.data.back, design);
  }
}
module.exports = {remodel_pattern_merge, remodel_pattern, additional_settings};
