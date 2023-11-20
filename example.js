const { add_point, line_between_points, interpolate_lines, Point, save } = require("./StoffLib/main.js");
const { Vector } = require("./Geometry/geometry.js");

const p1 = add_point(new Point(0,0));
const p2 = add_point(new Point(-10,-10));
const p3 = add_point(new Point(-21,-11));
const p4 = add_point(new Point(-30,-5));
const p5 = add_point(new Point(-35,5));
const p6 = add_point(new Point(-30,20));

const p65 = add_point(new Point(-10,40));
const p7 = add_point(new Point(0,50));
const p75 = add_point(new Point(10,40));

const p8 = add_point(new Point(30,20));
const p9 = add_point(new Point(35,5));
const p10 = add_point(new Point(30,-5));
const p11 = add_point(new Point(21,-11));
const p12 = add_point(new Point(10,-10));

let lines = [
    line_between_points(p1, p2),
    line_between_points(p2, p3),
    line_between_points(p3, p4),
    line_between_points(p4, p5),
    line_between_points(p5, p6),
    line_between_points(p6, p65),
    line_between_points(p65, p7),
    line_between_points(p7, p75),
    line_between_points(p75, p8),
    line_between_points(p8, p9),
    line_between_points(p9, p10),
    line_between_points(p10, p11),
    line_between_points(p11, p12),
    line_between_points(p12, p1)
];

for (let i = 1; i < 6; i++){
    const new_lines = [];
    for (let i = 0; i < lines.length; i++){
        new_lines.push(interpolate_lines(lines[i], lines[(i+1) % lines.length]));
    }
    lines = new_lines;
}

save(`out.svg`, 500, 500);