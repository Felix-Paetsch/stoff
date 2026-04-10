"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.same_sketch = same_sketch;
exports.is_isolated = is_isolated;
exports.not_isolated = not_isolated;
exports.vec_on_line = vec_on_line;
exports.path_connected = path_connected;
var expect_1 = require("@/Core/expect");
var geometry_1 = require("@/Core/geometry");
var numerics_1 = require("@/Core/numerics");
var sketch_1 = require("@/Core/sketch");
var sketch_old_1 = require("@/sketch_old");
__exportStar(require("./sketch_is_valid"), exports);
function same_sketch() {
    var els = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        els[_i] = arguments[_i];
    }
    if (els.length == 0)
        return true;
    var sketch = extract_sketch(els[0]);
    return (0, expect_1.merge_validations)(els.map(function (e) { return extract_sketch(e) === sketch; }));
}
function extract_sketch(out_of) {
    if (out_of instanceof sketch_old_1.Sketch)
        return out_of;
    if ("sketch" in out_of)
        return out_of.sketch;
    return out_of.get_sketch();
}
function is_isolated(el) {
    if (el instanceof sketch_1.Point)
        return el.adjacent_lines().length == 0;
    return (el.p1.adjacent_lines().length == 1 && el.p2.adjacent_lines().length == 1);
}
function not_isolated(el) {
    return !is_isolated(el);
}
function vec_on_line(vec, line) {
    return geometry_1.Geometry.distance(vec, line.shape) < numerics_1.EPS.tiny;
}
function path_connected(el1, el2) {
    return new sketch_1.ConnectedComponent(el1).contains(el2);
}
