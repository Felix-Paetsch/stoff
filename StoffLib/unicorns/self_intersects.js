/*
    Note this code was written using ChatGPT improving upon the old iteration.
*/

import { line_segments_intersect } from "../geometry.js";

export default (LineClass) => {
    LineClass.prototype.self_intersects = function() {
        const cached = this.self_intersection_cache;
        const points = this.sample_points;
        const plen = points.length;

        if (cached.self_intersects !== null) {
            const oldPoints = cached.sp;
            if (oldPoints.length === plen) {
                let same = true;
                for (let i = 0; i < plen; i++) {
                    const a = oldPoints[i], b = points[i];
                    if (a.x !== b.x || a.y !== b.y) { same = false; break; }
                }
                if (same) return cached.self_intersects;
            }
        }

        cached.sp = points.slice();
        const monotone_segments = [];
        let start = 0, i = 1;

        while (i < plen) {
            let prev = points[start], curr = points[i];
            while (i < plen && curr.x === prev.x && curr.y === prev.y) {
                i++;
                curr = points[i];
            }
            if (i === plen) break;
            const x_diff = curr.x - prev.x, y_diff = curr.y - prev.y;
            const x_inc = x_diff > 0, x_dec = x_diff < 0;
            const y_inc = y_diff > 0, y_dec = y_diff < 0;
            while (i + 1 < plen) {
                let next = points[i + 1];
                while (i + 1 < plen && next.x === curr.x && next.y === curr.y) {
                    i++;
                    next = points[i + 1];
                }
                if (i + 1 === plen) break;
                const nx_diff = next.x - curr.x, ny_diff = next.y - curr.y;
                if ((x_inc && nx_diff <= 0) || (x_dec && nx_diff >= 0) ||
                    (x_diff === 0 && ((y_inc && ny_diff <= 0) || (y_dec && ny_diff >= 0)))) break;
                i++;
                prev = curr;
                curr = next;
            }
            monotone_segments.push([start, i]);
            start = i; i++;
        }

        const segCount = monotone_segments.length;
        const segment_lines = [];
        for (let si = 0; si < segCount; si++) {
            const [segStart, segEnd] = monotone_segments[si];
            const lines = [];
            let pidx = segStart;
            while (pidx < segEnd && points[pidx].x === points[pidx + 1]?.x && points[pidx].y === points[pidx + 1]?.y) pidx++;
            for (let j = pidx + 1; j <= segEnd; j++) {
                while (j <= segEnd && points[pidx].x === points[j].x && points[pidx].y === points[j].y) j++;
                if (j > segEnd) break;
                const p1 = points[pidx], p2 = points[j];
                if (p1.x !== p2.x || p1.y !== p2.y) {
                    lines.push([p1, p2]);
                    pidx = j;
                } else {
                    pidx = j;
                }
            }
            let direction = 1;
            for (let k = 0; k < lines.length; k++){
                if (lines[k][0].x < lines[k][1].x) {direction = 1; break;}
                if (lines[k][0].x > lines[k][1].x) {direction = -1; break;}
            }
            segment_lines.push({ lines, direction });
        }

        for (let si = 0; si < segCount - 1; si++) {
            const seg1 = segment_lines[si];
            const lines1 = seg1.lines;
            if (!lines1.length) continue;
            const x1min = lines1[0][0].x;
            const x1max = lines1[lines1.length - 1][1].x;
            const s1 = seg1.direction > 0 ? 0 : lines1.length - 1;
            const inc1 = seg1.direction > 0 ? 1 : -1;
            const l1_left = seg1.direction > 0 ? 0 : 1;
            const l1_right = seg1.direction > 0 ? 1 : 0;
            for (let sj = si + 1; sj < segCount; sj++) {
                const seg2 = segment_lines[sj];
                const lines2 = seg2.lines;
                if (!lines2.length) continue;
                const x2min = lines2[0][0].x;
                const x2max = lines2[lines2.length - 1][1].x;
                if (x2min > x1max || x1min > x2max) continue;
                let s2 = seg2.direction > 0 ? 0 : lines2.length - 1;
                const inc2 = seg2.direction > 0 ? 1 : -1;
                const l2_left = seg2.direction > 0 ? 0 : 1;
                const l2_right = seg2.direction > 0 ? 1 : 0;
                let c1 = s1, c2 = s2;
                while (c1 >= 0 && c1 < lines1.length && c2 >= 0 && c2 < lines2.length) {
                    const l1 = lines1[c1], l2 = lines2[c2];
                    if (l1[l1_right].x < l2[l2_left].x) { c1 += inc1; continue; }
                    if (l2[l2_right].x < l1[l1_left].x) { c2 += inc2; continue; }
                    const [intersects] = line_segments_intersect(l1, l2);
                    if (intersects) {
                        cached.self_intersects = true;
                        return true;
                    }
                    if (l1[l1_right].x < l2[l2_right].x) c1 += inc1; else c2 += inc2;
                }
            }
        }

        cached.self_intersects = false;
        return false;
    }
}
