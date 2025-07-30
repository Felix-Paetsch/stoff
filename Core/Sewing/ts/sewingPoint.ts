export class SewingPoint {
    constructor(sewing, points) {
        this.sewing = sewing;
        this.points = points;
    }

    representative() {
        return this.points[0];
    }

    is(point) {
        if (point instanceof SewingPoint) {
            return this.is(point.representative());
        }
        return this.points.some((p) => p.is(point));
    }
}
