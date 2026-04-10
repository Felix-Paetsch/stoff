import { Line } from "../../line";
import { Point } from "../../point";
import { SketchElement, StoffObjectData } from "../../types";

export type LineFilter =
    | Line
    | Line[]
    | ((line: Line) => boolean)
    | Point
    | true
    | StoffObjectData;
export type PointFilter =
    | Point
    | Point[]
    | ((pt: Point) => boolean)
    | Line
    | Line[]
    | true
    | StoffObjectData;

export function not(filter: LineFilter): LineFilter;
export function not(filter: PointFilter): PointFilter;
export function not(
    filter: PointFilter | LineFilter,
): PointFilter | LineFilter {
    return (o: SketchElement) => {
        if (o instanceof Point) {
            return !filterPoint(filter as PointFilter, o);
        }

        return !filterLine(filter as LineFilter, o);
    };
}

export function and(...filter: LineFilter[]): LineFilter;
export function and(...filter: PointFilter[]): PointFilter;
export function and(
    ...filter: (PointFilter | LineFilter)[]
): PointFilter | LineFilter {
    return (o: SketchElement) => {
        if (o instanceof Point) {
            return filter.every((f) => filterPoint(f as PointFilter, o));
        }

        return filter.every((f) => filterLine(f as LineFilter, o));
    };
}

export function or(...filter: LineFilter[]): LineFilter;
export function or(...filter: PointFilter[]): PointFilter;
export function or(
    ...filter: (PointFilter | LineFilter)[]
): PointFilter | LineFilter {
    return (o: SketchElement) => {
        if (o instanceof Point) {
            return filter.some((f) => filterPoint(f as PointFilter, o));
        }

        return filter.some((f) => filterLine(f as LineFilter, o));
    };
}

export function filterLine(filter: LineFilter, line: Line) {
    if (filter instanceof Line) {
        return line === filter;
    }
    if (filter instanceof Point) {
        return line.has_endpoint(filter);
    }
    if (filter === true) {
        return true;
    }
    if (filter instanceof Array) {
        return filter.includes(line);
    }
    if (typeof filter == "function") {
        return filter(line);
    }
    return Object.keys(filter).every((k) => line.data[k] === filter[k]);
}

export function filterPoint(filter: PointFilter, pt: Point) {
    if (filter instanceof Point) {
        return pt === filter;
    }
    if (filter instanceof Line) {
        return filter.has_endpoint(pt);
    }
    if (filter === true) {
        return true;
    }
    if (filter instanceof Array) {
        if (filter.length === 0) return false;
        if (filter[0] instanceof Point) {
            return (filter as Point[]).includes(pt);
        }
        return (filter as Line[]).some((line) => line.has_endpoint(pt));
    }
    if (typeof filter == "function") {
        return filter(pt);
    }
    return Object.keys(filter).every((k) => pt.data[k] === filter[k]);
}
