import { debug, add_point, remove_point, line_between_points, interpolate_lines, Point, save, remove_line, clear, merge_lines } from '../StoffLib/main.js';
import { Vector } from '../Geometry/geometry.js';
import { get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, armpit, round_neckline, smooth_out} from '../clothes/basicFun_new.js';
import { rotate_dart, tai_sho_dart, cut_line, rotate_point, scale_line, rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart, side_to_top} from '../clothes/darts.js';


function cut_back(back, ct){
  tip = back.dart[0].p1;
  temp = point_at(back.tai, ct.part_back_dart);
  p = temp.point;
  p2 = add_point(new Point(p.x, p.y));
  temp.l2_segment.set_endpoints(p2, temp.l2_segment.p2);
  l1 = line_between_points(p, tip);
  l2 = line_between_points(p2, tip);

  l3 = merge_lines(back.dart[0], l1);
  l4 = merge_lines(back.dart[1], l2);

  remove_point(tip);

  l4.p1.moveTo(l4.p1.x + 5, l4.p1.y);
  l4.p2.moveTo(l4.p2.x + 5, l4.p2.y);
  back.shoulder[1].p2.moveTo(back.shoulder[1].p2.x + 5, back.shoulder[1].p2.y);
  back.side.p1.moveTo(back.side.p1.x + 5, back.side.p1.y);
  back.side.p2.moveTo(back.side.p2.x + 5, back.side.p2.y);

  return {
    side: {
      side: back.side,
      armpit: back.armpit,
      tai: temp.l2_segment,
      middle: l4,
      shoulder: back.shoulder[1]
    },
    mid: {
      side: l3,
      middle: back.height,
      shoulder: back.shoulder[0],
      tai: temp.l1_segment,
      neck: back.neck
    }
  }

}

function cut_front(front, ct){
  //side_to_top(front);
  temp = point_at(front.shoulder, ct.back_sho_1_percent);
  p = temp.point;
  p2 = add_point(new Point(p.x, p.y));

  temp.l1_segment.set_endpoints(temp.l1_segment.p1, p2);

  temp2 = point_at(front.tai, ct.part_front_dart);

  p3 = temp2.point;
  p4 = add_point(new Point(p3.x, p3.y));

  temp2.l1_segment.set_endpoints(temp2.l1_segment.p1, p4);

  l1 = line_between_points(p, p3);
  l2 = line_between_points(p2, p4);

  const side = {
    side: 0,
    armpit: front.armpit,
    tai: temp2.l2_segment,
    middle: l1,
    shoulder: temp.l2_segment
  };

  side_to_top(side, front.dart);




  return {
    side,
    mid: {
      side: l2,
      middle: front.height,
      shoulder: temp.l1_segment,
      tai: temp2.l1_segment,
      neck: front.neck
    }
  }

}


function connect_sides(back, front){
  p = back.armpit.p2;
  p2 = front.armpit.p2;
  vec = p.subtract(p2);


  l = line_between_points(back.tai.p1, front.tai.p1);


  vec_h = front.shoulder.p2.add(vec);
  front.shoulder.p2.moveTo(vec_h.x, vec_h.y);

  vec_h = front.shoulder.p1.add(vec);
  front.shoulder.p1.moveTo(vec_h.x, vec_h.y);

  p_h = front.armpit.p2;
  front.armpit.set_endpoints(front.armpit.p1, back.armpit.p2);

  vec_h = front.tai.p1.add(vec);
  vec_h.set(vec_h.x, front.tai.p1.y);
  front.tai.p1.moveTo(vec_h.x, vec_h.y);

  remove_point(back.tai.p2);
  remove_point(front.tai.p2);
  remove_point(p_h);

  return {
    armpit_back: back.armpit,
    armpit_front: front.armpit,
    back_shoulder: back.shoulder,
    front_shoulder: front.shoulder,
    back_side: back.middle,
    front_side: front.middle,
    tai: l
  }

}


export default {cut_back, cut_front, connect_sides};