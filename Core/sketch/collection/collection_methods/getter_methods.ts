import { filterLine, filterPoint, LineFilter, PointFilter } from "./filter";
import { sketch_element_collection_as_array } from "..";
import { same_sketch } from "../../../../todo/expect_methods/exports";
import { SketchElement, SketchElementCollection } from "../../types";
import { Line } from "../../line";
import { Point } from "../../point";
import { Sketch } from "../../sketch";
import { expect } from "@/Core/expect";

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

export function get_points(
    ec: SketchElementCollection,
    filter: PointFilter = true,
): Point[] {
    const nec = sketch_element_collection_as_array(ec);
    return nec.filter(
        (e) => e instanceof Point && filterPoint(filter, e as Point),
    ) as Point[];
}

export function get_sketch(...els: { sketch: Sketch }[]): Sketch {
    if (els.length == 0) {
        return new Sketch();
    }
    expect(same_sketch(...els.map((e) => e.sketch)));
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

export function get_points_between_lines(
    ec: SketchElementCollection,
    line1Filter: LineFilter,
    line2Filter: LineFilter,
    find_where:
        | "collection_points_any_lines"
        | "collection_points_collection_lines"
        | "any_points_collection_lines"
        | "any_points_any_lines" = "any_points_collection_lines", // Mostly unreasonable
): Point[] {
    const nec = sketch_element_collection_as_array(ec);
    const sketch = get_sketch(...nec);

    if (!sketch && find_where !== "collection_points_collection_lines") {
        throw new Error("Sketch of collection not specified!");
    }
    if (find_where === "any_points_any_lines") {
        return get_points_between_lines(
            sketch.get_sketch_elements(),
            line1Filter,
            line2Filter,
            "collection_points_collection_lines",
        );
    }

    let lines: Line[] = get_lines(nec);
    let points: Point[] = get_points(nec);

    if (find_where == "collection_points_any_lines") {
        lines = sketch!.lines;
    }
    if (find_where == "any_points_collection_lines") {
        points = sketch!.points;
    }

    const testedFilters: [boolean, boolean][] = lines.map((l) => [
        filterLine(line1Filter, l),
        filterLine(line2Filter, l),
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
                !result.includes(p)
            ) {
                result.push(p);
            }
        }
    }

    return result;
}

export function get_point_between_lines(
    ec: SketchElementCollection,
    line1Filter: LineFilter,
    line2Filter: LineFilter,
    find_where:
        | "collection_points_any_lines"
        | "collection_points_collection_lines"
        | "any_points_collection_lines"
        | "any_points_any_lines" = "any_points_collection_lines", // Mostly unreasonable
): Point | null {
    return (
        get_points_between_lines(ec, line1Filter, line2Filter, find_where)[0] ??
        null
    );
}

export function get_lines_between_points(
    ec: SketchElementCollection,
    point1Filter: PointFilter = true,
    point2Filter: PointFilter = true,
    find_where:
        | "collection_points_any_lines"
        | "collection_points_collection_lines"
        | "any_points_collection_lines"
        | "any_points_any_lines" = "any_points_collection_lines", // Mostly unreasonable
): Line[] {
    const nec = sketch_element_collection_as_array(ec);
    const sketch = get_sketch(...nec);
    if (!sketch && find_where !== "collection_points_collection_lines") {
        throw new Error("Sketch of collection not specified!");
    }
    if (find_where === "any_points_any_lines") {
        return get_lines_between_points(
            sketch.get_sketch_elements(),
            point1Filter,
            point1Filter,
            "collection_points_collection_lines",
        );
    }

    let lines: Line[] = get_lines(ec);
    let points: Point[] = get_points(ec);

    if (find_where == "collection_points_any_lines") {
        lines = sketch!.lines;
    }
    if (find_where == "any_points_collection_lines") {
        points = sketch!.points;
    }

    const testedFilters: [boolean, boolean][] = points.map((p) => [
        filterPoint(point1Filter, p),
        filterPoint(point2Filter, p),
    ]);

    let result: SketchElementCollection<Line> = [];
    for (let i = 0; i < points.length - 1; i++) {
        for (let j = i + 1; j < points.length; j++) {
            if (
                (testedFilters[i]![0] && testedFilters[j]![1]) ||
                (testedFilters[i]![1] && testedFilters[j]![0])
            ) {
                const common = points[i]!.common_lines(points[j]!);
                result.push(...common.filter((c) => lines.includes(c)));
            }
        }
    }

    return result;
}

export function get_line_between_points(
    ec: SketchElementCollection,
    point1Filter: PointFilter = true,
    point2Filter: PointFilter = true,
    find_where:
        | "collection_points_any_lines"
        | "collection_points_collection_lines"
        | "any_points_collection_lines"
        | "any_points_any_lines" = "any_points_collection_lines", // Mostly unreasonable
): Line | null {
    return (
        get_lines_between_points(
            ec,
            point1Filter,
            point2Filter,
            find_where,
        )[0] ?? null
    );
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
