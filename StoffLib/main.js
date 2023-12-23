const { Sketch } = require("./sketch.js");
const { Point }  =  require("./point.js");
const path = require('path');

const { save_as_svg }  =  require("./rendering/to_svg.js");
const { save_as_png }  =  require("./rendering/to_png.js");
const { toA4printable } = require("./rendering/to_A4_pages.js")
const { save_as_dev_png }  =  require("./rendering/dev_to_png.js");
const { save_as_dev_svg }  =  require("./rendering/dev_to_svg.js");

const { validate_sketch, assert, try_with_error_msg } =  require("./validation.js");

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
    "merge_lines",
    "point_on_line",
    "line_with_offset"
];

sketch_functions.forEach(f => {
    module.exports[f] = (...params) => {
        let r = s[f](...params);
        validate_sketch(s);
        return r;
    };
});

const render_graphics = [];

module.exports.dev = {
    add_graphic: (...params) => {
        // Possible inputs are
        //      add_graphic(path, top_x, top_y, width, height)
        //         |-> If either width or height is (explicitly) null, scale the other by aspect ratio
        //      add_graphic(path, top_x, top_y, scale)
        // path: url, absolute fp, relative to ../StoffLib
        render_graphics.push(params);
    },
    save_png: async (save_to = "renders/dev_out.png", width = 500, height = 500) => {
        validate_sketch(s);
        try_with_error_msg(() => {
            save_as_dev_png(s, save_to, width, height, render_graphics);
        }, "An error occured during saving");
    },
    save_svg: async (save_to = "renders/dev_out.svg", width = 500, height = 500) => {
        validate_sketch(s);
        try_with_error_msg(() => {
            save_as_dev_svg(s, save_to, width, height, render_graphics);
        }, "An error occured during saving");
    }
}

module.exports.save = {
    svg: (save_to = "renders/out.svg", width, height, to_lifesize = false) => {
        validate_sketch(s);
        try_with_error_msg(() => {
            save_as_svg(s, save_to, width, height, to_lifesize);
        }, "An error occured during saving");
    },
    png: (save_to = "renders/out.png", width, height, to_lifesize = false) => {
        validate_sketch(s);
        try_with_error_msg(() => {
            save_as_png(s, save_to, width, height, to_lifesize);
        }, "An error occured during saving");
    },
    a4: (folder = "renders/rendered_A4") => {
        validate_sketch(s);
        try_with_error_msg(() => {
            toA4printable(s, folder);
            save_as_png(s, path.join(folder, "img.png"), 500, 500); // Update: Should be full page
        }, "An error occured during saving");
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