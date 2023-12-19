const { Sketch } = require("./sketch.js");
const { Point }  =  require("./point.js");
const path = require('path');

const { save_as_svg }  =  require("./rendering/to_svg.js");
const { save_as_png }  =  require("./rendering/to_png.js");
const { toA4printable } = require("./rendering/to_A4_pages.js")

const { validate_sketch, assert } =  require("./testing.js");

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
    "intersection_points",
    "copy_line",
    "remove_line",
    "remove_point",
    "line_from_function_graph",
    "merge_lines"
];

sketch_functions.forEach(f => {
    module.exports[f] = (...params) => {
        let r = s[f](...params);
        validate_sketch(s);
        return r;
    };
});

module.exports.save = {
    svg: (save_to, width, height, to_lifesize = false) => save_as_svg(s, save_to, width, height, to_lifesize),
    png: (save_to, width, height, to_lifesize = false) => save_as_png(s, save_to, width, height, to_lifesize),
    a4: (folder = "renders/rendered_A4") => {
        toA4printable(s, folder);
        save_as_png(s, path.join(folder, "img.jpg"), 500, 500); // When global params, this should also be a full page (minus padding)
    }
}

module.exports.Point = Point;

module.exports.debug = {
    get_sketch: () => { return s; },
    log_sketch: () => { console.log(s); },
    assert,
    sketch_has_pt: (...pt) => { return s._has_points(...pt); },
    assert_has_pt: (...pt) => { 
        return assert(s._has_points(...pt)); 
    },
    sketch_has_line: (...l) =>  { return s._has_lines(...l); },
    assert_has_line: (...l) => {
        return assert(s._has_lines(...l));
    }
}