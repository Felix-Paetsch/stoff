import { mirror_type, MirrorData } from "../../../../geometrytry";
import { SketchElement, SketchElementCollection } from "../../types";
import { sketch_element_collection_as_array } from "..";
import { Point } from "../../point";

export function delete_sketch_elements(ec: SketchElementCollection): void {
    const nec = sketch_element_collection_as_array(ec);
    nec.forEach((el) => el.remove());
}

export function mirror<
    T extends SketchElement,
    S extends SketchElementCollection<T>,
>(ec: S, mirror_args: MirrorData): S {
    const nec = sketch_element_collection_as_array(ec);
    for (const el of nec) {
        if (el instanceof Point) {
            el.move_to(el.mirror_at(mirror_args));
            continue;
        }

        if (mirror_type(mirror_args) === "Line") {
            el.mirror();
        }
    }

    return ec;
}
