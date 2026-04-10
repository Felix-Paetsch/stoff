import { ConnectedComponent } from "./connected_component";
import { get_lines, get_points } from "./getter_methods";
import { sketch_element_collection_as_array } from "..";
import { SketchElement, SketchElementCollection } from "../../types";
import { BoundingBox, FiniteGeometry, Polygon, Vector } from "@/Core/geometry";

export function get_bounding_box(ec: SketchElementCollection): BoundingBox {
    const nec = sketch_element_collection_as_array(ec);
    return BoundingBox.merge(nec.map((el) => el.bounding_box()));
}

export function convex_hull(ec: SketchElementCollection): Polygon | null {
    const pts: Vector[] = get_points(ec);
    const lns = get_lines(ec);

    return FiniteGeometry.convex_hull(
        ...pts.concat(lns.flatMap((l) => l.shape.verticies)),
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
