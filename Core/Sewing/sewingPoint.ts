import Point from "../StoffLib/point.js";
import { Sewing } from "./sewing.ts";
import { SewingLine } from "./sewingLine.ts";
import Line from "../StoffLib/line.js";

export class SewingPoint {
    public outdated: boolean;

    constructor(
        readonly sewing: Sewing,
        readonly points: Point[],
        public sewingLines: SewingLine[] = []
    ) {
        this.outdated = false;
    }

    representative(): Point {
        return this.points[0];
    }

    representative_for_line(line: Line): Point | null {
        return this.points.find((p) => p === line.p1 || p === line.p2) || null;
    }

    is(point: Point | SewingPoint): boolean {
        if (point instanceof SewingPoint) {
            return this.is(point.representative());
        }
        return this.points.some((p) => p === point);
    }

    adjacent_lines(): Line[] {
        return [...new Set(this.points.flatMap((p) => p.get_lines()))];
    }

    is_adjacent(thing: SewingLine | Line | Point | SewingPoint): boolean {
        if (thing instanceof SewingLine) {
            return thing.is_adjacent(this);
        }
        if (thing instanceof Line) {
            return this.representative_for_line(thing) !== null;
        }
        if (thing instanceof SewingPoint) {
            return !thing.is(this) && this.sewingLines.some((l) => l.has_endpoint(thing));
        }
        return !this.is(thing) && this.adjacent_lines().some(l => l.has_endpoint(thing));
    }

    merge(point: SewingPoint | Point): SewingPoint {
        return this.sewing.merge_points(this, point);
    }

    get_points(): Point[] {
        return this.points;
    }

    get_lines(): Line[] {
        return this.sewingLines.flatMap((l) => l.get_lines());
    }

    get_sewing_lines(): SewingLine[] {
        return this.sewingLines;
    }

    mark_as_inaccessible() { }
}