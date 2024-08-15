import { debug, add_point, remove_point, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_line, intersection_points , merge_lines} from '../StoffLib/main.js';
import { Vector } from '../StoffLib/geometry.js';
import { get_orth_line, get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, armpit, round_neckline, smooth_out} from './basicFun_new.js';
import { dart_new, rotate_dart, tai_sho_dart, cut_line, rotate_point, scale_line, rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart} from './darts.js';




function back(mea, ct, x, y){
  //start
  const start = add_point(new Point(x,y));
  let lines_height = line_with_length(start, mea.height, 0);

  //Taille

  const line_tai = line_with_length(lines_height.get_endpoints()[1], ((mea.tai + ct.freedom)/4), -90);
  const ps_bottom = line_tai.get_endpoints();
  let line_shoulder = shoulder(start, mea.shoulder_l, mea.height, 1);
  mea.back_point = genereate_bust_point(mea, ct, lines_height, line_shoulder, line_tai, -1, true);
  // new Lines of height and bust line
  let temp = point_at(lines_height, 0.5);
  lines_height = [temp.l1_segment, temp.l2_segment];
  const line_bust = line_with_length(temp.point, ((mea.bust + ct.freedom)/4), -90);


  // closing line
  const line_side = side(line_bust.get_endpoints()[1], line_tai.get_endpoints()[1], lines_height[1]);


  const line_armpit = armpit(line_bust, line_shoulder, -3, 1);
  mea.arm_back = line_armpit.get_length();

  temp = round_neckline(ct, "back", lines_height[0], line_shoulder, 1);
  line_shoulder = temp.shoulder;
  const line_neck = temp.neckline;
  mea.back_ausschnitt = 15;//line_neck.get_length();

  let dart = 0;
// abnaeher oben in der Schulter
  const lot_vec = lotpunkt(lines_height[1], mea.back_point, 1).subtract(mea.back_point).normalize().scale(mea.bust_point_distance/2).add(mea.back_point);
  const lot = add_point(new Point(lot_vec.x, lot_vec.y));
  abnaeher_temp = (mea.shoulder_b - mea.shoulder_l) + 4;
  if (abnaeher_temp > 0){
    dart = tai_sho_dart(mea.back_point, lot, line_shoulder, 105, abnaeher_temp);
    line_shoulder = dart.l_segments;
    mea.back_shoulder = line_shoulder[0].get_length() + line_shoulder[1].get_length();
    ct.back_sho_1_percent = line_shoulder[0].get_length() / mea.back_shoulder;
  } else {
    mea.back_shoulder = line_shoulder.get_length();
    ct.back_sho_1_percent = 1;
  }
  remove_point(lot);
  remove_point(mea.back_point);

  mea.rueck_armk_hoehe = armk_hoehe(line_armpit.p1, line_bust, 1);

  mea.back_side = line_side.get_length();

  lines_height = merge_lines(lines_height[0], lines_height[1]);
  remove_point(line_bust.p1);

  return {
    tai: line_tai,
    side: line_side,
    dart: dart.dart,
    neck: line_neck,
    armpit: line_armpit,
    shoulder: line_shoulder,
    height: lines_height
  }


}

function front(mea, ct, x,y){
  //start
  const start = add_point(new Point(x,y));
  let lines_height = line_with_length(start, mea.height, 0);

  //Taille
  const line_tai = line_with_length(lines_height.get_endpoints()[1], ((mea.tai + ct.freedom)/4), 90);
  const ps_bottom = line_tai.get_endpoints();

  let line_shoulder = shoulder(lines_height.p1, mea.shoulder_l, mea.height, 0);
  let l_line = line_with_length(line_shoulder.p1, line_shoulder.get_length(), 68);
  remove_point(l_line.p2);
  mea.bust_point = genereate_bust_point(mea, ct, lines_height, l_line, line_tai, 1);


  // new Lines of height and bust line
  temp = point_at(lines_height, 0.46);
  lines_height = [temp.l1_segment, temp.l2_segment];
  len_bust_max = Math.max((((mea.bust + mea.bust_diff *2)/4) + ct.freedom /4), (mea.tai/4) + ct.freedom/4);
  const line_bust = line_with_length(temp.point, len_bust_max, 90);


  // closing line
  let line_side = side(line_bust.get_endpoints()[1], line_tai.get_endpoints()[1], lines_height[1]);
  temp = deepen_neckline(lines_height[0], ct.depth_neckline); // 0.28
  lines_height[0] = temp;




  ct.front_shoulder_procentage = 1 -(mea.back_shoulder/(mea.shoulder_l/2));

 abnaeher_temp = 4.5 + mea.bust_diff;
 temp = dart_new(mea.bust_point, line_bust, line_side, line_shoulder, abnaeher_temp, ct);

 line_side = temp.side;
 let dart = temp.dart;

 lINE= line_between_points(temp.dart[0].p2, temp.dart[1].p2);
 console.log("Weite des Abnaehers", lINE.get_length());
 remove_line(lINE);

 let line_armpit = armpit(line_bust, line_shoulder, 5, -1);
 mea.arm_front = line_armpit.get_length();


  temp = round_neckline(ct, "front", lines_height[0], line_shoulder, -1);
  const line_neck = temp.neckline;
  mea.front_ausschnitt = line_neck.get_length();
  line_shoulder = temp.shoulder;

  remove_point(mea.bust_point);
/*

  if(ct.abnaeher > 0 && ct.degree != 0){
    mea.vorn_armk_hoehe = armk_hoehe(line_armpit.p1, t4.line_bust[0], -1);
    mea.front_shoulder = t4.line_cutted[0].get_length() + t4.line_cutted[1].get_length();

    mea.front_side =  t4.line_side.get_length();
  } else {*/
    mea.vorn_armk_hoehe = armk_hoehe(line_armpit.p1, line_bust, -1);
    mea.front_shoulder = line_shoulder.get_length();

    mea.front_side = line_side[0].get_length() + line_side[1].get_length();
//  }
  console.log(line_bust.get_length(), len_bust_max, "bust line");

  lines_height = merge_lines(lines_height[0], lines_height[1]);
  remove_point(line_bust.p1);

  // l_help erstellt oben bei line_tai, da nicht sicher gestellt ist, das line_tai nicht zerschnitten wird

  return {
    tai: line_tai,
    side: line_side,
    dart: dart,
    neck: line_neck,
    armpit: line_armpit,
    shoulder: line_shoulder,
    height: lines_height
  };

}

function armk_hoehe(pt, ln, r){
  const vec = lotpunkt(ln, pt, r);
  const p = add_point(new Point(vec.x, vec.y));
  const l = line_between_points(pt, p);
  const len = l.get_length();
  remove_point(p);

  return len;
}


function genereate_bust_point(mea, ct, ln1, ln2, ln_help, r, back = false){
  let distance;
  if (ct.back_dart_shift && back){
    distance = ct.back_dart_distance/2;
  } else {
    distance = mea.bust_point_distance/2;
  }
  const l_h = line_with_length(ln2.p1, distance, 90*r);
  const lot_vec = lotpunkt(ln_help, l_h.p2, -r);
  const lot_p = add_point(new Point(lot_vec.x, lot_vec.y));
  const l = line_between_points(l_h.p2, lot_p);
  const inter = intersection_points(ln2, l);
  const vec = l.get_line_vector().normalize().scale(mea.bust_point_height).add(inter[0]);
  const p = add_point(new Point(vec.x, vec.y));
  remove_point(lot_p);
  remove_point(l_h.p2);

  return p;
}
//save(`out.svg`, 500, 500);

function adjust_back_shoulder(returns, mea, ct){
  difference = mea.back_shoulder - mea.front_shoulder;
  let length_first_part;
  let shoulder;
  if (returns.shoulder[0]){
    length_first_part = returns.shoulder[0].get_length();
    shoulder = returns.shoulder[0];
  } else {
    length_first_part = returns.shoulder.get_length();
    shoulder = returns.shoulder;
  }
  //length_first_part =
  if (difference > 0.5){
    if (difference > length_first_part){
      //maeh -.-
    } else {
      percentage = difference / length_first_part;
      new_shoulder = point_at(shoulder, percentage);
      remove_point(new_shoulder.l1_segment.p1);
      //round_neckline(ct, "back", returns.heights, new_shoulder[1], -1);
      start_ln = returns.height;
      ln = new_shoulder.l2_segment;

      const n_ln = get_orth_line(start_ln, start_ln.p1, 1);
      const n_ln2 = get_orth_line_length(ln, ln.p1, length_first_part, -1);

      const intersect = intersect_lines(n_ln, n_ln2);
      remove_point(intersect.l1_segments[1].get_endpoints()[1]);
      remove_point(intersect.l2_segments[1].get_endpoints()[1]);

      const inter = interpolate_lines(intersect.l1_segments[0], intersect.l2_segments[0], 2);
      remove_point(intersect.intersection_points[0]);

    }
  }
  if (returns.shoulder[0]){
    mea.back_shoulder = new_shoulder.l2_segment.get_length() + returns.shoulder[1].get_length();
    returns.shoulder[0] = new_shoulder.l2_segment;
  } else {
    mea.back_shoulder = new_shoulder.l2_segment.get_length();
    returns.shoulder = new_shoulder.l2_segment;

  }
}

export default {front, back, adjust_back_shoulder};