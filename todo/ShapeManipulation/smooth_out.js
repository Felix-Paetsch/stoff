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
exports.polyline_smooth_out = polyline_smooth_out;
exports.polygon_smooth_out = polygon_smooth_out;
exports.compute_polyline_center_point = compute_polyline_center_point;
var geometry_oldy_1 = require("@/geometry_oldy");
var config_json_1 = require("../config.json");
function polyline_smooth_out(line, ker_size, sample_spacing) {
    if (ker_size === void 0) { ker_size = 0.1; }
    if (sample_spacing === void 0) { sample_spacing = null; }
    var step = sample_spacing !== null && sample_spacing !== void 0 ? sample_spacing : config_json_1.default.DEFAULT_LINE_SEGMENT_LENGTH;
    if (line.length === 0)
        return [];
    if (line.length === 1)
        return [line[0]];
    var pts = line;
    // build arc-lengths
    var arc = [0];
    for (var i = 0; i < pts.length - 1; i++) {
        arc.push(arc[i] + pts[i].distance(pts[i + 1]));
    }
    var L = arc[arc.length - 1];
    if (L <= geometry_oldy_1.EPS.COARSE)
        return [pts[0], pts[pts.length - 1]];
    var sample_count = Math.max(1, Math.ceil(L / step));
    var out = [];
    var seg_i = 0;
    for (var k = 0; k <= sample_count; k++) {
        var s = k === sample_count ? L : k * step;
        // fix endpoints exactly
        if (k === 0) {
            out.push(pts[0]);
            continue;
        }
        if (k === sample_count) {
            out.push(pts[pts.length - 1]);
            continue;
        }
        var w0 = s - ker_size;
        var w1 = s + ker_size;
        var acc = geometry_oldy_1.ZERO;
        var total_w = 0;
        // left spill → first point
        if (w0 < 0) {
            var w = -w0;
            acc = acc.add(pts[0].scale(w));
            total_w += w;
        }
        // advance segment pointer (monotonic in s)
        while (seg_i < arc.length - 2 && arc[seg_i + 1] < w0) {
            seg_i++;
        }
        // iterate segments overlapping window
        for (var j = seg_i; j < pts.length - 1; j++) {
            var a0 = arc[j];
            var a1 = arc[j + 1];
            if (a0 > w1)
                break;
            if (a1 < w0)
                continue;
            var len = a1 - a0;
            if (len <= geometry_oldy_1.EPS.TINY)
                continue;
            var t0 = Math.max(0, (w0 - a0) / len);
            var t1 = Math.min(1, (w1 - a0) / len);
            if (t1 <= t0)
                continue;
            var p0 = geometry_oldy_1.Vector.lerp(pts[j], pts[j + 1], t0);
            var p1 = geometry_oldy_1.Vector.lerp(pts[j], pts[j + 1], t1);
            var w = (t1 - t0) * len;
            // average of segment piece = midpoint
            var mid = p0.add(p1).scale(0.5);
            acc = acc.add(mid.scale(w));
            total_w += w;
        }
        // right spill → last point
        if (w1 > L) {
            var w = w1 - L;
            acc = acc.add(pts[pts.length - 1].scale(w));
            total_w += w;
        }
        out.push(total_w > geometry_oldy_1.EPS.TINY ? acc.scale(1 / total_w) : pts[seg_i]);
    }
    return out;
}
function polygon_smooth_out(line, ker_size, sample_spacing) {
    if (ker_size === void 0) { ker_size = 0.1; }
    if (sample_spacing === void 0) { sample_spacing = null; }
    var step = sample_spacing !== null && sample_spacing !== void 0 ? sample_spacing : config_json_1.default.DEFAULT_LINE_SEGMENT_LENGTH;
    if (line.length === 0)
        return [];
    if (line.length === 1)
        return [line[0]];
    var pts = line;
    var n = pts.length;
    // build arc-lengths INCLUDING closing segment
    var arc = [0];
    for (var i = 0; i < n; i++) {
        var a = pts[i];
        var b = pts[(i + 1) % n];
        arc.push(arc[i] + a.distance(b));
    }
    var L = arc[arc.length - 1];
    if (L <= geometry_oldy_1.EPS.COARSE)
        return __spreadArray([], pts, true);
    var sample_count = Math.max(1, Math.ceil(L / step));
    var out = [];
    var wrap = function (s) {
        s %= L;
        return s < 0 ? s + L : s;
    };
    for (var k = 0; k < sample_count; k++) {
        var s = wrap(k * step);
        var w0 = s - ker_size;
        var w1 = s + ker_size;
        var window_len = w1 - w0;
        var acc = geometry_oldy_1.ZERO;
        var total_w = 0;
        // ---- FULL WRAPS ----
        if (window_len >= L) {
            var full_wraps = Math.floor(window_len / L);
            if (full_wraps > 0) {
                var full_acc = geometry_oldy_1.ZERO;
                for (var j = 0; j < n; j++) {
                    var a = pts[j];
                    var b = pts[(j + 1) % n];
                    var len = a.distance(b);
                    if (len <= geometry_oldy_1.EPS.TINY)
                        continue;
                    var mid = a.add(b).scale(0.5);
                    full_acc = full_acc.add(mid.scale(len));
                }
                acc = acc.add(full_acc.scale(full_wraps));
                total_w += L * full_wraps;
            }
        }
        // ---- REMAINDER WINDOW ----
        var rem_len = window_len % L;
        if (rem_len > geometry_oldy_1.EPS.TINY) {
            var base = w1 - rem_len;
            var a0 = wrap(base);
            var a1 = wrap(base + rem_len);
            var intervals = a0 <= a1
                ? [[a0, a1]]
                : [
                    [a0, L],
                    [0, a1],
                ];
            for (var _i = 0, intervals_1 = intervals; _i < intervals_1.length; _i++) {
                var _a = intervals_1[_i], ia = _a[0], ib = _a[1];
                for (var j = 0; j < n; j++) {
                    var seg_a0 = arc[j];
                    var seg_a1 = arc[j + 1];
                    if (seg_a0 > ib)
                        break;
                    if (seg_a1 < ia)
                        continue;
                    var len = seg_a1 - seg_a0;
                    if (len <= geometry_oldy_1.EPS.TINY)
                        continue;
                    var t0 = Math.max(0, (ia - seg_a0) / len);
                    var t1 = Math.min(1, (ib - seg_a0) / len);
                    if (t1 <= t0)
                        continue;
                    var pA = pts[j % n];
                    var pB = pts[(j + 1) % n];
                    var p0 = geometry_oldy_1.Vector.lerp(pA, pB, t0);
                    var p1 = geometry_oldy_1.Vector.lerp(pA, pB, t1);
                    var w = (t1 - t0) * len;
                    var mid = p0.add(p1).scale(0.5);
                    acc = acc.add(mid.scale(w));
                    total_w += w;
                }
            }
        }
        out.push(total_w > geometry_oldy_1.EPS.TINY ? acc.scale(1 / total_w) : pts[0]);
    }
    return out;
}
function compute_polyline_center_point(points) {
    if (points.length === 0)
        return geometry_oldy_1.ZERO;
    if (points.length === 1)
        return points[0];
    var acc = geometry_oldy_1.ZERO;
    var len = 0;
    for (var i = 0; i < points.length - 1; i++) {
        var d = points[i].distance(points[i + 1]);
        len += d;
        acc = acc.add(points[i].add(points[i + 1]).scale(d));
    }
    return len > geometry_oldy_1.EPS.TINY ? acc.scale(1 / (2 * len)) : points[0];
}
