import { EPS, Vector } from "../geometry.js";
import { merge_validations } from "../../assert.js";
import Sketch from "../sketch";
import Point from "../point";
import Line from "../line";
import { SketchElement, SketchElementCollectionLike } from "../types.js";

export { validate_sketch } from "./sketch_is_valid.js";

export function has_sketch(
    el: SketchElementCollectionLike,
    sketch: Sketch
) {
    return el.get_sketch() === sketch || "Element doesnt belong to specified sketch"
}

export function invalid_path() {
    return "Invalid path reached!"
}

export function have_sketch(
    els: SketchElementCollectionLike[],
    sketch: Sketch
) {
    return merge_validations(
        els.map(
            e => has_sketch(e, sketch)
        )
    )
}

export function same_sketch(
    els: SketchElementCollectionLike[],
) {
    if (els.length == 0) return true;
    return have_sketch(els, els[0]!.get_sketch()!)
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
