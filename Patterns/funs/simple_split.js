import { Vector, vec_angle, rotation_fun } from '../../StoffLib/geometry.js';
import { Sketch } from '../../StoffLib/sketch.js';
import { Point } from '../../StoffLib/point.js';
import { ConnectedComponent} from '../../StoffLib/connected_component.js';

import utils from './utils.js';




function split(s, line, pt){
  let darts = s.data.comp.lines_by_key("type").dart;
  darts = utils.sort_lines(s, darts);
  let inner = darts[1];
  let outer = darts[0];

  let line_parts = s.point_on_line(pt, line);
  let pt2 = s.add_point(pt.copy());
  line_parts.line_segments[0].set_endpoints(line_parts.line_segments[0].p1, pt2);

  let p2 = s.add_point(inner.p1.copy());
  inner.set_endpoints(p2, inner.p2);

  let dart1 = utils.close_component(s, inner.p1, [pt, pt2]);
  let dart2 = utils.close_component(s, outer.p1, [pt, pt2]);
  dart1.data.type = "dart";
  dart2.data.type = "dart";
  s.data.comp = new ConnectedComponent(dart1);
  s.data.comp2 = new ConnectedComponent(dart2);

  return vec_angle(outer.p2.subtract(inner.p1), inner.p2.subtract(inner.p1));

};

function split_tip(s, lines){
  let darts = s.data.comp.lines_by_key("type").dart;
  darts = utils.sort_lines(s, darts);
  let inner = darts[1];
  let outer = darts[0];

  let points = lines[0].get_endpoints();
  let pt;
  if (points.includes(lines[1].p1)){
    pt = lines[1].p1;
  } else {
    pt = lines[1].p2;
  }

  //let line_parts = s.point_on_line(pt, line);
  let pt2 = s.add_point(pt.copy());
  lines[0].set_endpoints(lines[0].p1, pt2);

  let p2 = s.add_point(inner.p1.copy());
  inner.set_endpoints(p2, inner.p2);

  let dart1 = utils.close_component(s, inner.p1, [pt, pt2]);
  let dart2 = utils.close_component(s, outer.p1, [pt, pt2]);
  dart1.data.type = "dart";
  dart2.data.type = "dart";
  s.comp = new ConnectedComponent(dart1);
  s.comp2 = new ConnectedComponent(dart2);

  return vec_angle(outer.p2.subtract(inner.p1), inner.p2.subtract(inner.p1));

};


export {split, split_tip};
