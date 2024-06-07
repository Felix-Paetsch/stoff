import { Sketch } from './sketch.js';
import { Point } from './point.js';
import path from 'path';

import { save_as_svg } from './rendering/to_svg.js';
import { save_as_png } from './rendering/to_png.js';
import { toA4printable } from './rendering/to_A4_pages.js';

import { validate_sketch, assert, try_with_error_msg } from './validation.js';

export {}

let s = new Sketch();module.exports.reset = () => { s = new Sketch(); }
module.exports.set_sketch = (new_s) => { s = new_s; }

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


module.exports.save = {
    svg: (save_to = "renders/out.svg", width, height) => {
        validate_sketch(s);
        try_with_error_msg(() => {
            save_as_svg(s, save_to, width, height);
        }, "An error occured during saving");
    },
    png: (save_to = "renders/out.png", width, height) => {
        validate_sketch(s);
        try_with_error_msg(() => {
            save_as_png(s, save_to, width, height);
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
    sketch_has_pt: (...pt) => { return s.has_points(...pt); },
    assert_has_pt: (...pt) => { 
        return assert(s.has_points(...pt)); 
    },
    sketch_has_line: (...l) =>  { return s.has_lines(...l); },
    assert_has_line: (...l) => {
        return assert(s.has_lines(...l));
    }
}