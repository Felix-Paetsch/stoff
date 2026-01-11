import { Point } from "../point";
import { Line } from "../line";

export type LineFilter = Line | Line[] | ((line: Line) => boolean) | Point | null;
export type PointFilter = Point | Point[] | ((pt: Point) => boolean) | Line | Line[] | null;

export function filterLine(filter: LineFilter, line: Line) {
    if (filter instanceof Line) {
        return line === filter;
    }
    if (filter instanceof Point) {
        return line.has_endpoint(filter);
    }
    if (filter === null) {
        return true;
    }
    if (filter instanceof Array) {
        return filter.includes(line);
    }
    return filter(line);
}

export function filterPoint(filter: PointFilter, pt: Point) {
    if (filter instanceof Point) {
        return pt === filter;
    }
    if (filter instanceof Line) {
        return filter.has_endpoint(pt);
    }
    if (filter === null) {
        return true;
    }
    if (filter instanceof Array) {
        if (filter.length === 0) return false;
        if (filter[0] instanceof Point) {
            return (filter as Point[]).includes(pt);
        }
        return (filter as Line[]).some((line) => line.has_endpoint(pt));
    }
    return filter(pt);
}
