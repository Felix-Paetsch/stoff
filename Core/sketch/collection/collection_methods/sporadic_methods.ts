import { copy_sketch_element_collection } from "../copy";
import { ConnectedComponent } from "../connected_component";
import { get_lines, get_points, get_sketch } from "./getter_methods";
import { sketch_element_collection_as_array } from "..";
import { SketchElement, SketchElementCollection } from "../../types";
import {
    BoundingBox,
    convex_hull as GeometryConvexHull,
    Vector,
} from "../../../geometry";

export function get_bounding_box(
    ec: SketchElementCollection,
    min_bb: [number, number] = [0, 0],
): BoundingBox {
    const nec = sketch_element_collection_as_array(ec);
    return BoundingBox.merge(
        nec.map((el) => el.get_bounding_box()),
        min_bb,
    );
}

export function convex_hull(ec: SketchElementCollection): Vector[] {
    const pts: Vector[] = get_points(ec);
    const lns = get_lines(ec);

    return GeometryConvexHull(
        pts.concat(lns.flatMap((l) => l.get_absolute_sample_points())),
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

export function connected_hull(ec: SketchElementCollection): SketchElement[] {
    const res: SketchElementCollection = [];
    const nec = sketch_element_collection_as_array(ec);

    for (const el of nec) {
        if (res.includes(el)) {
            continue;
        }

        res.push(...new ConnectedComponent(el).get_sketch_elements());
    }

    return res;
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

export function paste_to_sketch(
    ec: SketchElementCollection,
    target: any,
    position: Vector | null = null,
) {
    return copy_sketch_element_collection(ec, target, position);
}

export function connected_components(
    ec: SketchElementCollection,
    exclude_endpoints: boolean = false,
): SketchElement[][] {
    let nec: SketchElementCollection;
    if (exclude_endpoints) {
        nec = sketch_element_collection_as_array(ec);
    } else {
        nec = endpoint_hull(ec);
    }

    if (nec.length === 0) return [];

    const sketch = get_sketch(...nec);

    const all = sketch.get_sketch_elements();

    const other_things = all.filter((element) => !nec.includes(element));
    return sketch.get_avoidant_connected_components(other_things).map((c) => {
        return c.get_sketch_elements();
    });
}

export function avoidant_connected_components(
    ec: SketchElementCollection,
    avoiding: SketchElement[],
): SketchElement[][] {
    const nec = sketch_element_collection_as_array(ec);
    if (nec.length === 0) return [];
    const sketch = get_sketch(...nec);

    const all = sketch.get_sketch_elements();
    const ec_all = nec.filter((a) => avoiding.includes(a));

    const other_things = all.filter((element) => !ec_all.includes(element));
    return sketch.get_avoidant_connected_components(other_things).map((c) => {
        return c.get_sketch_elements();
    });
}
