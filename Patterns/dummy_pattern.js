const { Point } = require("../StoffLib/point.js");
const { Sketch } = require("../StoffLib/sketch.js");

module.exports = (config_data) => {
    const s = new Sketch();

    const p1 = s.add_point(new Point(10,0));
    const p2 = s.add_point(new Point(-10,0));
    const p3 = s.add_point(new Point(0,10));
    const p4 = s.add_point(new Point(0,-10));

    const l1 = s.line_between_points(p1, p2);
    const l2 = s.line_between_points(p3, p4);
    s.intersect_lines(l1, l2);
    
    return s;
}