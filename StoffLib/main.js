const { Sketch } = require("./sketch.js");
const { Point }  =  require("./point.js");
const { create_svg_from_sketch }  =  require("./svg_from_sketch.js");
const { validate_sketch } =  require("./testing.js");
const { writeFileSync } =  require("fs");

module.exports = {}

let s = new Sketch();
module.exports.reset = () => { s = new Sketch(); }

let sketch_functions = [
    "get_bounding_box",
    "get_points",
    "add_point",
    "get_lines",
    "line_between_points",
    "interpolate_lines",
    "intersect_lines",
    "copy_line",
    "remove_line"
];

sketch_functions.forEach(f => {
    module.exports[f] = (...params) => {
        let r = s[f](...params);
        validate_sketch(s);
        return r;
    };
});

module.exports.save = (save_to, dim = 500) => {
    writeFileSync(save_to, create_svg_from_sketch(s, dim), (err) => {
        if (err) throw err;
        console.log('SVG file saved!');
    });
}

module.exports.Point = Point;