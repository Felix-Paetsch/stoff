const { add_point, line_from_function_graph, line_between_points, line_with_offset, interpolate_lines, intersect_lines, Point, save, merge_lines, remove_point, remove_line, debug, point_on_line } = require("./StoffLib/main.js");

const p1 = add_point(new Point(0,0));
const p2 = add_point(new Point(0,100));

let l1 = line_from_function_graph(
    p1, 
    p2,
    t => .5*Math.sin(2*t* Math.PI),
);


const res = line_with_offset(l1, 3);

const p3 = add_point(new Point(-50, 50));
const p4 = add_point(new Point(50, 50));

const l2 = line_between_points(p3, p4);
const {intersection_points, l1_segments, l2_segments} = intersect_lines(l1, l2);

l1 = merge_lines(l1_segments[0], l1_segments[1]);
remove_point(p3);
remove_point(p4);

point_on_line(intersection_points[0], l1);

l1.set_color("#ff00ff");

save.svg("renders/out.svg", 500,500);