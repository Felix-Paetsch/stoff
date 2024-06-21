
import { Vector, vec_angle_clockwise, rotation_fun } from '../../Geometry/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

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


function reposition_zhk(comp, vec){
  comp.transform((p) => {
    p.move_to(p.add(vec))
  });
};



function rotate_outer_zhk(s, comp, pt1, pt2, p, percent = 1){
  const angle = vec_angle_clockwise(pt2.subtract(p), pt1.subtract(p));
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
  let c1 = get_lines(s.comp, "fold");
  let c2 = get_lines(s.comp2, "fold");
  //console.log(c1, c2)

  if (c1.length > 0){
    if(c2.length > 0){
      let lines = sort_lines(s, [c1[0],c2[0]]);
      if(lines == [c1[0], c2[0]]){
        return [s.comp2, s.comp];
      }
      return [s.comp, s.comp2];
    }
    return [s.comp2, s.comp];
  }
  return [s.comp, s.comp2];

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
  } else {
    sk.delete_component(sk.data.comp);
  }

  return sk;
};


function split_comp_to_new_sketches(s){
  const sk = new Sketch();
  const sk_2 = new Sketch();

}

export default {
  close_component,
  get_comp_to_rotate,
  sort_lines,
  get_lines,
  get_point_on_line_percent, get_nearest_set_of_dart_lines, rotate_outer_zhk, rotate_outer_zhk_new, sort_comp, reposition_zhk, set_comp_to_new_sketch};