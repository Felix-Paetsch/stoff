"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catmull_rom_plot_controlpoints = catmull_rom_plot_controlpoints;
exports.hermite_plot_controlpoints = hermite_plot_controlpoints;
exports.bezier_plot_controlpoints = bezier_plot_controlpoints;
var expect_1 = require("@/Core/expect");
function catmull_rom_plot_controlpoints(sketch, points, start_velocity, end_velocity, relative) {
    if (start_velocity === void 0) { start_velocity = null; }
    if (end_velocity === void 0) { end_velocity = null; }
    if (relative === void 0) { relative = true; }
    (0, expect_1.expect)(points.length > 1);
    if (start_velocity == null) {
        start_velocity = points[1].subtract(points[0]);
    }
    else if (!relative) {
        start_velocity = start_velocity.subtract(points[0]);
    }
    var velocities = [start_velocity];
    for (var i = 1; i < points.length - 1; i++) {
        velocities.push(points[i + 1].subtract(points[i - 1]).mult(1 / 2));
    }
    if (end_velocity == null) {
        end_velocity = points[points.length - 1].subtract(points[points.length - 2]);
    }
    else if (!relative) {
        end_velocity = end_velocity.subtract(points[points.length - 1]);
    }
    velocities.push(end_velocity);
    return hermite_plot_controlpoints(sketch, points, velocities, true);
}
function hermite_plot_controlpoints(sketch, points, velocities, relative, 
//@ts-ignore
pt_callback, 
//@ts-ignore
ln_callback) {
    if (relative === void 0) { relative = false; }
    if (pt_callback === void 0) { pt_callback = function (pt, i) { }; }
    if (ln_callback === void 0) { ln_callback = function (ln, i) { }; }
    var new_velocities = velocities;
    if (!relative) {
        new_velocities = [];
        for (var i = 0; i < points.length; i++) {
            new_velocities.push(velocities[i].subtract(points[i]));
        }
    }
    var hermite_control_points = [];
    for (var i = 0; i < points.length - 1; i++) {
        hermite_control_points.push(points[i], points[i].add(new_velocities[i]));
    }
    hermite_control_points.push(points[points.length - 1], points[points.length - 1].add(new_velocities[points.length - 1]));
    var pts = [];
    hermite_control_points.forEach(function (vec) {
        var pt = sketch.add_point(vec.copy());
        pt.data._shape_visualization = "true";
        pts.push(pt);
    });
    var lns = [];
    for (var i = 0; i < pts.length / 2; i++) {
        var ln = sketch.line_between_points(pts[2 * i], pts[2 * i + 1]);
        ln.data._shape_visualization = "true";
        lns.push(ln);
    }
    pts.forEach(function (p, i) { return pt_callback(p, i); });
    lns.forEach(function (l, i) { return ln_callback(l, i); });
}
function bezier_plot_controlpoints(sketch, control_points, 
//@ts-ignore
pt_callback, 
//@ts-ignore
ln_callback) {
    if (pt_callback === void 0) { pt_callback = function (pt, i) { }; }
    if (ln_callback === void 0) { ln_callback = function (ln, i) { }; }
    var pts = [];
    control_points.forEach(function (vec) {
        var pt = sketch.add_point(vec.copy());
        pt.data._shape_visualization = "true";
        pts.push(pt);
        pts.push(pt);
    });
    var lns = [];
    for (var i = 0; i < pts.length - 1; i++) {
        var ln = sketch.line_between_points(pts[i], pts[i + 1]);
        lns.push(ln);
        ln.data._shape_visualization = "true";
    }
    pts.forEach(function (p, i) { return pt_callback(p, i); });
    lns.forEach(function (l, i) { return ln_callback(l, i); });
}
