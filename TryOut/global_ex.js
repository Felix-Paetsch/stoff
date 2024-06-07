import { add_point, line_from_function_graph, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_line } from '../StoffLib/export_global.js';

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

const f = l2.get_to_relative_function();
l2.sample_points = l2.abs_normalized_sample_points().map(r => f(r));

l1.set_color("rgb(200,0,0)");
l2.set_color("rgb(100,0,255)");
interpolate_lines(l1, l2);

const l3 = line_between_points(p1, p2);
const r1 = intersect_lines(l3, l1);
remove_line(r1.l1_segments[1]);
remove_line(r1.l1_segments[0]);

const l4 = line_between_points(p1, p2);
const r2 = intersect_lines(l4, l2);
remove_line(r2.l1_segments[1]);
remove_line(r2.l1_segments[0]);

line_between_points(r2.intersection_points[0], p1);
line_between_points(r1.intersection_points[0], p2);

save.svg("renders/out.svg", 500,500);