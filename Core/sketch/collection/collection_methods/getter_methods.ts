import { sketch_element_collection_as_array } from "..";
import { Line } from "../../line";
import { Point } from "../../point";
import { Sketch } from "../../sketch";
import { SketchElement, SketchElementCollection } from "../../types";
import { filterLine, filterPoint, LineFilter, PointFilter } from "./filter";

export function unique<T extends SketchElement>(
    ec: SketchElementCollection<T>,
): T[] {
    const nec = sketch_element_collection_as_array(ec);
    return nec.filter((value, index) => nec.indexOf(value) === index);
}

export function get_lines(
    ec: SketchElementCollection,
    filter: LineFilter = true,
): Line[] {
    const nec = sketch_element_collection_as_array(ec);
    return nec.filter(
        (e) => e instanceof Line && filterLine(filter, e as Line),
    ) as Line[];
}

export function get_line(
    ec: SketchElementCollection,
    filter: LineFilter = true,
): Line | null {
    return get_lines(ec, filter)[0] ?? null;
}

export function get_points(
    ec: SketchElementCollection,
    filter: PointFilter = true,
): Point[] {
    const nec = sketch_element_collection_as_array(ec);
    return nec.filter(
        (e) => e instanceof Point && filterPoint(filter, e as Point),
    ) as Point[];
}

export function get_point(
    ec: SketchElementCollection,
    filter: PointFilter = true,
): Point | null {
    return get_points(ec, filter)[0] ?? null;
}

export function get_sketch(ec: SketchElementCollection): Sketch {
    const els = sketch_element_collection_as_array(ec);
    if (els.length == 0) {
        return new Sketch();
    }
    return els[0]!.sketch;
}

export function group_by_key(ec: SketchElementCollection, key: string) {
    const pts = points_by_key(ec, key);
    const lns = lines_by_key(ec, key);
    return {
        points: pts,
        lines: lns,
    };
}

export function lines_by_key(ec: SketchElementCollection, key: string) {
    return get_lines(ec).reduce((acc: Record<string, Line[]>, line: Line) => {
        const groupKey = line.data[key] !== undefined ? line.data[key] : "_";
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(line);
        return acc;
    }, {});
}

export function points_by_key(ec: SketchElementCollection, key: string) {
    return get_points(ec).reduce((acc: Record<string, Point[]>, pt: Point) => {
        const groupKey = pt.data[key] !== undefined ? pt.data[key] : "_";
        if (!acc[groupKey]) {
            acc[groupKey] = [];
        }
        acc[groupKey].push(pt);
        return acc;
    }, {});
}

export type FindPosition =
    | "collection_points_any_lines"
    | "collection_points_collection_lines"
    | "any_points_collection_lines";

export type PointsBetweenLinesArgs = {
    line1: LineFilter;
    line2: LineFilter;
    point: PointFilter;
    where: FindPosition;
};

export function get_points_between_lines(
    ec: SketchElementCollection,
    args: Partial<PointsBetweenLinesArgs> = {},
): Point[] {
    const nec = sketch_element_collection_as_array(ec);
    const sketch = get_sketch(nec);

    const where: FindPosition = args.where ?? "any_points_collection_lines";

    if (!sketch && where !== "collection_points_collection_lines") {
        throw new Error("Sketch of collection could not be found!");
    }

    let lines: Line[] = get_lines(nec);
    let points: Point[] = get_points(nec);

    if (where == "collection_points_any_lines") {
        lines = sketch!.lines();
    }
    if (where == "any_points_collection_lines") {
        points = sketch!.points();
    }

    const testedFilters: [boolean, boolean][] = lines.map((l) => [
        filterLine(args.line1 ?? true, l),
        filterLine(args.line2 ?? true, l),
    ]);

    let result: SketchElementCollection<Point> = [];
    for (let i = 0; i < lines.length - 1; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            const p = lines[i]!.common_endpoint(lines[j]!);
            if (
                p &&
                ((testedFilters[i]![0] && testedFilters[j]![1]) ||
                    (testedFilters[i]![1] && testedFilters[j]![0])) &&
                points.includes(p) &&
                !result.includes(p) &&
                filterPoint(args.point ?? true, p)
            ) {
                result.push(p);
            }
        }
    }

    return result;
}

export function get_point_between_lines(
    ec: SketchElementCollection,
    args: Partial<PointsBetweenLinesArgs> = {},
): Point | null {
    return get_points_between_lines(ec, args)[0] ?? null;
}

export type LinesBetweenPointsArgs = {
    point1: PointFilter;
    point2: PointFilter;
    line: LineFilter;
    where: FindPosition;
};

export function get_lines_between_points(
    ec: SketchElementCollection,
    args: Partial<LinesBetweenPointsArgs> = {},
): Line[] {
    const nec = sketch_element_collection_as_array(ec);
    const sketch = get_sketch(nec);

    const where: FindPosition = args.where ?? "any_points_collection_lines";

    if (!sketch && where !== "collection_points_collection_lines") {
        throw new Error("Sketch of collection not specified!");
    }

    let lines: Line[] = get_lines(ec);
    let points: Point[] = get_points(ec);

    if (where == "collection_points_any_lines") {
        lines = sketch!.lines();
    }
    if (where == "any_points_collection_lines") {
        points = sketch!.points();
    }

    const testedFilters: [boolean, boolean][] = points.map((p) => [
        filterPoint(args.point1 ?? true, p),
        filterPoint(args.point2 ?? true, p),
    ]);

    let result: SketchElementCollection<Line> = [];
    const line_filter = (l: Line) =>
        lines.includes(l) && filterLine(args.line ?? true, l);

    for (let i = 0; i < points.length - 1; i++) {
        for (let j = i + 1; j < points.length; j++) {
            if (
                (testedFilters[i]![0] && testedFilters[j]![1]) ||
                (testedFilters[i]![1] && testedFilters[j]![0])
            ) {
                const common = points[i]!.common_lines(points[j]!).filter(
                    line_filter,
                );
                result.push(...common);
            }
        }
    }

    return result;
}

export function get_line_between_points(
    ec: SketchElementCollection,
    args: Partial<LinesBetweenPointsArgs> = {},
): Line | null {
    return get_lines_between_points(ec, args)[0] ?? null;
}

export function get_common_points(
    a: SketchElementCollection,
    b: SketchElementCollection,
): Point[] {
    const ptsa = get_points(a);
    const ptsb = get_points(b);

    return ptsa.filter((p) => ptsb.includes(p));
}

export function get_common_lines(
    a: SketchElementCollection,
    b: SketchElementCollection,
): Line[] {
    const lnsa = get_lines(a);
    const lnsb = get_lines(b);

    return lnsa.filter((p) => lnsb.includes(p));
}

export function get_common_sketch_elements(
    a: SketchElementCollection,
    b: SketchElementCollection,
): SketchElement[] {
    const na = sketch_element_collection_as_array(a);
    const nb = sketch_element_collection_as_array(b);
    return na.filter((p) => nb.includes(p));
}

export function has(
    ec: SketchElementCollection,
    ...se: SketchElement[]
): boolean {
    const nec = sketch_element_collection_as_array(ec);
    return se.every((el) => nec.includes(el));
}
