
import { Vector, vec_angle, rotation_fun } from '../../StoffLib/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import dart from '../darts/simple_dart.js';

function get_lines(component, type){
  let arr = component.lines(); // Arr of line
  let arr_new = arr.filter(arr_entry => {
    return arr_entry.data.type === type;
  });
  //console.log(arr_new);
  return arr_new;
}



function rotate_zsk(ln, fun){
  let list = list_points_zhk(ln);
  let vec;
  list.forEach((elem) => {
    vec = fun(elem);
    elem.move_to(vec.x, vec.y);
  });
  return ln;
}


function get_nearest_set_of_dart_lines(s, pattern, lines){
  let ln = lines.forEach(elem => {
    elem.data.distance = elem.p2.distance(pattern.pt);
  });
  lines.sort((a, b) => a.data.distance - b.data.distance);

  return [lines[0], lines[1]];
}

function get_point_on_line_percent(s, ln, percent){

  if (percent <= 0.04){
    return ln.p1;
  } else if (percent >= 0.96){
    return ln.p2;
  }
  if (ln.data.curve){
    let vec = ln.p2.subtract(ln.p1);
    let len = vec.length();
    let vec2 = vec.get_orthogonal().scale(ln.data.direction);
    vec = vec.normalize().scale(len * percent).add(ln.p1);
    const p1 = s.add_point(new Point(vec.x, vec.y));
    vec2 = vec2.add(p1);
    const p2 = s.add_point(new Point(vec2.x, vec2.y));
    let l = s.line_between_points(p1, p2);
    let points = s.intersection_positions(l, ln);
    s.remove_point(p1);
    s.remove_point(p2);
    //console.log(points)
    return s.add_point(points[0]);
  } else {
    let vec = ln.get_line_vector().normalize().scale(ln.get_length() * percent).add(ln.p1);
    return s.add_point(new Point(vec.x, vec.y));
  }
};



function sort_lines(s, lines){
  const pt = s.data.pt;

  lines.forEach(elem => {
    elem.data.distance = elem.p2.distance(pt);
  });
  lines.sort((a, b) => a.data.distance - b.data.distance);

  lines.reverse();
  return lines;
}


function get_waistline_dart(s){
  const lines = s.data.comp.lines_by_key("type").dart;
  if (lines.length <= 2){
    return lines;
  }
  let [pair1, pair2] = dart.split_dart(lines);
  let adjacent = pair1[0].p2.get_adjacent_lines();
  let line = adjacent.filter(elem =>{
    return elem.data.type != "dart";
  })[0];

  if (line.data.type === "waistline"){
    return pair1;
  }
  return pair2;
}

function reposition_zhk(comp, vec){
  comp.transform((p) => {
    p.move_to(p.add(vec));
    ////p.set_color("green");
    //  console.log(p)
  });
};



function rotate_outer_zhk(s, comp, pt1, pt2, p, percent = 1){
  const angle = vec_angle(pt2.subtract(p), pt1.subtract(p));
  //pt1.set_color("blue")
  //console.log(angle)
  const rotate = rotation_fun(p, -angle*percent);
  comp.transform(
    (pt) => pt.move_to(rotate(pt))
  );
}

function rotate_outer_zhk_new(s, comp, angle, p, percent = 1){
  //pt1.set_color("blue")
  //console.log(angle)
  const rotate = rotation_fun(p, -angle*percent);
  comp.transform(
    (pt) => pt.move_to(rotate(pt))
  );
}


function get_comp_to_rotate(pattern){
  let lines_comp = s.data.comp.lines_by_key("type");
  let c1 = lines_comp.fold;
  let c2 = lines_comp.fold;
  //console.log(c1, c2)

  if (c1.length > 0){
    if(c2.length > 0){
      let lines = sort_lines(pattern, [c1[0],c2[0]]);
      if(lines == [c1[0], c2[0]]){
        return pattern.comp2;
      }
      return pattern.comp;
    }
    return pattern.comp2;
  }
  return pattern.comp;

}



function sort_comp(s){
  let c1 = get_lines(s.data.comp, "fold");
  let c2 = get_lines(s.data.comp2, "fold");
  //console.log(c1, c2)

  if (c1.length > 0){
    if(c2.length > 0){
      let lines = sort_lines(s, [c1[0],c2[0]]);
      if(lines == [c1[0], c2[0]]){
        return [s.data.comp2, s.data.comp];
      }
      return [s.data.comp, s.data.comp2];
    }
    return [s.data.comp2, s.data.comp];
  }
  return [s.data.comp, s.data.comp2];

}


function close_component(s, p, pts){
  let comp = new ConnectedComponent(p);
  if (comp.contains(pts[0])){
    return s.line_between_points(p, pts[0]);
  } else {
    return s.line_between_points(p, pts[1]);
  }

};

// Das hier ist noch doof ...
function set_comp_to_new_sketch(s, comp){
  const sk = new Sketch();
  sk.paste_sketch(s, null, new Vector(0,0));

  if(s.data.comp === comp){
    sk.delete_component(sk.data.comp2);
    delete sk.data.comp2;

  } else {
    sk.delete_component(sk.data.comp);
    sk.data.comp = sk.data.comp2;
    delete sk.data.comp2;
  }

  return sk;
};

function split_at_points(s, p1, line1, p2, line2, type){
  let parts = s.point_on_line(p1, line1);
  let pt1 = s.add_point(p1.copy());
  parts.line_segments[0].set_endpoints(parts.line_segments[0].p1, pt1);

  parts = s.point_on_line(p2, line2);
  let pt2 = s.add_point(p2.copy());
  parts.line_segments[0].set_endpoints(parts.line_segments[0].p1, pt2);

  let line = close_component(s, p1, [p2, pt2]);
  line.data.type = type;
  line = close_component(s, pt1, [p2, pt2]);
  line.data.type = type;

  s.data.comp = new ConnectedComponent(parts.line_segments[0]);
  s.data.comp2 = new ConnectedComponent(parts.line_segments[1]);

  let comp_sorted = sort_comp(s);

  const pattern_i = set_comp_to_new_sketch(s, comp_sorted[0]);
  const pattern_o = set_comp_to_new_sketch(s, comp_sorted[1]);

  return [pattern_o, pattern_i];

};



function split_comp_to_new_sketches(s){
  const sk = new Sketch();
  const sk_2 = new Sketch();

}

function position_sketch(s_new, s_old){
  let vec = s_new.get_bounding_box().top_right.add(new Vector (3,0));
  s_new.paste_sketch(s_old, null, vec);
}

export default {
  close_component,
  get_comp_to_rotate,
  sort_lines,
  get_lines,
  split_at_points,
  position_sketch,
  get_waistline_dart,
  get_point_on_line_percent, get_nearest_set_of_dart_lines, rotate_outer_zhk, rotate_outer_zhk_new, sort_comp, reposition_zhk, set_comp_to_new_sketch};
