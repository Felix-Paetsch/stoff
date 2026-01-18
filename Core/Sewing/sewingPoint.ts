import { Point } from "../StoffLib/point.js";
import { Sewing } from "./sewing.ts";
import { SewingLine } from "./sewingLine.ts";
import { Line } from "../StoffLib/line.js";
import { assert } from "../assert.ts";

export class SewingPoint {
    public _is_outdated: boolean = false;

    constructor(
        readonly sewing: Sewing,
        public points: Point[],
    ) {
        for (const p of this.points) {
            assert(this.sewing.sketches.includes(p.get_sketch()));
            assert(this.sewing.sewing_points.every(sp => !sp.is(p)));
        }

        assert(this.points.length > 0);
        sewing.__register_point(this);
    }

    get sewing_lines(): SewingLine[] {
        return this.sewing.sewing_lines.filter(sl => {
            return sl.p1.is(this) || sl.p2.is(this);
        });
    }

    representative(): Point {
        assert(!this._is_outdated, "SewingPoint is outdated");
        return this.points[0];
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

    adjacent_lines(): Line[] {
        assert(!this._is_outdated, "SewingPoint is outdated");
        return [...new Set(this.points.flatMap((p) => p.get_adjacent_lines()))];
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
            return !thing.is(this) && this.sewing_lines.some((l) => l.has_endpoint(thing));
        }
        return !this.is(thing) && this.adjacent_lines().some(l => l.has_endpoint(thing));
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
        return this.sewing_lines.flatMap((l) => l.get_lines());
    }
    updated(): SewingPoint {
        if (!this._is_outdated) return this;
        const candiate = this.sewing.sewing_points.find((p) => p.is(this))!
        if (!candiate || !this.points.every(p => candiate.is(p))) {
            throw new Error("Sewing point can't be updated");
        }
        return candiate;
    }

    __mark_oudated() {
        if (this._is_outdated) throw new Error("Point already is outdated!");
        this._is_outdated = true;
        this.sewing.__unregister_point(this);
    }
}
