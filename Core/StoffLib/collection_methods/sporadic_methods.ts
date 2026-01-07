import { Vector, convex_hull, BoundingBox } from "../geometry.js";
import { copy_sketch_element_collection } from "../copy.js";
import {
    SketchElement,
    SketchElementCollectionLike,
} from "../types.js";
import SketchElementCollection from "../sketch_element_collection.js";

export function get_bounding_box(
    ec: SketchElementCollectionLike,
    min_bb: [number, number] = [0, 0]
): BoundingBox {
    const pts = ec.get_points();
    const lns = ec.get_lines();
    return BoundingBox.merge(
        [
            ...pts.map(el => el.get_bounding_box()),
            ...lns.map(el => el.get_bounding_box())
        ],
        min_bb
    );
}

export function convex_hull_of_collection(
    ec: SketchElementCollectionLike
): Vector[] {
    const pts = ec.get_points();
    const lns = ec.get_lines();

    return convex_hull(
        pts.concat(
            lns.flatMap(l => l.get_absolute_sample_points())
        )
    );
}

export function endpoint_hull(
    ec: SketchElementCollectionLike
): SketchElementCollection {
    const lines = [...ec.get_lines()];
    const points = [...ec.get_points()];

    lines.forEach(l => {
        if (!points.includes(l.p1)) points.push(l.p1);
        if (!points.includes(l.p2)) points.push(l.p2);
    });

    return new SketchElementCollection((lines as SketchElement[]).concat(points), ec.get_sketch());
}

export function inner_lines(
    ec: SketchElementCollectionLike
): SketchElementCollection {
    const lines = [...ec.get_lines()];
    const points = ec.get_points();

    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const inner = points[i].common_lines(points[j]);
            for (const l of inner) {
                if (!lines.includes(l)) {
                    lines.push(l);
                }
            }
        }
    }

    return new SketchElementCollection(
        (lines as SketchElement[]).concat(points)
    );
}

export function paste_to_sketch(
    ec: SketchElementCollectionLike,
    target: any,
    position: Vector | null = null
) {
    return copy_sketch_element_collection(ec, target, position);
}

export function self_intersecting(
    _ec: SketchElementCollectionLike
): boolean {
    // Intersections without designated points
    throw new Error("Unimplemented!");
}
