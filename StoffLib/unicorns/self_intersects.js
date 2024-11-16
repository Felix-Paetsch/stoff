import { line_segments_intersect } from "../geometry.js";

export default (LineClass) => {
    LineClass.prototype.self_intersects = function() {
        if (
            this.self_intersection_cache.self_intersects !== null
            && !this.sample_points.some(
                (point, index) => {
                    return point !== this.self_intersection_cache.sp[index]
                }
            )
        ){
            return this.self_intersection_cache.self_intersects;
        }

        this.self_intersection_cache.sp = [...this.sample_points];

        const monotone_segments = [];
        let start = 0;
        let i = 1;

        // Step 1: Split into monotone segments while skipping duplicate points
        while (i < this.sample_points.length) {
            let prev = this.sample_points[start];
            let curr = this.sample_points[i];

            // Skip duplicates
            while (i < this.sample_points.length && curr.x === prev.x && curr.y === prev.y) {
                i++;
                curr = this.sample_points[i];
            }

            if (i === this.sample_points.length) {
                break;
            }

            const x_diff = curr.x - prev.x;
            const y_diff = curr.y - prev.y;

            const x_increasing = x_diff > 0;
            const x_decreasing = x_diff < 0;
            const y_increasing = y_diff > 0;
            const y_decreasing = y_diff < 0;

            while (i + 1 < this.sample_points.length) {
                let next = this.sample_points[i + 1];

                // Skip duplicates
                while (i + 1 < this.sample_points.length && next.x === curr.x && next.y === curr.y) {
                    i++;
                    next = this.sample_points[i + 1];
                }

                if (i + 1 === this.sample_points.length) {
                    break;
                }

                const next_x_diff = next.x - curr.x;
                const next_y_diff = next.y - curr.y;

                if ((x_increasing && next_x_diff <= 0) ||
                    (x_decreasing && next_x_diff >= 0) ||
                    (x_diff === 0 && ((y_increasing && next_y_diff <= 0) || (y_decreasing && next_y_diff >= 0)))) {
                    // Monotonicity breaks
                    break;
                }

                i++;
                prev = curr;
                curr = next;
            }

            monotone_segments.push([start, i]);
            start = i;
            i = i + 1;
        }

        // Step 2: Build line segments excluding zero-length segments
        const segment_lines = monotone_segments.map(([start, end]) => {
            const lines = [];
            let prevIndex = start;

            // Find the first non-duplicate point
            while (prevIndex < end && this.sample_points[prevIndex].x === this.sample_points[prevIndex + 1]?.x &&
                this.sample_points[prevIndex].y === this.sample_points[prevIndex + 1]?.y) {
                prevIndex++;
            }

            for (let j = prevIndex + 1; j <= end; j++) {
                const currIndex = j;

                // Skip duplicates
                while (currIndex <= end && this.sample_points[prevIndex].x === this.sample_points[currIndex].x &&
                    this.sample_points[prevIndex].y === this.sample_points[currIndex].y) {
                    j++;
                }

                if (j > end) {
                    break;
                }

                const p1 = this.sample_points[prevIndex];
                const p2 = this.sample_points[currIndex];

                // Skip zero-length segments
                if (p1.x === p2.x && p1.y === p2.y) {
                    prevIndex = currIndex;
                    continue;
                }

                lines.push([p1, p2]);
                prevIndex = currIndex;
            }

            for (let i = 0; i < lines.length; i++){
                if (lines[i][0].x < lines[i][1].x) return {
                    lines,
                    direction: 1
                }
                if (lines[i][0].x > lines[i][1].x) return {
                    lines,
                    direction: -1
                }
            }

            return {
                lines,
                direction: 1
            };
        });

        for (let i = 0; i < segment_lines.length - 1; i++) {
            const lines1 = segment_lines[i].lines;
            const x1_range = [lines1[0][0].x, lines1[lines1.length - 1][1].x];

            const [start1, increment1, l1_left, l1_right] = segment_lines[i].direction > 0 ? 
                [0, 1, 0, 1]
            :   [lines1.length - 1, -1, 1, 0];
            /*
                - where to start
                - what direction to traverse to next line
                - point with lower x (or y) index
                - point with higher x (or y) index
            */

            for (let j = i + 1; j < segment_lines.length; j++) {
                const lines2 = segment_lines[j].lines;
                const x2_range = [lines2[0][0].x, lines2[lines2.length - 1][1].x];
                let [start2, increment2, l2_left, l2_right] = segment_lines[j].direction > 0 ? 
                    [0, 1, 0, 1]
                :   [lines2.length - 1, -1, 1, 0];

                let current_line1 = start1;
                let current_line2 = start2;

                if (Math.min(...x2_range) > Math.max(x1_range) || Math.min(...x1_range) > Math.max(x2_range)){
                    continue;
                }

                while (current_line1 >= 0 && current_line1 < lines1.length && current_line2 >= 0 && current_line2 <= lines2.length){
                    if (lines1[current_line1][l1_right].x < lines2[current_line2][l2_left].x){
                        current_line1 += increment1;
                        continue;
                    }
                    if (lines2[current_line2][l2_right].x < lines1[current_line1][l1_left].x){
                        current_line2 += increment2;
                        continue;
                    }

                    const [intersects, _] = line_segments_intersect(lines1[current_line1], lines2[current_line2]);
                    if (intersects) {
                        if (j == i+1){
                            if (segment_lines[i].direction){
                                // letzter vom ersten segment
                                // erster vom zweiten segment
                                // größter x wert
                                if (
                                    current_line1 == lines1.length - 1
                                    && current_line2 == 0
                                ){
                                    break;
                                };
                            } else {
                                if (
                                    current_line2 == lines2.length - 1
                                    && current_line1 == 0
                                ){
                                    if (
                                        lines1[current_line1][l1_right].x < lines2[current_line2][l2_right].x
                                    ) {
                                        current_line1 += increment1;
                                    } else {
                                        current_line2 += increment2;
                                    }
                                    continue;
                                }
                            }
                        }

                        this.self_intersection_cache.self_intersects = true;
                        return true;
                    }

                    if (
                        lines1[current_line1][l1_right].x < lines2[current_line2][l2_right].x
                    ) {
                        current_line1 += increment1;
                    } else {
                        current_line2 += increment2;
                    }
                }
            }
        }

        this.self_intersection_cache.self_intersects = false;
        return false;
    } 
}