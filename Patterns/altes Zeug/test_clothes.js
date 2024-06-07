import { add_point, line_between_points, interpolate_lines, Point, save, remove_line } from './StoffLib/main.js';
import { Vector } from './Geometry/geometry.js';
import { get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, armpit, round_neckline} from './clothes/basicFun_new.js';
import { rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart} from './clothes/abnaeher.js';




















save(`out.svg`, 500, 500);
