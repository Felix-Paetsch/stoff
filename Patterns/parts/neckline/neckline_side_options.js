/*
    This file is on the border of needing a refactor. 
    Since it is very isolated this is currently fine.
*/


import { spline } from "../../../Core/StoffLib/curves.js";

function slim_neckline(neckline, distance){
    let shoulder = neckline.get_line("shoulder");
    let vec = shoulder.get_line_vector();
    let percent = 1 - distance/shoulder.get_length();

    shoulder.p2.move_to(vec.scale(percent).add(shoulder.p1));
};

function new_curve_v_line(neckline){
    let line = neckline.get_line("neckline");
    const pt1 = line.p1;
    const pt2 = line.p2;
    let vec = pt2.subtract(pt1).scale(0.5);
    let vec2 = vec.get_orthonormal();
    vec2 = vec.add(vec2.scale(-1));
    let l = neckline.get_sketch().line_from_function_graph(pt1, pt2, spline.bezier([
        pt1, vec2.add(pt1), pt2
    ]));

    l.data.type = "neckline";
    neckline.get_sketch().remove_line(line);
}

function v_line(neckline, design){
    let shoulder = neckline.get_line("shoulder");
    let fold = neckline.get_line("fold");
    let percent_s;
    let percent_f;
    let vec;

    if (design === "deep"){
      if (neckline.side == "front"){
        percent_s = 1 - 1/shoulder.get_length();
        percent_f = 1 - 12/fold.get_length();
        vec = fold.get_line_vector();
        fold.p1.move_to(vec.scale(-percent_f).add(fold.p2));
      } else {
        percent_s = 1 - 1/shoulder.get_length();
      }

      vec = shoulder.get_line_vector();
      shoulder.p1.move_to(vec.scale(-percent_s).add(shoulder.p2));
    } else if (design === "wide"){
      if (neckline.side == "front"){
        percent_s = 0.6;
        percent_f = 1 - 7/fold.get_length();
      } else {
        percent_s = 0.6;
        percent_f = 1 - 1/fold.get_length();
      }

      let vec = shoulder.get_line_vector();
      shoulder.p1.move_to(vec.scale(-percent_s).add(shoulder.p2));

      vec = fold.get_line_vector();
      fold.p1.move_to(vec.scale(-percent_f).add(fold.p2));
    }

    new_curve_v_line(neckline);
}

function round_wide(neckline){
    let shoulder = neckline.get_line("shoulder");
    let fold = neckline.get_line("fold");
    let percent_s;
    let percent_f;
    let vec;
    if (neckline.side == "front"){
      percent_s = 0.6;
      percent_f = 1 - 7/fold.get_length();
    } else {
      percent_s = 0.6;
      percent_f = 1 - 1/fold.get_length();
    }

    vec = shoulder.get_line_vector();
    shoulder.p1.move_to(vec.scale(-percent_s).add(shoulder.p2));

    vec = fold.get_line_vector();
    fold.p1.move_to(vec.scale(-percent_f).add(fold.p2));
};

function square(neckline){
    let shoulder = neckline.get_line("shoulder");
    let fold = neckline.get_line("fold");
    let _neckline = neckline.get_line("neckline");
    let percent_s;
    let percent_f;
    let vec;
    if (neckline.side == "front"){
      percent_s = 0.6;
      percent_f = 1 - 4/fold.get_length();
    } else {
      percent_s = 0.6;
      percent_f = 1 - 1.5/fold.get_length();
    }

    vec = shoulder.get_line_vector();
    shoulder.p1.move_to(vec.scale(-percent_s).add(shoulder.p2));

    vec = fold.get_line_vector();
    fold.p1.move_to(vec.scale(-percent_f).add(fold.p2));

    const s = neckline.get_sketch();
    let p = s.point(_neckline.p1.x, _neckline.p2.y);
    let ln1 = s.line_between_points(_neckline.p1, p);
    let ln2 = s.line_between_points(p, _neckline.p2);
    ln1.data.type = "neckline";
    ln2.data.type = "neckline";
    let percent;
    if(s.data.is_front){
      percent = 1 - 2.5/ln2.get_length();
    } else {
      percent = 1 - 1.5/ln2.get_length();
    }
    vec = ln2.get_line_vector().scale(-percent);
    p.move_to(vec.add(_neckline.p2));

    s.merge_lines(ln1, ln2, true);
    s.remove_line(_neckline);
}

function square_shoulder_dart(neckline){
    let shoulder = neckline.get_line("shoulder");
    let fold = neckline.get_line("fold");
    let _neckline = neckline.get_line("neckline");
    const s = neckline.get_sketch();

    let percent;
    let vec;

    if (s.data.is_front){
      percent = 1 - 4/fold.get_length();
    } else {
      percent = 1 - 1.5/fold.get_length();
    }
    vec = fold.get_line_vector();
    fold.p1.move_to(vec.scale(-percent).add(fold.p2));

    let len = fold.p1.y - shoulder.p2.y;
    let adjacent = shoulder.p2.get_adjacent_lines();
    let line = adjacent.filter(elem =>{
      return elem.data.type != "shoulder";
    })[0];
    percent = len / line.get_length();
    vec = line.get_line_vector().scale(-percent).add(line.p2);
    line.p2.move_to(vec);

    line = s.line_between_points(line.p2, _neckline.p2);
    line.data.type = "neckline";
    s.remove_point(neckline.p1);
}

function boat(neckline){
    let shoulder = neckline.get_line("shoulder");
    let fold = neckline.get_line("fold");
    let _neckline = neckline.get_line("neckline");
    const s = neckline.get_sketch();

    let percent_s;
    let percent_f;
    let vec;
    if (s.data.is_front){
      percent_s = 0.4;
      percent_f = 1 + 3.5/fold.get_length();
    } else {
      percent_s = 0.4;
      percent_f = 1 - 1.5/fold.get_length();
    }

    vec = shoulder.get_line_vector();
    shoulder.p1.move_to(vec.scale(-percent_s).add(shoulder.p2));

    vec = fold.get_line_vector();
    fold.p1.move_to(vec.scale(-percent_f).add(fold.p2));

    let p = s.point(_neckline.p1.x, _neckline.p2.y);
    let p2 = s.point(_neckline.p1.x, _neckline.p2.y);
    vec = p.subtract(_neckline.p1).scale(0.7);
    p.move_to(vec.add(_neckline.p1));
    vec = p2.subtract(_neckline.p2).scale(0.5).add(p2.subtract(p).scale(-0.1));
    p2.move_to(vec.add(_neckline.p2));
    let l = s.line_from_function_graph(_neckline.p1, _neckline.p2, spline.bezier(
        [_neckline.p1, p, p2, _neckline.p2]
    ));
    l.data.type = "neckline";
    s.remove(p2,p, _neckline);
    return s;
};

export default {slim_neckline, v_line, round_wide, square, boat, square_shoulder_dart};
