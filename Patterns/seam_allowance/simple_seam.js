import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { Vector } from '../../StoffLib/geometry.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import { line_with_length, point_at, get_point_on_other_line, get_point_on_other_line2, neckline, back_neckline} from '../funs/basicFun.js';
import evaluate from '../funs/basicEval.js';

import utils from '../funs/utils.js';


function merge_all_lines(s){
/*
Fehler:
- double dart mit waistline - vermutlich im zsh. mit shortening
-> Linienzuordnungsprobleme, wird später durch merge_all_lines gelöst (ggf. mirror Funktion anpassen)
- panel shoulder - keine ahnung
-> Vermutlich so ähnlicher Fehler wie bei dem davor. Erstmal merge_all_lines funktion bauen, dann weiter schauen
- single dart mit shoulder - vielleicht ähnlich zu erstem Fehler
- Fehler beim Bilden vom trim

neue fehler
- styleline - schauen was los ist
- tuck mit doubledart und waistline
- length = 0



*/
  if(s.data.comp){
    delete s.data.comp;
  }
  if(s.data.comp2){
    delete s.data.comp2;
  }

  let lines = s.lines_by_key("type");

  let bottom = lines.bottom;
  let bottom_side = lines.side_bottom[0];
  let side = lines.side;
  let shoulder = lines.shoulder;
  let side_dart = ["french", "side middle", "side middle and shoulder", "waistline and side middle", "waistline and french", "french and shoulder"];
  let trim = lines.trim;
  //s.dev.at_new_url("/bla")

  if (trim){
    trim = merge_pair_of_lines(s, trim, true);
  }

  side = merge_side_lines(s, trim, side);
  bottom = merge_side_lines(s, trim, bottom);
  shoulder = merge_side_lines(s, trim, shoulder);

  if (bottom_side){
    side = s.merge_lines(side, bottom_side);
    side.data.type = "side";
  }
  s.dev.at_new_url("/bla")



  /*
  if(s.data.dart && side_dart.includes(s.data.dart)){

    trim = s.merge_lines(trim, side[0]);
    trim = s.merge_lines(trim, side[1]);
    side = s.merge_lines(trim, bottom_side);
  }

  */
}



function merge_side_lines(s, trim, side){
  let temp;

    if (side.length > 1){
      if (trim[0].common_endpoint(side[0])){
        temp = s.merge_lines(trim[0], side[0], true);
      } else {
        temp = s.merge_lines(trim[1], side[0], true);
      }
      return s.merge_lines(temp, side[1], true);
    }
    return side[0];
}

function merge_pair_of_lines(s, lines, delete_point = false){
  let new_lines = [];

  while(lines.length > 0){
    //console.log(lines[1].data)

    for (let i = lines.length-1; i > 0; i--){
      if (lines[0].common_endpoint(lines[i])){
        lines[0].set_color("red");
        lines[i].set_color("blue")
        new_lines.push(s.merge_lines(lines[0], lines[i], delete_point));
        lines.splice(i, 1);
        lines.shift();
        // remove lines index [i], splice?? slice??
        break;
      }
    }
  }
  return new_lines;
}

function seam_allowance_first(s, width){
  /*
  let lines = s.lines_by_key("type");

  let bottom = lines.bottom[0];
  let sides = lines.side[0];
  let armpits = lines.armpit[0];
  let shoulders = lines.shoulder[0];
  let neckline = lines.neckline[0];

  let ln_side = s.line_with_offset(side, width, s.data.front);
  let ln2 = s.line_with_offset(bottom, width, !s.data.front);
  let ln3 = s.line_with_offset(side, width, !s.data.front);

//  [ln1, ln2] = close_lines(s, ln1.p2, ln2.p2, 2);

  close_lines(s, ln2.p2, ln3.p1, 2);
*/

};


function seam_allowance_neck(s, width){

};


function seam_allowance_bottom(s, width){

};


function close_lines(s, ln1_p, ln2_p, distance){

  ln1_p = lengthen_line(s, ln1_p, distance);
  ln2_p = lengthen_line(s, ln2_p, distance);
  let ln1 = ln1_p.get_adjacent_lines()[0];
  let ln2 = ln2_p.get_adjacent_lines()[0];

  let temp = s.intersection_positions(ln1, ln2)[0];

  /*
  ln1_p.move_to(temp);
  ln2_p.move_to(temp);

  s.merge_points(ln1_p, ln2_p);

  return [ln1, ln2];*/
};

function lengthen_line(s, p, distance){
  let ln = p.get_adjacent_lines()[0];
  let p2_bool = ln.p2 === p;
  let temp;
  temp = s.position_at_length(ln, 0.5, p2_bool);
  temp = temp.subtract(p).scale(-4 * distance).add(p);
  let p2 = s.add_point(temp);

  const ln2 = s.line_between_points(p, p2);
  let line = s.merge_lines(ln, ln2, true);

  return p2;
};


export default {seam_allowance_first, seam_allowance_neck, seam_allowance_bottom, merge_all_lines};
