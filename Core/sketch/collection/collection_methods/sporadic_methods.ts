import { Line, Point } from "@/Core";
import { BoundingBox, FiniteGeometry, Polygon, Vector } from "Core/geometry";
import { sketch_element_collection as copy_sketch_element_collection } from "Core/sketch/copy";
import { sketch_element_collection_as_array } from "..";
import { SketchElement, SketchElementCollection } from "../../types";
import { connected_component} from "./connected_components";
import { get_lines, get_points } from "./getter_methods";

export function bounding_box(ec: SketchElementCollection): BoundingBox {
    const nec = sketch_element_collection_as_array(ec);
    return BoundingBox.merge(nec.map((el) => el.bounding_box()));
}

export function convex_hull(ec: SketchElementCollection): Polygon | null {
    const pts: Vector[] = get_points(ec).map((p) => p.vec);
    const lns = get_lines(ec);

    return FiniteGeometry.convex_hull(
        pts.concat(lns.flatMap((l) => l.shape.vertices)),
    );
}

export function endpoint_hull(ec: SketchElementCollection): SketchElement[] {
    const nec = sketch_element_collection_as_array(ec);
    const lines = get_lines(nec);
    const res = [...nec];

    lines.forEach((l) => {
        if (!res.includes(l.p1)) res.push(l.p1);
        if (!res.includes(l.p2)) res.push(l.p2);
    });

    return res;
}

export function endpoint_interior(
    ec: SketchElementCollection,
): SketchElement[] {
    const nec = sketch_element_collection_as_array(ec);
    const points = nec.filter((p) => p instanceof Point);
    const res: SketchElement[] = [...points];
    const lines = nec.filter((l) => l instanceof Line);

    lines.forEach((l) => {
        if (points.includes(l.p1) && points.includes(l.p2)) res.push(l);
    });

    return res;
}

// export function connected_hull_components(
//     of: SketchElementCollection,
//     inside?: SketchElementCollection,
// ): SketchElement[][] {
//     const of_as_array = sketch_element_collection_as_array(of);
//     if (of_as_array.length == 0) return [];
//
//     if (!inside) {
//         inside = of_as_array[0]!.sketch;
//     }
//     const inside_as_array = sketch_element_collection_as_array(inside);
//
//     const components: SketchElement[][] = [];
//     for (const se of of_as_array) {
//         if (components.some((c) => c.some((o) => o == se))) {
//             continue;
//         }
//
//         components.push(connected_component(inside_as_array, se));
//     }
//
//     return components;
// }

export function connected_hull(
    of: SketchElementCollection,
    inside?: SketchElementCollection,
): SketchElement[] {
    const of_as_array = sketch_element_collection_as_array(of);
    if (of_as_array.length == 0) return [];

    if (!inside) {
        inside = of_as_array[0]!.sketch;
    }
    const inside_as_array = sketch_element_collection_as_array(inside);

    const components: SketchElement[][] = [];
    for (const se of of_as_array) {
        if (components.some((c) => c.some((o) => o == se))) {
            continue;
        }

        components.push(connected_component(inside_as_array, se));
    }

    return components.flatMap((x) => x);
}

export function inner_line_hull(ec: SketchElementCollection): SketchElement[] {
    const lines: SketchElementCollection = get_lines(ec);
    const points = get_points(ec);

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const inner = points[i]!.common_lines(points[j]!);
            for (const l of inner) {
                if (!lines.includes(l)) {
                    lines.push(l);
                }
            }
        }
    }

    return lines.concat(points);
}

export const copy = copy_sketch_element_collection;
