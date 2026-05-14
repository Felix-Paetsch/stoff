import { mirror_type, MirrorData } from "Core/geometry/linear_transformations";
import {
    endpoint_hull,
    endpoint_interior,
    sketch_element_collection_as_array,
} from "..";
import { Point } from "../../point";
import { SketchElement, SketchElementCollection } from "../../types";

import { Line } from "@/Core";
import { LinearTransform, Vector } from "Core/geometry";

export function delete_sketch_elements(ec: SketchElementCollection): void {
    const nec = sketch_element_collection_as_array(ec);
    nec.forEach((el) => el.remove());
}

export function mirror<
    T extends SketchElement,
    S extends SketchElementCollection<T>,
>(ec: S, mirror_args: MirrorData): S {
    const nec = sketch_element_collection_as_array(ec);
    const trafo = LinearTransform.mirror(mirror_args);

    for (const el of nec) {
        if (el instanceof Point) {
            el.move_to(trafo(el.vec));
            continue;
        }

        if (mirror_type(mirror_args) === "Line") {
            el.update_shape(el.shape.map(trafo));
        }
    }

    return ec;
}

export type EndpointPolicy = "endpoint_hull" | "endpoint_interior";

export function map(
    c: SketchElementCollection,
    fn: (v: Vector) => Vector,
    endpoint_policy: EndpointPolicy = "endpoint_hull",
): SketchElement[] {
    const sc = sketch_element_collection_as_array(c);
    const modified_sec_method =
        endpoint_policy == "endpoint_hull" ? endpoint_hull : endpoint_interior;
    const hull = modified_sec_method(sc);

    const pts = hull.filter((p) => p instanceof Point);
    const lns = hull.filter((p) => p instanceof Line);

    pts.forEach((p) => p._unsafe_move_to(fn(p.vec)));
    lns.forEach((l) => l.update_shape(l.shape.map(fn)));

    return hull;
}
