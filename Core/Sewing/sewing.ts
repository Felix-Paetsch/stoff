import { SewingLine } from "./sewingLine.ts";
import { Line } from "../StoffLib/line.js";
import { SewingPoint } from "./sewingPoint.js";

export class Sewing {
    constructor(sketchArr) {
        this.sketchArray = sketchArr;
        this.minimal_sewing_lines = [];
        this.sewing_points = [];
    }

    // Steps
    cut(lines) {
        if (!Array.isArray(lines)) {
            return this.primitive_sewing_line(lines);
        }
        return lines.map((l) => this.primitive_sewing_line(l));
    }

    primitive_sewing_line(line) {
        // assuming it doesnt exist already
        const sewingLine = new SewingLine(
            this,
            [line],
            [this.sewing_point(line.p1), this.sewing_point(line.p2)]
        );

        this.minimal_sewing_lines.push(sewingLine);
        return sewingLine;
    }

    sewing_point(point) {
        if (point instanceof SewingPoint) {
            return point;
        }
        const find = this.sewing_points.find((p) => p.is(point));
        if (find) {
            return find;
        }
        const sewingPoint = new SewingPoint(this, [point]);
        this.sewing_points.push(sewingPoint);
        return sewingPoint;
    }

    sewing_line(lines) {
        const primitive_lines = [];
        for (const line of lines) {
            if (line instanceof Line) {
                const containingLine = this.minimal_sewing_lines.find((l) =>
                    l.contains(line)
                );
                if (containingLine) {
                    primitive_lines.push(containingLine);
                } else {
                    primitive_lines.push(this.primitive_sewing_line(line));
                }
            } else if (line instanceof SewingLine) {
                primitive_lines.push(...line.primitive_sewing_lines());
            }
        }

        const unique_lines = [...new Set(primitive_lines)];

        return unique_lines;
    }

    fold(fold_line, left_boundary, right_boundary, orientation) {}

    iron(line, layers_left, layers_right, orientation) {}

    stack(linesWithOptionalConfig) {}

    sew(lines, attributes) {}

    stack_sew() {}
    // Helpful with argument passing
}

// register_collection_methods(Sewing);
