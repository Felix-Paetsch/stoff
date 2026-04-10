"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate_sketch = validate_sketch;
var geometrytry_1 = require("../../../geometrytry");
var exports_1 = require("./exports");
var expect_1 = require("../../expect");
var currently_validating = false;
function validate_sketch(sk) {
    var reset_validating = !currently_validating;
    currently_validating = true;
    var validation_fns = [];
    sk.get_lines().map(function (l) { return validation_fns.push(function () { return validate_line(l, sk); }); });
    sk.get_points().map(function (p) {
        return validation_fns.push(function () { return validate_point(p, sk); });
    });
    var res = (0, expect_1.merge_validations)(validation_fns);
    currently_validating = false || !reset_validating;
    return res;
}
function validate_line(l, s) {
    var validations = [
        function () { return (0, exports_1.same_sketch)(l, s); },
        function () { return relative_endpoints_are_correct(l); },
        function () { return sketch_points_as_enpoints(s, l); },
        function () { return no_nan_values(l); },
        function () { return endpoints_have_line(l); },
    ];
    return (0, expect_1.merge_validations)(validations);
}
function validate_point(p, s) {
    var validations = [
        function () { return (0, exports_1.same_sketch)(p, s); },
        function () { return adjacent_lines_have_endpoint(p); },
    ];
    return (0, expect_1.merge_validations)(validations);
}
// TEST CASES LINES
function relative_endpoints_are_correct(l) {
    if (!l.get_sample_points()[0].equals(geometrytry_1.ZERO)) {
        return "Line sample points don't start with (0,0).";
    }
    if (!l.get_sample_points()[1].equals(new geometrytry_1.Vector(1, 0))) {
        ("Line sample points don't end with (1,0).");
    }
}
function sketch_points_as_enpoints(s, l) {
    (0, expect_1.expect)(s.has.apply(s, l.get_endpoints()), "Line endpoints should be in the same sketch as line.");
}
function no_nan_values(l) {
    l.get_sample_points().forEach(function (p) {
        (0, expect_1.expect)(!isNaN(p.x) && !isNaN(p.y), "Some line sample points are NaN.");
    });
}
function endpoints_have_line(l) {
    (0, expect_1.expect)(l.p1.get_adjacent_lines().includes(l) &&
        l.p2.get_adjacent_lines().includes(l), "Line endpoints aren't adjacent to line");
}
// TEST CASES POINTS
function adjacent_lines_have_endpoint(pt) {
    (0, expect_1.expect)(pt.get_adjacent_lines().every(function (l) { return l.has_endpoint(pt); }), "A point has a line registered that shouldn't be there");
}
