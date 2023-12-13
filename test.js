const { add_point, line_from_function_graph, merge_lines, debug, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_point, remove_line, _log_sketch } = require("./StoffLib/main.js");

const p1 = add_point(new Point(0,100));
const p2 = add_point(new Point(0,-100));
const p3 = add_point(new Point(-100,0));
const p4 = add_point(new Point(100,0));

const l1 = line_between_points(p1,p2);
const l2 = line_between_points(p4,p3);

const res = intersect_lines(l1, l2);

merge_lines(res.l1_segments[0], res.l1_segments[1]);
merge_lines(res.l2_segments[0], res.l2_segments[1]);

remove_point(res.intersection_points[0]);

save(`test.svg`, 500, 500);