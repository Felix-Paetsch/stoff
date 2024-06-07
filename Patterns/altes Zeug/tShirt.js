import { add_point, line_between_points, interpolate_lines, Point, save } from './StoffLib/main.js';
import { Vector } from './Geometry/geometry.js';
import { line_with_length, point_at, armhole, side , shoulder} from './clothes/basicFun.js';



const bust = 90;
const tai = 75;
const po = 100;
const height = 45;
const shoulder_l = 48;


const start = add_point(new Point(0,0));
const line_height = line_with_length(start, height, 0);
const line_tai = line_with_length(line_height.point, (tai/4), -90);

const point_bust = point_at(start, line_height.point, line_height.line, 0.5);
const line_bust = line_with_length(point_bust.point, (bust/4), -90);

const line = side(line_bust.point, line_tai.point, point_bust.line_segment_2);


const shou = shoulder(start, shoulder_l, height, -60);

const arm = armhole(shou.point, line_bust.point, 0, 90);


save(`out.svg`, 500, 500);
