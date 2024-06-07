import { debug, add_point, remove_point, line_between_points, interpolate_lines, Point, save, remove_line, clear, merge_lines } from '../StoffLib/main.js';
import { Vector } from '../Geometry/geometry.js';
import { get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, armpit, round_neckline, smooth_out} from '../clothes/basicFun_new.js';
import { rotate_dart, tai_sho_dart, cut_line, rotate_point, scale_line, rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart, side_to_top} from '../clothes/darts.js';



function lengthen_mid_without_armpit(part, mea, ct, percent, r){

  p = part.tai.p1;
  l_mid = line_with_length(p, mea.tai_height, 0);

  len = ((mea.po + ct.freedom)/2) *percent;
  l_bottom = line_with_length(l_mid.p2, len, 90 * r);

  l_side = side(part.tai.p2, l_bottom.p2, l_mid);

  return {

  }
}


 function mid_lengthen(mid, mea, ct, percent){
   p = mid.armpit_back.p2;
   lot_v = lotpunkt(mid.tai, p, 1);
   lot = add_point(new Point(lot_v.x, lot_v.y));
   vec_left = mid.tai.p1.subtract(lot);
   vec_both = mid.tai.get_line_vector();
   vec_left_len = vec_left.length() / vec_both.length();
   l_mid = line_with_length(lot, mea.tai_height, 0);
   len = ((mea.po + ct.freedom) / 2)* percent;
   vec_left_corner = l_mid.p2.add(vec_left.normalize().scale(len * vec_left_len));
   p2 = add_point(new Point(vec_left_corner.x, vec_left_corner.y));


   vec_right_corner = p2.add(vec_both.normalize().scale(len));
   p3 = add_point(new Point(vec_right_corner.x, vec_right_corner.y));

   side_left = side(mid.tai.p1, p2, l_mid);
   side_rigth = side(mid.tai.p2, p3, l_mid);
   bot = line_between_points(p2, p3);

   remove_point(l_mid.p2);
   remove_point(lot);
 }
// danach Debby ein Bild davon schicken


function tai_parts(parts, mea){
  let percent = parts;
  let sum = 0;
  for (let i = parts.length - 1;i >= 0; i--){
    sum = sum + parts[i].tai.get_length();
  }

  for (let i = parts.length -1;i >= 0; i--){
    percent[i] = parts[i].tai.get_length() / sum;
  }
  return percent;
}




export default {lengthen_mid_without_armpit, tai_parts, mid_lengthen};