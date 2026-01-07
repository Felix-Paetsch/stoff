import { mirror_type } from "../geometry.js";
import Point from "../point.js";
import Line from "../line.js";
import { SketchElementCollectionLike } from "../types.js";
import { MirrorData } from "../geometry/types.js";

export function delete_sketch_elements(
    ec: SketchElementCollectionLike
): void {
    const pts = ec.get_points();
    const lns = ec.get_lines();

    lns.forEach(l => l.remove());
    pts.forEach(p => p.remove());
}

export function transform(
    ec: SketchElementCollectionLike,
    pt_fun: (pt: Point) => void = () => { }
): SketchElementCollectionLike {
    ec.get_points().forEach(pt_fun);
    return ec;
}

export function mirror(
    ec: SketchElementCollectionLike,
    mirror_args: MirrorData
): SketchElementCollectionLike {
    transform(ec, pt => {
        pt.move_to(pt.mirror_at(mirror_args));
    });

    if (mirror_type(mirror_args) === "Line") {
        ec.get_lines().forEach((l: Line) => l.mirror());
    }

    return ec;
}
