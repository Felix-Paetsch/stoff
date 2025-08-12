import { SewingLine } from "./sewingLine";
import { Line } from "../StoffLib/line.js";
import Point from "../StoffLib/point.js";
import Sketch from "../StoffLib/sketch.js";
import { SewingPoint } from "./sewingPoint";
import FaceAtlas from "../PatternLib/faces/faceAtlas.js";
import { merge_lines_vertically } from "./mergeLines/vertically.js";
import { FaceEdge } from "./faceEdge.js";
import { merge_lines_horizontally } from "./mergeLines/horizontally.js";
import { StackLine } from "./mergeLines/stackLine.js";

export class Sewing {
    public sewing_lines: SewingLine[];
    public sewing_points: SewingPoint[];
    private faceAtlases: Map<Sketch, FaceAtlas> = new Map();

    constructor(
        readonly sketches: Sketch[]
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
        return merge_lines_horizontally(this, ...this.order_by_endpoints(lines));
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

    order_by_endpoints(lines: (SewingLine | Line)[]) {
        // Removing dublicates
        const sl: SewingLine[] = [];
        for (const l of lines) {
            const ln = l instanceof SewingLine ? l : this.sewing_line(l);
            if (sl.includes(ln)) continue;
            sl.push(ln);
        }

        if (sl.length == 0) return [];
        const ordered_lines = [sl.pop()!];
        const endpoints = ordered_lines[0].get_endpoints();
        while (sl.length > 0) {
            for (let i = 0; i < sl.length; i++) {
                if (sl[i].has_endpoint(endpoints[1])) {
                    ordered_lines.push(sl[i]);
                    sl.slice(i, 1);
                    endpoints[1] = sl[i].other_endpoint(endpoints[endpoints.length - 1]);
                    break
                }
                if (sl[i].has_endpoint(endpoints[0])) {
                    ordered_lines.unshift(sl[i]);
                    sl.slice(i, 1);
                    endpoints[0] = sl[i].other_endpoint(endpoints[0])
                }
            }
            throw new Error("Lines can not be ordered.");
        }

        return ordered_lines
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

    fold(fold_line: Line | SewingLine, rightOnLeft: boolean = false): void {
        const line: SewingLine = fold_line instanceof SewingLine ? fold_line : this.sewing_line(fold_line);
        const left = line.face_carousel.left_edges();
        const right = line.face_carousel.right_edges();
        if (rightOnLeft) return line.face_carousel.fold(left.concat(right), []);
        return line.face_carousel.fold([], right.concat(left));
    }

    iron(line: SewingLine, left: FaceEdge[], right: FaceEdge[]): void {
        return line.face_carousel.fold(left, right);
    }

    stack(guide: SewingLine, sewOn: StackLine[]): void {
        // Display and logging implementation
    }

    sew(guide: SewingLine, sewOn: StackLine[]): void {
        merge_lines_vertically(this, guide, sewOn);
    }
}