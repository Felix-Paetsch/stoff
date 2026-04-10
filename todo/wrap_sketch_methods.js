"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sketch_graphical_non_pure_methods = void 0;
exports.wrap_sketch_methods = wrap_sketch_methods;
exports.wrap_sketch_prototype_methods = wrap_sketch_prototype_methods;
var prototype_modification_1 = require("@/Core/utils/prototype_modification");
function wrap_sketch_methods(s, method, wrap_on) {
    if (wrap_on === void 0) { wrap_on = null; }
    return (0, prototype_modification_1.wrap_object_methods)(s, method, wrap_on || exports.sketch_graphical_non_pure_methods);
}
function wrap_sketch_prototype_methods(s, method, wrap_on) {
    if (wrap_on === void 0) { wrap_on = null; }
    return (0, prototype_modification_1.wrap_class_prototype_methods)(s, method, wrap_on || exports.sketch_graphical_non_pure_methods);
}
exports.sketch_graphical_non_pure_methods = [
    "add_point",
    "clear",
    "copy_line",
    "intersect_lines",
    "interpolate_lines",
    "line_between_points",
    "line_from_function_graph",
    "line_at_angle",
    "line_with_offset",
    "merge_lines",
    "merge_points",
    "paste_sketch",
    "point_on_line",
    "remove",
];
