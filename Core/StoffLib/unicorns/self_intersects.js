import { line_segments_intersect } from "../geometry.js";

export default (LineClass) => {
    LineClass.prototype.self_intersects = function() {
        const cached = this.self_intersection_cache;
        const points = this.sample_points;
        const plen = points.length;

        // Fast equality check for cached result
        if (cached.self_intersects !== null && cached.sp && cached.sp.length === plen) {
            let same = true;
            for (let i = 0; i < plen; i++) {
                const a = cached.sp[i], b = points[i];
                if (a.x !== b.x || a.y !== b.y) { same = false; break; }
            }
            if (same) return cached.self_intersects;
        }

        // Copy sample_points efficiently
        const spCopy = new Array(plen);
        for (let i = 0; i < plen; i++) {
            spCopy[i] = points[i];
        }
        cached.sp = spCopy;

        // Step 1: Split into monotone segments
        const monotone_segments = [];
        {
            let start = 0;
            let i = 1;
            while (i < plen) {
                let prev = points[start], curr = points[i];
                while (i < plen && curr.x === prev.x && curr.y === prev.y) {
                    i++;
                    curr = points[i];
                }
                if (i === plen) break;

                const x_diff = curr.x - prev.x;
                const y_diff = curr.y - prev.y;
                const x_inc = x_diff > 0;
                const x_dec = x_diff < 0;
                const y_inc = y_diff > 0;
                const y_dec = y_diff < 0;

                while (i + 1 < plen) {
                    let next = points[i + 1];
                    while (i + 1 < plen && next.x === curr.x && next.y === curr.y) {
                        i++;
                        next = points[i + 1];
                    }
                    if (i + 1 === plen) break;

                    const nx_diff = next.x - curr.x;
                    const ny_diff = next.y - curr.y;

                    if ((x_inc && nx_diff <= 0) ||
                        (x_dec && nx_diff >= 0) ||
                        (x_diff === 0 && ((y_inc && ny_diff <= 0) || (y_dec && ny_diff >= 0)))) {
                        break;
                    }

                    i++;
                    prev = curr;
                    curr = next;
                }

                monotone_segments.push([start, i]);
                start = i; i++;
            }
        }

        // Step 2: Build line segments for each monotone segment
        const segCount = monotone_segments.length;
        const segment_lines = new Array(segCount);
        for (let si = 0; si < segCount; si++) {
            const seg = monotone_segments[si];
            const s = seg[0], e = seg[1];
            const lines = [];
            let pi = s;

            // Skip duplicates at start
            while (pi < e && points[pi + 1] && points[pi].x === points[pi + 1].x && points[pi].y === points[pi + 1].y) pi++;

            for (let j = pi + 1; j <= e; j++) {
                // Skip duplicates in between
                while (j <= e && points[pi].x === points[j].x && points[pi].y === points[j].y) j++;
                if (j > e) break;
                const p1 = points[pi], p2 = points[j];
                if (p1.x !== p2.x || p1.y !== p2.y) {
                    lines.push([p1, p2]);
                    pi = j;
                } else {
                    pi = j;
                }
            }

            let direction = 1;
            for (let k = 0; k < lines.length; k++) {
                const l = lines[k];
                if (l[0].x < l[1].x) { direction = 1; break; }
                if (l[0].x > l[1].x) { direction = -1; break; }
            }

            segment_lines[si] = { lines, direction };
        }

        // Step 3: Check for intersections between segments
        // To speed up checks, avoid repeated Math.min/Math.max calls and reduce array method calls
        for (let i = 0; i < segCount - 1; i++) {
            const seg1 = segment_lines[i];
            const lines1 = seg1.lines;
            if (!lines1.length) continue;

            const l1_first = lines1[0], l1_last = lines1[lines1.length - 1];
            const x1min = l1_first[0].x < l1_first[1].x ? l1_first[0].x : l1_first[1].x;
            const x1max = l1_last[0].x > l1_last[1].x ? l1_last[0].x : l1_last[1].x;

            const s1 = seg1.direction > 0 ? 0 : lines1.length - 1;
            const inc1 = seg1.direction > 0 ? 1 : -1;
            const l1l = seg1.direction > 0 ? 0 : 1;
            const l1r = seg1.direction > 0 ? 1 : 0;

            for (let j = i + 1; j < segCount; j++) {
                const seg2 = segment_lines[j];
                const lines2 = seg2.lines;
                if (!lines2.length) continue;

                const l2_first = lines2[0], l2_last = lines2[lines2.length - 1];
                const x2min = l2_first[0].x < l2_first[1].x ? l2_first[0].x : l2_first[1].x;
                const x2max = l2_last[0].x > l2_last[1].x ? l2_last[0].x : l2_last[1].x;

                // Bounding box check
                if (x2min > x1max || x1min > x2max) continue;

                let s2 = seg2.direction > 0 ? 0 : lines2.length - 1;
                const inc2 = seg2.direction > 0 ? 1 : -1;
                const l2l = seg2.direction > 0 ? 0 : 1;
                const l2r = seg2.direction > 0 ? 1 : 0;

                let cl1 = s1, cl2 = s2;
                while (cl1 >= 0 && cl1 < lines1.length && cl2 >= 0 && cl2 < lines2.length) {
                    const L1 = lines1[cl1], L2 = lines2[cl2];

                    const L1_lx = L1[l1l].x, L1_rx = L1[l1r].x;
                    const L2_lx = L2[l2l].x, L2_rx = L2[l2r].x;

                    if (L1_rx < L2_lx) { cl1 += inc1; continue; }
                    if (L2_rx < L1_lx) { cl2 += inc2; continue; }

                    const [intersects, intersectionPoint] = line_segments_intersect(L1, L2);
                    if (intersects) {
                        // Check if the intersection is just a shared endpoint
                        const l1Endpoints = L1;
                        const l2Endpoints = L2;
                        let isSharedEndpoint = false;
                        if (intersectionPoint) {
                            const ix = intersectionPoint.x, iy = intersectionPoint.y;
                            let countMatch = 0;
                            if ((l1Endpoints[0].x === ix && l1Endpoints[0].y === iy) ||
                                (l1Endpoints[1].x === ix && l1Endpoints[1].y === iy)) {
                                countMatch++;
                            }
                            if ((l2Endpoints[0].x === ix && l2Endpoints[0].y === iy) ||
                                (l2Endpoints[1].x === ix && l2Endpoints[1].y === iy)) {
                                countMatch++;
                            }
                            if (countMatch === 2) isSharedEndpoint = true;
                        }

                        if (!isSharedEndpoint) {
                            this.self_intersection_cache.self_intersects = true;
                            return true;
                        }
                    }

                    // Advance based on rightmost point
                    if (L1_rx < L2_rx) cl1 += inc1; else cl2 += inc2;
                }
            }
        }

        this.self_intersection_cache.self_intersects = false;
        return false;
    }
}
