const { add_point, line_from_function_graph, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_point, remove_line, _log_sketch } = require("./StoffLib/main.js");

const p1 = add_point(new Point(0,0));
const p2 = add_point(new Point(0,100));

const l1 = line_from_function_graph(
    p1, 
    p2,
    t => .5*Math.sin(2*t* Math.PI),
);

const l2 = line_from_function_graph(
    p1, 
    p2,
    x => x*x,
    x => .3*Math.sin(2*x* Math.PI),
);

const l3 = line_between_points(p1, p2);
const l4 = line_between_points(p1, p2);

const r1 = intersect_lines(l3, l1);
remove_line(r1.l1_segments[1]);
remove_line(r1.l1_segments[0]);

const r2 = intersect_lines(l4, l2);
remove_line(r2.l1_segments[1]);
remove_line(r2.l1_segments[0]);

line_between_points(r2.intersection_points[0], p1);
line_between_points(r1.intersection_points[0], p2);

save(`test.svg`, 500, 500);