"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interpolate_shapes = interpolate_shapes;
var geometry_oldy_1 = require("@/geometry_oldy");
function interpolate_shapes(line1, line2, f, p1, p2) {
    if (f === void 0) { f = function (x) { return x; }; }
    if (p1 === void 0) { p1 = function (x) { return x; }; }
    if (p2 === void 0) { p2 = function (x) { return x; }; }
    return function (t) {
        return geometry_oldy_1.Vector.lerp(line1.sample(p1(t)), line2.sample(p2(t)), f(t));
    };
}
