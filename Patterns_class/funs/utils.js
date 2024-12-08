
import { Vector, vec_angle, rotation_fun , vec_angle_clockwise} from '../../StoffLib/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import dart from '../darts/simple_dart.js';

function lotpunkt(s, pt, ln){
  //const ln_p = ln.endpoints();
  let direction = 1;
  if(s.data.front){
    direction = -1;
  }

  const a = pt.subtract(ln.p1);
  const c = ln.get_line_vector();

  const alpha = vec_angle(a, c);

  const b_scalar = Math.sin(alpha)*a.length();

  const norm = c.get_orthonormal().mult(b_scalar).scale(direction);

    return s.add_point(pt.subtract(norm));
}
/*
function rotate_zsk(ln, fun){
  let list = list_points_zhk(ln);
  let vec;
  list.forEach((elem) => {
    vec = fun(elem);
    elem.move_to(vec.x, vec.y);
  });
  return ln;
}
*/

function get_nearest_set_of_dart_lines(s, pattern, lines){
  let ln = lines.forEach(elem => {
    elem.data.distance = elem.p2.distance(pattern.pt);
  });
  lines.sort((a, b) => a.data.distance - b.data.distance);

  return [lines[0], lines[1]];
}



// Nimmt ein Array mit Paaren an Linien getrennt von inner und outer,
// welche einen gemeinsamen Punkt haben
// Gibt sortierten Array zurueck, abwechselnd mit outer und inner
function sort_dart_lines(lines){
  let inner = lines.filter(ln => (ln.data.side === "inner"));
  let outer = lines.filter(ln => (ln.data.side === "outer"));
  let arr = [];
  for(let i = 0; i < inner.length; i++){
    for(let j = 0; j < outer.length; j++){
      if (inner[i].common_endpoint(outer[j])){
        arr.push(outer[j]);
        arr.push(inner[i]);
        outer.splice(j, 1);
      }
    }
  }
  return arr;
}

// bewegt den Punkt an die Stelle plus den gegebenen Vector
// zur besseren Übersicht
function correct_point(p, vec){
  p.move_to(vec.add(p));
}


function get_waistline_dart(s){
  let lines = s.lines_by_key("type").dart;
  if (lines.length <= 2){
    return lines;
  }
  lines = sort_dart_lines(lines);
  let adjacent = lines[0].p2.get_adjacent_lines();
  let line = adjacent.filter(elem =>{
    return elem.data.type != "dart";
  })[0];

  if (line.data.type === "waistline"){
    return [lines[0], lines[1]];
  }
  return [lines[2], lines[3]];
}

function rotate_zshk_to_point(comp, pt1, pt2, p){
  const angle = vec_angle_clockwise(pt1.subtract(p), pt2.subtract(p));
  const rotate = rotation_fun(p, angle);
  comp.transform(
    (pt) => pt.move_to(rotate(pt))
  );
};

// Rotiert eine zhk um einen gegeben Punkt um den gegebenen Winkel.
// Punkt muss teil der rotierten zhk sein!
function rotate_zhk(s, angle, p){
  const rotate = rotation_fun(p, -angle);
  const comp = new ConnectedComponent(p);

//  console.log(p.to_array(), rotate(p).to_array());
  comp.transform(
    (pt) => pt.move_to(rotate(pt))
  );
}

// nimmt die gegebenen Linien und tauscht "inner" gegen "outer" aus und umgekehrt
function switch_inner_outer_dart(lines){
  let inner = lines.filter(ln => ln.data.side === "inner");
  let outer = lines.filter(ln => ln.data.side === "outer");
  inner.forEach((ln) => {
    ln.data.side = "outer";
  });
  outer.forEach((ln) => {
    ln.data.side = "inner";
  });
  return lines;
}


// schliesst eine Komponente, indem sie einen von zwei Punkten
// wählt. Entsprechend den, der in der Komponente enthalten ist
function close_component(s, p, pts){
  let comp = new ConnectedComponent(p);
  if (comp.contains(pts[0])){
    return s.line_between_points(p, pts[0]);
  } else {
    return s.line_between_points(p, pts[1]);
  }
};


// spaltet zwei zhk auf zwei verschiedene sketches auf.
// nutzt die bezeichnungen "inner" und "outer" um diese
// zu unterscheiden.
// Zurueck kommt [comp_outer, comp_inner]
function set_comp_to_new_sketches(s){
  const sk = new Sketch();
  sk.paste_sketch(s, null, new Vector(0,0));
  let lines1 = s.lines_by_key("side").inner[0];
  let lines2 = sk.lines_by_key("side").outer[0];
  let comp = new ConnectedComponent(lines1);
  s.delete_component(comp);
  comp = new ConnectedComponent(lines2);
  sk.delete_component(comp);

  return [sk, s];
}

// spiegelt einfach alle Punkte auf dem Sketch
function mirror_sketch(s){
  s.get_points().forEach((pt) => {
    pt.move_to(new Vector(-pt.x, pt.y));
  });
  s.get_lines().forEach((ln) => {
    ln.mirror();
  });
  return s;
}

// spiegelt die Sketch an der faltkante und "klappt sie auf"
function mirror_on_fold(sk){
  const s = new Sketch();
  s.paste_sketch(sk);

  let points = s.get_points();
  points = [...points];
  mirror_sketch(sk);
  s.paste_sketch(sk);

  let folds = s.lines_by_key("type").fold;
  let vec = folds[0].p1.subtract(folds[1].p1);
  points.forEach((pt) => {
    pt.move_to(pt.subtract(vec));
  });

  s.merge_points(folds[0].p1, folds[1].p1);
  s.merge_points(folds[0].p2, folds[1].p2);

  let lines = s.lines_by_key("type");

  let neckline = lines.neckline;
  let bottom = lines.bottom;
  s.merge_lines(neckline[0], neckline[1], true);
  if (bottom.length > 2){
    bottom = get_pair_of_lines(s, bottom);
    if (bottom === []){
      return s;
    }
  }

  s.merge_lines(bottom[0], bottom[1], true);

  return s;
}


function get_pair_of_lines(s, lines){
  while(lines.length){
    let line = lines.splice(0,1);
    for (let i = 0; i < lines.length; i++){

      if(line[0].common_endpoint(lines[i])){
        return [line[0], lines[i]];
      }
      lines[i].set_color("black")
    }
  }
  console.log("Fehler, die gegebenen Linien haben keinen gemeinsamen Endpunkt.");
  return [];
}

// setzt sketch neben bereits vorhandere linien auf gegeben sketch
// Warung: nicht zu sehr ein zweites mal durchdacht
function position_sketch(s_new, s_old){
  let vec = s_new.get_bounding_box().top_right.add(new Vector (3,0));
  s_new.paste_sketch(s_old, null, vec);
}




// Das hier ist noch doof ...
/* function set_comp_to_new_sketch(s, comp){

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
*/



/* function split_at_points(s, p1, line1, p2, line2, type){

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
*/



/* function sort_comp(s){

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
*/

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
    p.move_to(p.add(vec));
  });
};



/*function get_point_on_line_percent(s, ln, percent){
// Siehe: position_at_length

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
*/


/*function rotate_outer_zhk(s, comp, pt1, pt2, p, percent = 1){

  const angle = vec_angle(pt2.subtract(p), pt1.subtract(p));
  //pt1.set_color("blue")
  //console.log(angle)
  const rotate = rotation_fun(p, -angle*percent);
  comp.transform(
    (pt) => pt.move_to(rotate(pt))
  );
}*/


/*function get_comp_to_rotate(pattern){
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

}*/

export default {
  close_component,
  position_sketch,
  get_waistline_dart,
  rotate_zshk_to_point,
  lotpunkt,
  correct_point,
  sort_dart_lines,
  reposition_zhk,
  rotate_zhk,
  sort_lines,
  set_comp_to_new_sketches,
  switch_inner_outer_dart,
  mirror_sketch,
  mirror_on_fold,
   get_nearest_set_of_dart_lines};
