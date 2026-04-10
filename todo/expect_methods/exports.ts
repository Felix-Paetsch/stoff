import { merge_validations } from "@/Core/expect";
import { Geometry, Vector } from "@/Core/geometry";
import { EPS } from "@/Core/numerics";
import { ConnectedComponent, Line, Point, SketchElement } from "@/Core/sketch";
import { Sketch } from "@/sketch_old";

export * from "./sketch_is_valid";

export function same_sketch(
    ...els: (
        | {
              get_sketch: () => Sketch;
          }
        | { sketch: Sketch }
        | Sketch
    )[]
) {
    if (els.length == 0) return true;
    const sketch = extract_sketch(els[0]!);

    return merge_validations(els.map((e) => extract_sketch(e) === sketch));
}

function extract_sketch(
    out_of:
        | {
              get_sketch: () => Sketch;
          }
        | { sketch: Sketch }
        | Sketch,
): Sketch {
    if (out_of instanceof Sketch) return out_of;
    if ("sketch" in out_of) return out_of.sketch;
    return out_of.get_sketch();
}

export function is_isolated(el: Line | Point): boolean {
    if (el instanceof Point) return el.adjacent_lines().length == 0;
    return (
        el.p1.adjacent_lines().length == 1 && el.p2.adjacent_lines().length == 1
    );
}

export function not_isolated(el: Line | Point) {
    return !is_isolated(el);
}

export function vec_on_line(vec: Vector, line: Line) {
    return Geometry.distance(vec, line.shape) < EPS.tiny;
}

export function path_connected(el1: SketchElement, el2: SketchElement) {
    return new ConnectedComponent(el1).contains(el2);
}
