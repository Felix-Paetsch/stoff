const { add_point, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_point, _log_sketch } = require("./StoffLib/main.js");

const p1 = add_point(new Point(0,0));
const p2 = add_point(new Point(0,100));
const p3 = add_point(new Point(-20,10));
const p4 = add_point(new Point(20,10));

const l1 = line_between_points(p1,p2);
const l2 = line_between_points(p3,p4);

intersect_lines(l1, l2)

//_log_sketch();

remove_point(p3);
remove_point(p4);

save(`test.svg`, 500, 500);