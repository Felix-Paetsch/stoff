import Point from "../point.js";
import Line from "../line.js";
import { SketchElement, SketchElementCollectionLike } from "../types.js";
import SketchElementCollection from "../sketch_element_collection.js";
import { filterLine, filterPoint, LineFilter, PointFilter } from "./filter.js";

export function get_sketch_elements(ec: SketchElementCollectionLike): {
    points: SketchElementCollection<Point>,
    lines: SketchElementCollection<Line>
} {
    return {
        points: ec.get_points(),
        lines: ec.get_lines()
    }
}

export function unique(ec: SketchElementCollectionLike): SketchElementCollection {
    const points = ec.get_points();
    const lines = ec.get_lines();

    const filtered_points = points.filter(
        (value, index) => points.indexOf(value) === index
    );
    const filtered_lines = lines.filter(
        (value, index) => lines.indexOf(value) === index
    );

    return new SketchElementCollection((filtered_lines as SketchElement[]).concat(...filtered_points));
}

export function group_by_key(ec: SketchElementCollectionLike, key: string) {
    const pts = points_by_key(ec, key);
    const lns = lines_by_key(ec, key);
    return {
        points: pts,
        lines: lns
    }
}

export function lines_by_key(ec: SketchElementCollectionLike, key: string) {
    return ec.get_lines().reduce((acc: Record<string, SketchElementCollection<Line>>, line: Line) => {
        const groupKey =
            line.data[key] !== undefined ? line.data[key] : "_";
        if (!acc[groupKey]) {
            acc[groupKey] = new SketchElementCollection<Line>([], ec.get_sketch());
        }
        acc[groupKey].push(line);
        return acc;
    }, {});
}

export function points_by_key(ec: SketchElementCollectionLike, key: string) {
    return ec.get_points().reduce(
        (acc: Record<string, SketchElementCollection<Point>>, pt: Point) => {
            const groupKey = pt.data[key] !== undefined ? pt.data[key] : "_";
            if (!acc[groupKey]) {
                acc[groupKey] = new SketchElementCollection<Point>([], ec.get_sketch());
            }
            acc[groupKey].push(pt);
            return acc;
        }, {}
    );
}

export function get_points_between_lines(
    ec: SketchElementCollectionLike,
    line1Filter: LineFilter,
    line2Filter: LineFilter,
    find_where: "collection_points_any_lines"
        | "collection_points_collection_lines"
        | "any_points_collection_lines"
        | "any_points_any_lines" // Mostly unreasonable
        = "any_points_collection_lines"
): SketchElementCollection<Point> {
    const sketch = ec.get_sketch();
    if (!sketch && find_where !== "collection_points_collection_lines") {
        throw new Error("Sketch of collection not specified!");
    }
    if (find_where === "any_points_any_lines") {
        return get_points_between_lines(
            sketch!,
            line1Filter,
            line2Filter,
            "collection_points_collection_lines"
        );
    }

    let lines: Line[] = ec.get_lines();
    let points: Point[] = ec.get_points();

    if (
        find_where == "collection_points_any_lines"
    ) {
        lines = sketch!.get_lines();
    }
    if (
        find_where == "any_points_collection_lines"
    ) {
        points = sketch!.get_points();
    }

    const testedFilters: [boolean, boolean][] = lines.map(l => ([
        filterLine(line1Filter, l),
        filterLine(line2Filter, l)
    ]));

    let result: SketchElementCollection<Point> = new SketchElementCollection([], sketch);
    for (let i = 0; i < lines.length - 1; i++) {
        for (let j = i + 1; j < lines.length; j++) {
            const p = lines[i].common_endpoint(lines[j]);
            if (
                p
                && ((
                    testedFilters[i][0] && testedFilters[j][1]
                ) || (
                        testedFilters[i][1] && testedFilters[j][0]
                    ))
                && points.includes(p)
                && !result.includes(p)
            ) {
                result.push(p);
            }
        }
    }

    return result;
}

export function get_point_between_lines(
    ec: SketchElementCollectionLike,
    line1Filter: LineFilter,
    line2Filter: LineFilter,
    find_where: "collection_points_any_lines"
        | "collection_points_collection_lines"
        | "any_points_collection_lines"
        | "any_points_any_lines" // Mostly unreasonable
        = "any_points_collection_lines"
): Point | null {
    return get_points_between_lines(
        ec,
        line1Filter,
        line2Filter,
        find_where
    )[0] ?? null;
}

export function get_lines_between_points(
    ec: SketchElementCollectionLike,
    point1Filter: PointFilter,
    point2Filter: PointFilter,
    find_where: "collection_points_any_lines"
        | "collection_points_collection_lines"
        | "any_points_collection_lines"
        | "any_points_any_lines" // Mostly unreasonable
        = "any_points_collection_lines"
): SketchElementCollection<Line> {
    const sketch = ec.get_sketch();
    if (!sketch && find_where !== "collection_points_collection_lines") {
        throw new Error("Sketch of collection not specified!");
    }
    if (find_where === "any_points_any_lines") {
        return get_lines_between_points(
            sketch!,
            point1Filter,
            point1Filter,
            "collection_points_collection_lines"
        );
    }

    let lines: Line[] = ec.get_lines();
    let points: Point[] = ec.get_points();

    if (
        find_where == "collection_points_any_lines"
    ) {
        lines = sketch!.get_lines();
    }
    if (
        find_where == "any_points_collection_lines"
    ) {
        points = sketch!.get_points();
    }

    const testedFilters: [boolean, boolean][] = points.map(l => ([
        filterPoint(point1Filter, l),
        filterPoint(point2Filter, l)
    ]));

    let result: SketchElementCollection<Line> = new SketchElementCollection([], sketch);
    for (let i = 0; i < points.length - 1; i++) {
        for (let j = i + 1; j < points.length; j++) {
            if (
                (
                    testedFilters[i][0] && testedFilters[j][1]
                ) || (
                    testedFilters[i][1] && testedFilters[j][0]
                )
            ) {
                result.push(...points[i].common_lines(points[j]));
            }
        }
    }

    return result;
}

export function get_line_between_points(
    ec: SketchElementCollectionLike,
    point1Filter: PointFilter,
    point2Filter: PointFilter,
    find_where: "collection_points_any_lines"
        | "collection_points_collection_lines"
        | "any_points_collection_lines"
        | "any_points_any_lines" // Mostly unreasonable
        = "any_points_collection_lines"
): Line | null {
    return get_lines_between_points(
        ec,
        point1Filter,
        point2Filter,
        find_where
    )[0] ?? null;
}

export function get_common_points(
    a: SketchElementCollectionLike,
    b: SketchElementCollectionLike
): Point[] {
    return a.get_points().filter(p => b.get_points().includes(p));
}

export function get_common_lines(
    a: SketchElementCollectionLike,
    b: SketchElementCollectionLike
): Line[] {
    return a.get_lines().filter(l => b.get_lines().includes(l));
}

export function get_common_sketch_elements(
    a: SketchElementCollectionLike,
    b: SketchElementCollectionLike
): SketchElement[] {
    return [
        ...get_common_lines(a, b),
        ...get_common_points(a, b),
    ];
}

export function has_points(
    ec: SketchElementCollectionLike,
    ...pts: Point[]
): boolean {
    return pts.every(p => ec.get_points().includes(p));
}

export function has_lines(
    ec: SketchElementCollectionLike,
    ...lns: Line[]
): boolean {
    return lns.every(l => ec.get_lines().includes(l));
}

export function has(
    ec: SketchElementCollectionLike,
    ...se: SketchElement[]
): boolean {
    return se.every(el =>
        el instanceof Point
            ? ec.get_points().includes(el)
            : ec.get_lines().includes(el)
    );
}
