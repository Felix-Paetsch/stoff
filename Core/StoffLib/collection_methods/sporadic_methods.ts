import { Vector, convex_hull as GeometryConvexHull, BoundingBox } from "../geometry.js";
import { copy_sketch_element_collection } from "../copy.js";
import {
    SketchElement,
    SketchElementCollectionLike,
} from "../types.js";
import Point from "../point";
import Line from "../line";
import SketchElementCollection from "../sketch_element_collection.js";
import { ConnectedComponent } from "../connected_component.js";

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

export function convex_hull(
    ec: SketchElementCollectionLike
): Vector[] {
    const pts = ec.get_points();
    const lns = ec.get_lines();

    return GeometryConvexHull(
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

    return new SketchElementCollection((lines as SketchElement[]).concat(points));
}

export function connected_hull(
    ec: SketchElementCollectionLike
): SketchElementCollection {
    const points: Point[] = [];
    const lines: Line[] = [];

    for (const pt of ec.get_points()) {
        if (points.includes(pt)) continue;
        const cc = new ConnectedComponent(pt);
        const obj = cc.obj();
        points.push(...obj.points);
        lines.push(...obj.lines);
    }

    for (const ln of ec.get_lines()) {
        if (lines.includes(ln)) continue;
        const cc = new ConnectedComponent(ln);
        const obj = cc.obj();
        points.push(...obj.points);
        lines.push(...obj.lines);
    }

    return new SketchElementCollection((points as SketchElement[]).concat(lines));
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

export function connected_components(
    ec: SketchElementCollectionLike
): SketchElementCollection[] {
    const sketch = ec.get_sketch();

    const all = sketch.get_lines().concat(sketch.get_points());
    const ec_all = ec.get_lines().concat(ec.get_points());

    const other_things = all.filter(element => !ec_all.includes(element));
    return sketch.get_avoidant_connected_components(other_things).map(c => {
        const obj = c.obj();
        return obj.points.concat(obj.lines);
    })
}


export function avoidant_connected_components(
    ec: SketchElementCollectionLike,
    avoiding: SketchElement[]
): SketchElementCollection[] {
    const sketch = ec.get_sketch();

    const all = sketch.get_lines().concat(sketch.get_points());
    const ec_all = ec.get_lines().concat(ec.get_points()).filter(a => avoiding.includes(a));

    const other_things = all.filter(element => !ec_all.includes(element));
    return sketch.get_avoidant_connected_components(other_things).map(c => {
        const obj = c.obj();
        return obj.points.concat(obj.lines);
    })
}
