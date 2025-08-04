import { SewingLine } from "./sewingLine";
import { Line } from "../StoffLib/line.js";
import Point from "../StoffLib/point.js";
import Sketch from "../StoffLib/sketch.js";
import { SewingPoint } from "./sewingPoint";
import FaceAtlas from "../PatternLib/faces/faceAtlas.js";
import { FaceCarousel } from "./faceCarousel.js";

export class Sewing {
    public sewing_lines: SewingLine[];
    public sewing_points: SewingPoint[];
    private faceAtlases: Map<Sketch, FaceAtlas> = new Map();

    constructor(
        private sketches: Sketch[]
    ) {
        this.sewing_lines = [];
        this.sewing_points = [];
        for (const sketch of this.sketches) {
            this.faceAtlases.set(sketch, FaceAtlas.from_lines(sketch.get_lines(), sketch));
        }
    }

    is_sewing_point(point: Point | SewingPoint): boolean {
        return this.sewing_points.some((p) => p.is(point));
    }

    has_sewing_line(line: Line | SewingLine): boolean {
        return this.sewing_lines.some((l) => l.contains(line));
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
        if (lines.length === 1) {
            return lines[0] instanceof SewingLine ? lines[0] : this.sewing_line(lines[0]);
        }

        if (lines.length > 2) {
            return this.merge_lines(
                this.merge_lines(lines[0], lines[1]),
                ...lines.slice(2)
            );
        }

        const line1: SewingLine = lines[0] instanceof Line ? this.sewing_line(lines[0]) : lines[0];
        const line2: SewingLine = lines[1] instanceof Line ? this.sewing_line(lines[1]) : lines[1];

        line2.set_orientation(line1);
        line2.set_handedness(line1);

        // Combine components
        const primary = line1.primary_component.concat(line2.primary_component).map(
            (component) => ({
                ...component,
                start_position_at_sewing_line: SewingLine.position_at_merged_sewing_line(line1, line2, true, component.start_position_at_sewing_line),
                end_position_at_sewing_line: SewingLine.position_at_merged_sewing_line(line1, line2, true, component.end_position_at_sewing_line)
            })
        );
        const other = line1.other_components.concat(line2.other_components).map(
            (component) => ({
                ...component,
                start_position_at_sewing_line: SewingLine.position_at_merged_sewing_line(line1, line2, false, component.start_position_at_sewing_line),
                end_position_at_sewing_line: SewingLine.position_at_merged_sewing_line(line1, line2, false, component.end_position_at_sewing_line)
            })
        );

        const newSewingLine = new SewingLine(
            this,
            primary,
            other,
            null as any
        );

        (newSewingLine as any).face_carousel = FaceCarousel.merge_horizontally(newSewingLine, line1.face_carousel, line2.face_carousel);

        // Remove lines from sewing_lines array
        line1.outdated = true;
        const line1Index = this.sewing_lines.indexOf(line1);
        if (line1Index > -1) {
            this.sewing_lines.splice(line1Index, 1);
        }

        line2.outdated = true;
        const line2Index = this.sewing_lines.indexOf(line2);
        if (line2Index > -1) {
            this.sewing_lines.splice(line2Index, 1);
        }

        // Remove lines from their endpoints
        line1.get_endpoints().forEach((endpoint) => {
            const lineIndex = endpoint.sewingLines.indexOf(line1);
            if (lineIndex > -1) {
                endpoint.sewingLines.splice(lineIndex, 1);
            }
        });

        line2.get_endpoints().forEach((endpoint) => {
            const lineIndex = endpoint.sewingLines.indexOf(line2);
            if (lineIndex > -1) {
                endpoint.sewingLines.splice(lineIndex, 1);
            }
        });

        // This is non-circular
        newSewingLine.get_endpoints().forEach((endpoint) => {
            endpoint.sewingLines.push(newSewingLine);
        });
        this.sewing_lines.push(newSewingLine);
        return newSewingLine;
    }

    sewing_line(line: Line): SewingLine {
        const existingLine = this.sewing_lines.find((l) => l.contains(line));
        return existingLine || SewingLine.from_line(this, line);
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

    // Faces
    adjacent_faces(line: Line): ReturnType<FaceAtlas["adjacent_faces"]> {
        const atlas = this.faceAtlases.get(line.get_sketch())!;
        return atlas.adjacent_faces(line);
    }

    // Operations
    cut(line: Line): SewingLine;
    cut(lines: Line[]): SewingLine[];
    cut(line: Line | Line[]) {
        if (Array.isArray(line)) {
            return line.map((l) => this.cut(l));
        }
        return SewingLine.from_line(this, line);
    }

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