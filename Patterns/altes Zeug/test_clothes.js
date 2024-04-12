const { add_point, line_between_points, interpolate_lines, Point, save, remove_line } = require("./StoffLib/main.js");
const { Vector } = require("./Geometry/geometry.js");
const { get_orth_line_length, deepen_neckline, line_with_length, point_at, side , shoulder, lotpunkt, armpit, round_neckline} = require("./clothes/basicFun_new.js");
const { rotate_abnaeher, add_abnaeher_side, scale_dart, bust_dart} = require("./clothes/abnaeher.js");




















save(`out.svg`, 500, 500);
