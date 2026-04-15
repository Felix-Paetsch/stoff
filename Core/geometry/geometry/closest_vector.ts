import { Geometry } from "..";
import { Line } from "../line";
import { Ray } from "../ray";
import { Polyline } from "../shape/polyline";
import { Shape } from "../shape/shape";
import { Vector } from "../vector";
import { as_polyline } from "./utils";

export function closest_vectors(
    on: Geometry.Geometry,
    from: Geometry.Geometry,
): [Vector, Vector] | null {
    let on_shape: Polyline | null = null;
    if (Geometry.is_finite_geometry(on)) {
        on_shape = as_polyline(on);
    }

    let from_shape: Polyline | null = null;
    if (Geometry.is_finite_geometry(from)) {
        on_shape = as_polyline(from);
    }

    // Open: (Line | Ray) x smth
    // smth x (Line | Ray)
    if (from_shape && on_shape) {
        const res = Shape.closest_shape_positions(on_shape, from_shape);
        if (!res) return res;
        return [res[0].vec, res[1].vec];
    }

    if (on_shape) {
        // from is line or ray

        if (from instanceof Line) {
            const res = Shape.closest_shape_positions(
                on_shape,
                make_line_to_relevant_polyline_for_closest_vec(from, on_shape),
            );
            if (!res) return res;
            return [res[0].vec, res[1].vec];
        }

        if (from instanceof Ray) {
            const res = Shape.closest_shape_positions(
                on_shape,
                make_ray_to_relevant_polyline_for_closest_vec(from, on_shape),
            );
            if (!res) return res;
            return [res[0].vec, res[1].vec];
        }

        throw new Error("Invalid path");
    }

    if (from_shape) {
        // on is line or ray
        if (on instanceof Line) {
            const res = Shape.closest_shape_positions(
                make_line_to_relevant_polyline_for_closest_vec(on, from_shape),
                from_shape,
            );
            if (!res) return res;
            return [res[0].vec, res[1].vec];
        }

        if (on instanceof Ray) {
            const res = Shape.closest_shape_positions(
                make_ray_to_relevant_polyline_for_closest_vec(on, from_shape),
                from_shape,
            );
            if (!res) return res;
            return [res[0].vec, res[1].vec];
        }

        throw new Error("Invalid path");
    }

    // Both ray or line
    const typed_on = on as Line | Ray;
    const typed_from = from as Line | Ray;

    const ip = typed_on.intersect(typed_from);
    if (ip) return [ip, ip];

    if (typed_on instanceof Line) {
        if (typed_from instanceof Line) {
            return [typed_on.points[0], typed_from.project(typed_on.points[0])];
        }

        return [typed_on.project(typed_from.src), typed_from.src];
    }

    if (typed_from instanceof Line) {
        return [typed_on.src, typed_from.project(typed_on.src)];
    }

    const [p1, q1] = closest_vectors(typed_on, typed_from.src)!;
    const [q2, p2] = closest_vectors(typed_from, typed_on.src)!;

    if (p1.distance_squared(q1) <= q2.distance_squared(p2)) {
        return [p1, q1];
    }

    return [p2, q2];
}

export function make_line_to_relevant_polyline_for_closest_vec(
    l: Line,
    s: Shape,
): Polyline {
    if (s.positions.length == 0) {
        return Polyline.from_vectors([Vector.ZERO]);
    }

    const bb = s.bounding_box();
    const points = [
        bb.top_left,
        bb.top_right,
        bb.bottom_left,
        bb.bottom_right,
    ].map((v) => l.project(v));

    if (
        points[0]!.distance_squared(points[2]!) >=
        points[1]!.distance_squared(points[3]!)
    ) {
        return Polyline.from_vectors([points[0]!, points[2]!]);
    }

    return Polyline.from_vectors([points[1]!, points[3]!]);
}

export function make_ray_to_relevant_polyline_for_closest_vec(
    r: Ray,
    s: Shape,
): Polyline {
    if (s.positions.length == 0) {
        return Polyline.from_vectors([Vector.ZERO]);
    }

    const bb = s.bounding_box();
    const line = r.to_line();
    let points = [
        bb.top_left,
        bb.top_right,
        bb.bottom_left,
        bb.bottom_right,
    ].map((v) => line.project(v));

    for (let i = 0; i < 4; i++) {
        if (!r.contains(points[i]!)) {
            points[i] = r.src;
        }
    }

    if (
        points[0]!.distance_squared(points[2]!) >=
        points[1]!.distance_squared(points[3]!)
    ) {
        return Polyline.from_vectors([points[0]!, points[2]!]);
    }

    return Polyline.from_vectors([points[1]!, points[3]!]);
}
