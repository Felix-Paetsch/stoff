import { SewingLine } from "./sewingLine";
import { Line } from "../StoffLib/line";
import { Point } from "../StoffLib/point";
import { Sketch } from "../StoffLib/sketch";
import { SewingPoint } from "./sewingPoint";
import { merge_lines_vertically } from "./line_methods/merge_lines/vertically";
import { FaceEdge } from "./faceEdge";
import { merge_lines_horizontally } from "./line_methods/merge_lines/horizontally";
import { StackLine } from "./line_methods/merge_lines/stackLine";
import { cutRenderer } from "../Render/render_step/cut";
import { foldRenderer } from "../Render/render_step/fold";
import { ironRenderer } from "../Render/render_step/iron";
import { sewRenderer } from "../Render/render_step/sew";
import { RendererCache } from "../Render/cache";
import { highlightRenderer } from "../Render/render_step/highlight";
import { FaceAtlas } from "../StoffLib/faces/faceAtlas";
import { Renderer } from "../Render/renderer";
import { devRenderer } from "../Render/render_step/dev";
import assert from "assert";
import { create_sewing_line } from "./line_methods/create_sewing_line";

export class Sewing {
    readonly all_time_sewing_points: SewingPoint[] = [];
    public sewing_points: SewingPoint[] = [];

    public sewing_lines: SewingLine[] = [];
    readonly faceAtlases: Map<Sketch, FaceAtlas> = new Map();
    public renderers: Renderer[] = [];
    readonly renderCache = new RendererCache();

    public data: any = {};

    constructor(
        readonly sketches: Sketch[]
    ) {
        for (const sketch of this.sketches) {
            this.faceAtlases.set(sketch, FaceAtlas.from_lines(sketch.get_lines()));
        }
        this.renderers.push(devRenderer(this));
    }

    __register_point(pt: SewingPoint) {
        this.all_time_sewing_points.push(pt);
        this.sewing_points.push(pt);
    }

    __register_line(ln: SewingLine) {
        this.sewing_lines.push(ln);
    }

    __unregister_point(pt: SewingPoint) {
        this.sewing_points = this.sewing_points.filter(p => p != pt);
    }

    __unregister_line(ln: SewingLine) {
        this.sewing_lines = this.sewing_lines.filter(l => l != ln);
    }

    is_sewing_point(point: Point | SewingPoint): boolean {
        return this.sewing_points.some((p) => p.is(point));
    }

    has_sewing_line(line: Line | SewingLine): boolean {
        return this.sewing_lines.some((l) => l.contains(line));
    }

    sewing_point(point: Point | SewingPoint): SewingPoint {
        if (point instanceof SewingPoint) {
            assert(this.sewing_points.some(p => p.is(point)));
            return point;
        }
        const find = this.sewing_points.find((p) => p.is(point));
        if (find) {
            return find;
        }
        return new SewingPoint(this, [point]);
    }

    merge_points(point1: SewingPoint, point2: SewingPoint): SewingPoint;
    merge_points(...points: (SewingPoint | Point)[]): SewingPoint;
    merge_points(...points: (SewingPoint | Point)[]): SewingPoint {
        const sewing_points = points.map((p) => this.sewing_point(p));
        const pts = [...new Set(sewing_points.flatMap((p) => p.points))];

        for (const oldPoint of sewing_points) {
            oldPoint.__mark_oudated();
        }

        return new SewingPoint(this, pts);
    }

    merge_lines(line1: SewingLine, line2: SewingLine): SewingLine;
    merge_lines(...lines: (SewingLine | Line)[]): SewingLine;
    merge_lines(...lines: (SewingLine | Line)[]): SewingLine {
        return merge_lines_horizontally(this, ...this.order_by_endpoints(lines));
    }

    sewing_line(line: Line): SewingLine {
        const existingLine = this.sewing_lines.find((l) => l.contains(line));
        return existingLine || create_sewing_line(this, line);
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

        if (sl.length < 3) {
            return sl;
        }

        const ordered_lines = [sl.pop()!];
        const endpoints = ordered_lines[0].get_endpoints();
        outer: while (sl.length > 0) {
            for (let i = 0; i < sl.length; i++) {
                if (sl[i].has_endpoint(endpoints[1])) {
                    ordered_lines.push(sl[i]);
                    endpoints[1] = sl[i].other_endpoint(endpoints[endpoints.length - 1]);
                    sl.splice(i, 1);
                    continue outer
                }
                if (sl[i].has_endpoint(endpoints[0])) {
                    ordered_lines.unshift(sl[i]);
                    endpoints[0] = sl[i].other_endpoint(endpoints[0]);
                    sl.splice(i, 1);
                    continue outer
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
        if (this.renderers.length > 0 && this.renderers[this.renderers.length - 1].render_step == "cut") {
            (this.renderers[this.renderers.length - 1] as ReturnType<typeof cutRenderer>).add_cut_line(
                line
            );
        } else {
            this.renderers.push(cutRenderer(this, [line] as Line[]));
        }

        const sline = create_sewing_line(this, line);
        return sline;
    }

    fold(fold_line: Line | SewingLine, rightOnLeft: boolean = false) {
        const line: SewingLine = fold_line instanceof SewingLine ? fold_line : this.sewing_line(fold_line);

        const left = line.face_carousel.left_edges();
        const right = line.face_carousel.right_edges();
        if (rightOnLeft) {
            line.face_carousel.fold(left.concat(right), []);
        } else {
            line.face_carousel.fold([], right.concat(left));
        }

        this.renderers.push(foldRenderer(this, line));
        return line;
    }

    iron(line: SewingLine, left: FaceEdge[], right: FaceEdge[]): void {
        line.face_carousel.fold(left, right);
        this.renderers.push(ironRenderer(this, line));
    }

    sew(guide: SewingLine, sewOn: StackLine[]) {
        const res = merge_lines_vertically(this, guide, sewOn);
        this.renderers.push(sewRenderer(this, res));
        return res;
    }

    highlight(...objects: (SewingLine | SewingPoint)[]) {
        this.renderers.push(highlightRenderer(this, objects));
    }

    todo(what: string, args: any) { }

    dev_render() {
        this.renderers.push(devRenderer(this));
    }

    // For debugging mostly
    copy(): Sewing {
        const sk = new Sewing(this.sketches);

        sk.sewing_lines = [...this.sewing_lines];
        sk.sewing_points = [...this.sewing_points];
        sk.renderers = this.renderers.map(r => r.copy(sk));

        return sk;
    }
}
