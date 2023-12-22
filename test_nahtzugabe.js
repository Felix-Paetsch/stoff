const { add_point, line_from_function_graph, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_point, remove_line, debug } = require("./StoffLib/main.js");

const p1 = add_point(new Point(0,0));
const p2 = add_point(new Point(0,100));

const l1 = line_from_function_graph(
    p1, 
    p2,
    t => .5*Math.sin(2*t* Math.PI),
);

const res = l1.rounded_offset(3);
res.add_to_sketch(debug.get_sketch());

l1.set_color("#ff00ff");

save.svg("renders/out.svg", 500,500);