import { Polygon } from "@/Core";
import { Vector } from "Core/geometry/vector";
import { EPS } from "Core/numerics/eps";
import { Polyline } from "../polyline";
import { Shape } from "../shape";

export function curvature(
    shape: Shape.Shape,
    at: Shape.ShapePositionDescriptor,
    scale: number = EPS.tiny,
): number | null {
    const at_descr = shape.shape_point_descriptor_to_shape_position(at);
    if (!at_descr) return null;

    const at_len = shape.length_until(at_descr)!;
    const total_len = shape.length();

    let actual_scale = scale;

    if (shape instanceof Polyline) {
        actual_scale = Math.min(scale, at_len, total_len - at_len);

        // Keep your original "factor of 2" guard first.
        if (actual_scale < scale / 2) {
            actual_scale = scale / 2;
        }
    }

    let prev: Vector;
    let next: Vector;

    const prev_len = at_len - actual_scale;
    const next_len = at_len + actual_scale;

    if (shape instanceof Polygon) {
        prev = shape.shape_position_at_length(prev_len).vec;
        next = shape.shape_position_at_length(next_len).vec;
    } else {
        if (prev_len >= 0) {
            prev = shape.shape_position_at_length(prev_len).vec;
        } else {
            const start = shape.first();
            if (!start) return null;

            const tangent = shape.tangent_vector("start");
            if (!tangent) return null;

            prev = start.subtract(tangent.scale(-prev_len));
        }

        if (next_len <= total_len) {
            next = shape.shape_position_at_length(next_len).vec;
        } else {
            const end = shape.last();
            if (!end) return null;

            const tangent = shape.tangent_vector("end");
            if (!tangent) return null;

            next = end.add(tangent.scale(next_len - total_len));
        }
    }

    const a = at_descr.vec.distance(prev);
    const b = at_descr.vec.distance(next);
    const c = next.distance(prev);

    const area = new Polygon([prev, next, at_descr.vec]).area();
    const curvature = (4 * area) / (a * b * c);
    return (curvature * scale) / actual_scale;
}

export function signed_curvature(
    shape: Shape.Shape,
    at: Shape.ShapePositionDescriptor,
    scale: number = EPS.tiny,
): number | null {
    const at_descr = shape.shape_point_descriptor_to_shape_position(at);
    if (!at_descr) return null;

    const at_len = shape.length_until(at_descr)!;
    const total_len = shape.length();

    let actual_scale = scale;

    if (shape instanceof Polyline) {
        actual_scale = Math.min(scale, at_len, total_len - at_len);

        // Keep your original "factor of 2" guard first.
        if (actual_scale < scale / 2) {
            actual_scale = scale / 2;
        }
    }

    let prev: Vector;
    let next: Vector;

    const prev_len = at_len - actual_scale;
    const next_len = at_len + actual_scale;

    if (shape instanceof Polygon) {
        prev = shape.shape_position_at_length(prev_len).vec;
        next = shape.shape_position_at_length(next_len).vec;
    } else {
        if (prev_len >= 0) {
            prev = shape.shape_position_at_length(prev_len).vec;
        } else {
            const start = shape.first();
            if (!start) return null;

            const tangent = shape.tangent_vector("start");
            if (!tangent) return null;

            prev = start.subtract(tangent.scale(-prev_len));
        }

        if (next_len <= total_len) {
            next = shape.shape_position_at_length(next_len).vec;
        } else {
            const end = shape.last();
            if (!end) return null;

            const tangent = shape.tangent_vector("end");
            if (!tangent) return null;

            next = end.add(tangent.scale(next_len - total_len));
        }
    }

    const a = at_descr.vec.distance(prev);
    const b = at_descr.vec.distance(next);
    const c = next.distance(prev);

    let area = new Polygon([prev, next, at_descr.vec]).signed_area();
    const curvature = (4 * area) / (a * b * c);

    if (shape instanceof Polygon && shape.orientation() == "ccw") {
        area *= 1;
    }

    return (curvature * scale) / actual_scale;
}
