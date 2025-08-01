import Point from "../StoffLib/point.js";
import { Sewing } from "./sewing.ts";
import { SewingLine } from "./sewingLine.ts";
import { Line } from "../StoffLib/line.js";

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

    is(point: Point | SewingPoint): boolean {
        if (point instanceof SewingPoint) {
            return this.is(point.representative());
        }
        return this.points.some((p) => p === point);
    }

    merge(point: SewingPoint): SewingPoint {
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
}