import { Point } from "../StoffLib/point.js";
import { Sewing } from "./sewing.ts";
import { SewingLine } from "./sewingLine.ts";
import { Line } from "../StoffLib/line.js";
import { assert } from "../assert.ts";

export class SewingPoint {
    public _is_outdated: boolean = false;
    public adjacent_lines: SewingLine[] = [];
    public _update_to: SewingPoint | null = null;

    constructor(
        private sewing: Sewing,
        public points: Point[],
    ) {
        for (const p of this.points) {
            assert(this.sewing.sketches.includes(p.get_sketch()));
            assert(this.sewing.sewing_points.every(sp => !sp.is(p)));
        }

        assert(this.points.length > 0);
        sewing.__register_point(this);
    }

    __register_line(l: SewingLine) {
        this.adjacent_lines.push(l);
    }

    get_sewing() {
        assert(!this._is_outdated, "SewingPoint is outdated");
        return this.sewing;
    }

    representative(): Point {
        assert(!this._is_outdated, "SewingPoint is outdated");
        return this.points[0]!;
    }

    representative_for_line(line: Line): Point {
        assert(!this._is_outdated, "SewingPoint is outdated");
        const res = this.points.find((p) => p === line.p1 || p === line.p2);
        if (!res) {
            throw new Error("Line isn't adjacent to sewing point");
        }
        return res;
    }

    is(point: Point | SewingPoint): boolean {
        assert(!this._is_outdated, "SewingPoint is outdated");
        if (point instanceof SewingPoint) {
            return this.is(point.representative());
        }
        return this.points.some((p) => p === point);
    }

    is_adjacent(thing: SewingLine | Line | Point | SewingPoint): boolean {
        assert(!this._is_outdated, "SewingPoint is outdated");
        if (thing instanceof SewingLine) {
            return thing.is_adjacent(this);
        }
        if (thing instanceof Line) {
            return this.representative_for_line(thing) !== null;
        }
        if (thing instanceof SewingPoint) {
            return !thing.is(this) && this.adjacent_lines.some((l) => l.has_endpoint(thing));
        }
        return !this.is(thing) && this.adjacent_lines.some(l => l.has_endpoint(thing));
    }

    merge(point: SewingPoint | Point): SewingPoint {
        assert(!this._is_outdated, "SewingPoint is outdated");
        return this.sewing.merge_points(this, point);
    }

    get_points(): Point[] {
        assert(!this._is_outdated, "SewingPoint is outdated");
        return this.points;
    }

    get_lines(): Line[] {
        assert(!this._is_outdated, "SewingPoint is outdated");
        return this.adjacent_lines.flatMap((l) => l.get_lines());
    }

    updated(): SewingPoint {
        if (!this._is_outdated) return this;
        if (!this._update_to) {
            throw new Error("Sewing line can't be updated");
        }
        return this._update_to.updated()
    }

    __mark_oudated(update_to?: SewingPoint | null) {
        this.adjacent_lines.forEach(l => l.__mark_outdated);
        if (this._is_outdated) throw new Error("Point already is outdated!");
        this.sewing.__unregister_point(this);
        this._is_outdated = true;
        if (typeof update_to !== "undefined") {
            this._update_to = update_to;
        }
    }
}
