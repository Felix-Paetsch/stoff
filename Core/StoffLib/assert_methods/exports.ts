import { EPS, Vector } from "../geometry.js";
import { merge_validations } from "../../assert.js";
import Point from "../point";
import Line from "../line";
import { SketchElement } from "../types.js";
import Sketch from "../sketch.js";

export { validate_sketch } from "./sketch_is_valid.js";

export function invalid_path() {
    return "Invalid path reached!"
}

export function same_sketch(
    ...els: (SketchElement | {
        get_sketch: () => Sketch
    })[]
) {
    if (els.length == 0) return true;
    const sketch = els[0].get_sketch();

    return merge_validations(
        els.map(
            e => e.get_sketch() === sketch
        )
    )
}

export function is_isolated(
    el: Line | Point
) {
    if (el instanceof Point) return el.get_adjacent_lines().length == 0;
    return el.p1.get_adjacent_lines().length == 1 && el.p2.get_adjacent_lines().length == 1;
}

export function not_isolated(el: Line | Point) {
    return !is_isolated(el)
}

export function vec_on_line(vec: Vector, line: Line) {
    return vec.distance(line.closest_position(vec)) < EPS.MODERATE;
}

export function path_connected(el1: SketchElement, el2: SketchElement) {
    return el1.connected_component().contains(el2);
}
