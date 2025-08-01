import { SewingLine } from "./sewingLine";
import { Line } from "../StoffLib/line.js";
import Point from "../StoffLib/point.js";
import Sketch from "../StoffLib/sketch.js";
import { SewingPoint } from "./sewingPoint";

export class Sewing {
    public sewing_lines: SewingLine[];
    private sewing_points: SewingPoint[];

    constructor(
        private sketches: Sketch[]
    ) {
        this.sewing_lines = [];
        this.sewing_points = [];
    }

    // Steps
    cut(line: Line): SewingLine;
    cut(lines: Line[]): SewingLine[];
    cut(lines: Line | Line[]) {
        if (!Array.isArray(lines)) {
            return this.primitive_sewing_line(lines);
        }
        return lines.map((l) => this.primitive_sewing_line(l));
    }

    primitive_sewing_line(line: Line): SewingLine {
        // assuming it doesnt exist already
        const sewingLine = new SewingLine(
            this,
            [{
                line: line,
                has_sewing_line_orientation: true,
                has_sewing_line_handedness: true
            }],
        );

        this.sewing_lines.push(sewingLine);
        line.get_endpoints().forEach((p) => p.sewingLines.push(sewingLine));
        return sewingLine;
    }

    sewing_point(point: Point | SewingPoint): SewingPoint {
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

    merge_points(point1: SewingPoint, point2: SewingPoint): SewingPoint;
    merge_points(...points: (SewingPoint | Point)[]): SewingPoint;
    merge_points(...points: (SewingPoint | Point)[]): SewingPoint {
        const sewing_points = points.map((p) => this.sewing_point(p));
        const pts = [...new Set(sewing_points.flatMap((p) => p.points))];
        const newSewingPoint = new SewingPoint(this, pts);

        const allSewingLines = [...new Set(sewing_points.flatMap((p) => p.sewingLines))];
        newSewingPoint.sewingLines = allSewingLines;

        for (const oldPoint of sewing_points) {
            oldPoint.outdated = true;
            const index = this.sewing_points.indexOf(oldPoint);
            if (index > -1) {
                this.sewing_points.splice(index, 1);
            }
        }

        this.sewing_points.push(newSewingPoint);
        return newSewingPoint;
    }

    merge_lines(line1: SewingLine, line2: SewingLine): SewingLine;
    merge_lines(...lines: (SewingLine | Line)[]): SewingLine;
    merge_lines(...lines: (SewingLine | Line)[]): SewingLine {
        const sewingLines: SewingLine[] = lines.map((l) => l instanceof Line ? this.sewing_line(l) : l);
        let primary = [...sewingLines[0].primary_component];
        let other = [...sewingLines[0].other_components];
        let lastLine = sewingLines[0];
        let lineHasCorrectOrientation = true;
        let lineHasCorrectHandedness = true;

        for (const line of sewingLines) {
            line.outdated = true;
            lineHasCorrectOrientation = lastLine.same_orientation(line) === lineHasCorrectOrientation;
            lineHasCorrectHandedness = lastLine.same_handedness(line) === lineHasCorrectHandedness;
            !lineHasCorrectOrientation && line.set_orientation(lastLine.p1, lastLine.p2);
            !lineHasCorrectHandedness && line.set_handedness(lastLine.right_handed);

            primary = primary.concat(line.primary_component);
            other = other.concat(line.other_components);

            !lineHasCorrectOrientation && line.set_orientation(lastLine.p1, lastLine.p2);
            !lineHasCorrectHandedness && line.set_handedness(lastLine.right_handed);

            const index = this.sewing_lines.indexOf(line);
            if (index > -1) {
                this.sewing_lines.splice(index, 1);
            }

            line.get_endpoints().forEach((endpoint) => {
                const lineIndex = endpoint.sewingLines.indexOf(line);
                if (lineIndex > -1) {
                    endpoint.sewingLines.splice(lineIndex, 1);
                }
            });
        }

        const newSewingLine = new SewingLine(this, primary, other);
        // This is non-circular
        newSewingLine.get_endpoints().forEach((endpoint) => {
            endpoint.sewingLines.push(newSewingLine);
        });
        this.sewing_lines.push(newSewingLine);
        return newSewingLine;
    }

    sewing_line(lines: Line): SewingLine {
        const existingLine = this.sewing_lines.find((l) => l.contains(lines));
        return existingLine || this.primitive_sewing_line(lines);
    }

    get_lines() {
        return this.sewing_lines.flatMap((l) => l.get_lines());
    }

    get_points() {
        return this.sewing_points.flatMap((p) => p.get_points());
    }

    get_sewing_lines() {
        return this.sewing_lines
    }

    get_sewing_points() {
        return this.sewing_points
    }

    // Operations
    fold(fold_line: Line, left_boundary: Line[], right_boundary: Line[], orientation: boolean): void {
        // Implementation to be added
    }

    iron(line: Line, layers_left: number, layers_right: number, orientation: boolean): void {
        // Implementation to be added
    }

    stack(linesWithOptionalConfig: any): void {
        // Implementation to be added
    }

    sew(lines: Line[], attributes: any): void {
        // Implementation to be added
    }

    stack_sew(): void {
        // Implementation to be added
    }
    // Helpful with argument passing
}