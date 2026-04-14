import { mirror_type, MirrorData } from "Core/geometry/linear_transformations";
import { sketch_element_collection_as_array } from "..";
import { Point } from "../../point";
import { SketchElement, SketchElementCollection } from "../../types";

import { LinearTransform } from "Core/geometry";

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
            el.move_to(trafo(el));
            continue;
        }

        if (mirror_type(mirror_args) === "Line") {
            el.update_shape(el.shape.map(trafo));
        }
    }

    return ec;
}
