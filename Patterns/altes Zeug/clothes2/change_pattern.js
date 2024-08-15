import { Sketch } from '../StoffLib/sketch.js';
import { Point } from '../StoffLib/point.js';
import { Vector } from '../StoffLib/geometry.js';
import { get_orth_line, get_orth_line_length, line_with_length, point_at, lotpunkt, smooth_out} from './basicFun_new.js';
import change_fun from './simpleFun.js';
import basic_pattern from '../clothes2/basicPattern3.js';



function remodel_pattern_merge(s, design){
    change_fun.merge_sides(s);
    s.data.back.waist_outer.set_endpoints(s.data.front.side.p2, s.data.back.waist_outer.p2);
    s.remove_point(s.data.back.side.p1);
    s.remove_point(s.data.back.side.p2);
    s.data.back.side = s.data.front.side;


  if(design["extend shoulder"]){
    change_fun.extend_shoulder(s.data.front.shoulder, design["extend shoulder"]);
    change_fun.extend_shoulder(s.data.back.shoulder, design["extend shoulder"]);
  }
  change_fun.armpit_new(s, s.data.front);
  change_fun.armpit_new(s, s.data.back, 1);

  s.remove_line(s.data.front.side);

  change_fun.split_whole(s, design);

}


function remodel_pattern(s, design, front, back){




  if(design["extend shoulder"]){
    change_fun.extend_shoulder(s.data.front.shoulder, design["extend shoulder"]);
    change_fun.extend_shoulder(s.data.back.shoulder, design["extend shoulder"]);
  }
  change_fun.armpit_new(s, s.data.front);
  change_fun.armpit_new(s, s.data.back, 1);


  if (front["side hidden dart"]){
   change_fun.split_dart_to_side_new(s, s.data.front, (1 - front["split percent of dart"]));
   if(front["split percent of dart"] == 1){
     s.remove_point(s.data.front.dart_inner.p2);
     s.remove_point(s.data.front.dart_outer.p2);
     s.remove_point(s.data.front.dart_outer.p1);
     s.line_between_points(s.data.front.side.p2, s.data.front.fold.p2);
   }
 }
 if (back["side hidden dart"]){
    change_fun.split_dart_to_side_new(s, s.data.back, (1 - back["split percent of dart"]));
    if(back["split percent of dart"] == 1){
      s.remove_point(s.data.back.dart_inner.p2);
      s.remove_point(s.data.back.dart_outer.p2);
      s.remove_point(s.data.back.dart_outer.p1);
      s.line_between_points(s.data.back.side.p2, s.data.back.fold.p2);
    }
  }

// -----------------

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
    change_fun.rotate_dart(s, s.data.front, front_new, front_new["split percent of dart"], front_new["second split percent of line"]);
  }
}

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
}

}

export default {remodel_pattern, remodel_pattern_merge};