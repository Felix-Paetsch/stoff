const { add_point, line_between_points, interpolate_lines, Point, save } = require("./StoffLib/export_global.js");
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

for (let i = 0; i < lines.length; i++) {
    let fraction = i / lines.length;
    fraction += 0.5;
    if (fraction >= 1){
        fraction -= 1;
    }

    // Determine the RGB components
    let r, g, b;
    if (fraction < 1 / 6) {
        // Red to Yellow (Increase Green)
        r = 255;
        g = 255 * fraction * 6;
        b = 0;
    } else if (fraction < 2 / 6) {
        // Yellow to Green (Reduce Red)
        r = 255 * (1 - (fraction - 1 / 6) * 6);
        g = 255;
        b = 0;
    } else if (fraction < 3 / 6) {
        // Green to Cyan (Increase Blue)
        r = 0;
        g = 255;
        b = 255 * (fraction - 2 / 6) * 6;
    } else if (fraction < 4 / 6) {
        // Cyan to Blue (Reduce Green)
        r = 0;
        g = 255 * (1 - (fraction - 3 / 6) * 6);
        b = 255;
    } else if (fraction < 5 / 6) {
        // Blue to Magenta (Increase Red)
        r = 255 * (fraction - 4 / 6) * 6;
        g = 0;
        b = 255;
    } else {
        // Magenta to Red (Reduce Blue)
        r = 255;
        g = 0;
        b = 255 * (1 - (fraction - 5 / 6) * 6);
    }

    const total_sum = r + g + b;
    const scale_factor = 255/total_sum;
    r *= scale_factor;
    g *= scale_factor;
    b *= scale_factor;

    // Set the color
    lines[i].set_color(`rgb(${r}, ${g}, ${b})`);
}

for (let i = 1; i < 8; i++){
    const new_lines = [];
    for (let j = 0; j < lines.length - 1; j++){
        new_lines.push(interpolate_lines(lines[j], lines[(j+1) % lines.length], 0));
    }
    lines = new_lines;
}

save.svg(`renders/out.svg`, 500, 500);