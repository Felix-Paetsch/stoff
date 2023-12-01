const { add_point, line_from_function_graph, line_between_points, interpolate_lines, intersect_lines, Point, save, remove_point, remove_line, _log_sketch } = require("./StoffLib/main.js");

const p1 = add_point(new Point(0,0));
const p2 = add_point(new Point(0,100));
const p3 = add_point(new Point(100,100));

const l1 = line_from_function_graph(
    p1, 
    p2,
    t => .2*Math.sin(2*t* Math.PI),
);

const l2 = line_between_points(p2, p3);

function f(t){
    return t
}

function fp1(t){
    return t
}

function fp2(t){
    return t
}

l_int = interpolate_lines(l1, l2, 2, f, fp1, fp2)

n = 5
for (let i = 0; i < n; i++){
    l_int_old = l_int;
    l_int = interpolate_lines(l1, l_int, 0, f, fp1, fp2);
    remove_line(l_int_old);
}

remove_line(l2)
line_between_points(p1,p2)

save(`test.svg`, 500, 500);