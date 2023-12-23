const { add_point, dev, line_from_function_graph, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_point, remove_line, _log_sketch } = require("./StoffLib/main.js");

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

dev.add_graphic(
    "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.rJPOfhEYLy6Yaup8-sbpyQHaE8%26pid%3DApi&f=1&ipt=d770400d4006b93a2039d53d3a5c3071a5055a222ccbfa3ec8964d19f5ee8063&ipo=images",
    0, 0, null, 10
);

dev.save_svg("renders/out.svg", 500, 500);