
const { Vector, vec_angle_clockwise, rotation_fun } = require("../../Geometry/geometry.js");
const { Sketch } = require("../../StoffLib/sketch.js");
const { Point } = require("../../StoffLib/point.js");





function get_lines(component, type){
  let arr = component.lines(); // Arr of line
  arr.filter(arr_entry => {
    return arr_entry.data.type === type;
  });
  return arr;
}




function rotate_zsk(ln, fun){
  let list = list_points_zhk(ln);
  let vec;
  list.forEach((elem) => {
    vec = fun(elem);
    elem.moveTo(vec.x, vec.y);
  });
  return ln;
}




function get_point_on_line_percent(s, pattern, line_type, percent){
  let ln = get_lines(pattern.comp, line_type)[0];
  if (percent <= 0.04){
    return ln.p1;
  } else if (percent >= 0.96){
    return ln.p2;
  }
  if (ln.curve){
    let vec = ln.p2.subtract(ln.p1);
    let len = vec.length();
    let vec2 = vec.get_orthogonal().scale(r);
    vec = vec.normalize().scale(len * percent).add(ln.p1);
    const p1 = s.add_point(new Point(vec.x, vec.y));
    vec2 = vec2.add(p1);
    const p2 = s.add_point(new Point(vec2.x, vec2.y));
    let l = s.line_between_points(p1, p2);
    let points = s.intersection_points(l, ln);
    s.remove_point(p1);
    s.remove_point(p2);
    return s.add_point(points[0]);
  } else {
    let vec = ln.get_line_vector().normalize().scale(ln.get_length() * percent).add(ln.p1);
    return s.add_point(new Point(vec.x, vec.y));
  }
};

function renummerate_lineparts(pattern, type){
  const pt = pattern.pt;
  const lines = get_lines(pattern.comp, type);

  lines.forEach(elem => {
    elem.data.distance = elem.p2.subtract(pt).get_length();
  });
  lines.sort((a, b) => a.data.distance - b.data.distance);

  lines.forEach((elem, i) => {
    elem.part = i + 1;
  });
  return lines;
}

function get_outer_line_of_all(pattern, type){
  const lines = renummerate_lineparts(pattern, type);
  lines.reverse();
  return lines[0];
}

function get_outer_line(pattern, lines){
  const pt = pattern.pt;

  lines.forEach(elem => {
    elem.data.distance = elem.p2.subtract(pt).get_length();
  });
  lines.sort((a, b) => a.data.distance - b.data.distance);

  lines.reverse();
  return lines[0];
}



function reposition_zhk(ln, vec){
  let list = list_points_zhk(ln);
  list.forEach((p) => {
    let pos_v = vec.add(p);
    p.moveTo(pos_v.x, pos_v.y)
  });
};


function list_points_zhk(ln){
  let vorhanden = [ln.p1];
  let suchend = [ln.p2];
  let lines;

  while (suchend.length > 0){
    elem = suchend.pop();
    lines = elem.get_adjacent_lines();
    lines.forEach((ln) => {
      if(!vorhanden.includes(ln.p1)){
        vorhanden.push(ln.p1);
        if(!suchend.includes(ln.p1)){
          suchend.push(ln.p1);
        }
      }
      if(!vorhanden.includes(ln.p2)){
        vorhanden.push(ln.p2);
        if(!suchend.includes(ln.p2)){
          suchend.push(ln.p2);
        }
      }
    });
  }
  return vorhanden;
}
