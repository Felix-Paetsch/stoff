import { debug, add_point, remove_point, line_between_points, interpolate_lines, Point, save, remove_line, clear } from '../StoffLib/main.js';
import { Vector } from '../StoffLib/geometry.js';
import { get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, armpit, round_neckline, smooth_out} from '../clothes/basicFun_new.js';
import { rotate_dart, tai_sho_dart, cut_line, rotate_point, scale_line, rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart} from '../clothes/abnaeher.js';


function puffy_down(arm, degree){
  left = arm.left_line;
  right = arm.right_line;

  p_h = rotate_point(left.p2, left.p1, degree);
  left.p2.moveTo(p_h.x, p_h.y);
  remove_point(p_h);

  p_h = rotate_point(right.p2, right.p1, -degree);
  right.p2.moveTo(p_h.x, p_h.y);
  remove_point(p_h);

  interpolate_lines(arm.wrist_left, arm.wrist_right);
  remove_point(arm.wrist_left.p2);
}


// function puffy_top()
// function puffy_both()



function add_wristband(mea, ct, x, y){
  p = add_point(new Point(x, y));
  l_top = line_with_length(p, mea.wristwidth + 3, -90);
  l_left = line_with_length(p, ct.width_wristband, 0);
  l_bottom = line_with_length(l_left.p2, mea.wristwidth + 3, -90);
  l_right = line_between_points(l_top.p2, l_bottom.p2);
}



export default {puffy_down, add_wristband};