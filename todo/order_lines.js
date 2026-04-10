"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.order_by_endpoints = order_by_endpoints;
exports.oriented_circle = oriented_circle;
function order_by_endpoints() {
    var _a, _b;
    var lines = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        lines[_i] = arguments[_i];
    }
    if (Array.isArray(lines[0])) {
        lines = __spreadArray([], lines[0], true);
    }
    if (lines.length == 0) {
        return {
            lines: [],
            points: [],
            orientations: [],
        };
    }
    if (lines.length == 1) {
        return {
            lines: lines,
            points: lines[0].get_endpoints(),
            orientations: [true],
        };
    }
    if (lines.length == 2)
        return set_two_line_orientations({
            lines: lines,
        });
    var res = {
        lines: [],
        points: [],
        orientations: [],
    };
    res.lines.push(lines.pop());
    res.orientations = [true];
    res.points = [res.lines[0].p1, res.lines[0].p2];
    var smth_found = false;
    while (lines.length > 0) {
        for (var i = lines.length - 1; i >= 0; i--) {
            if (res.lines[0].common_endpoint(lines[i])) {
                // Prepend
                smth_found = true;
                (_a = res.lines).unshift.apply(_a, lines.splice(i, 1));
                if (res.lines.length == 2) {
                    set_two_line_orientations(res);
                }
                else {
                    var next_orientation = res.orientations[0];
                    res.orientations.unshift(res.lines[1][next_orientation ? "p1" : "p2"] ==
                        res.lines[0].p2);
                    res.points.unshift(res.lines[0].other_endpoint(res.points[0]));
                }
            }
            else if (res.lines[res.lines.length - 1].common_endpoint(lines[i])) {
                // Append
                smth_found = true;
                (_b = res.lines).push.apply(_b, lines.splice(i, 1));
                if (res.lines.length == 2) {
                    set_two_line_orientations(res);
                }
                else {
                    var prev_orientation = res.orientations[res.orientations.length - 1];
                    res.orientations.push(res.lines[res.lines.length - 2][prev_orientation ? "p2" : "p1"] == res.lines[res.lines.length - 1].p1);
                    res.points.push(res.lines[res.lines.length - 1].other_endpoint(res.points[res.points.length - 1]));
                }
            }
        }
        expect(smth_found, "Lines dotn form a connected segment");
    }
    function set_two_line_orientations(data) {
        var l0 = data.lines[0];
        var l1 = data.lines[1];
        if (l1.has_endpoint(l0.p2)) {
            data.orientations = [true, l1.p1 == l0.p2];
            data.points = [l0.p1, l0.p2, l1.other_endpoint(l0.p2)];
        }
        else if (l1.has_endpoint(l0.p1)) {
            data.orientations = [false, l1.p1 == l0.p1];
            data.points = [l0.p2, l0.p1, l1.other_endpoint(l0.p1)];
        }
        else {
            expect(invalid_path("Lines dont form a connected segment"));
        }
        return data;
    }
    return res;
}
function oriented_circle(lines) {
    var ordered_lines = Line.order_by_endpoints.apply(Line, lines);
    expect(ordered_lines.points[0] ==
        ordered_lines.points[ordered_lines.points.length - 1], "Lines dont form circle");
    // We assume no self-intersection
    var orientation = polygon_orientation(ordered_lines.points.slice(1));
    if (!orientation) {
        ordered_lines.lines.reverse();
        ordered_lines.points.reverse();
        ordered_lines.orientations.reverse();
        ordered_lines.orientations = ordered_lines.orientations.map(function (o) { return !o; });
    }
    ordered_lines.points.shift();
    ordered_lines.orientations.shift();
    return ordered_lines;
}
