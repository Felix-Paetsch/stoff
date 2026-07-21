import { Expect } from "@/Core/expect";
import { Polyline, Shape, Vector } from "@/Core/geometry";
import { EPS } from "Core/numerics/eps";

const tie_on_off_spacer = 0.04;

// All units are cm
export function tie_on_off(shape: Shape): Polyline {
    if (shape.is_empty()) {
        return Polyline.empty();
    }

    const line = shape.as_polyline();
    Expect.that(line.length() >= 3 * tie_on_off_spacer);

    const start = line.first()!;
    const mid_start = line.sample(tie_on_off_spacer, "absolute")!;
    const end_start = line.sample(2 * tie_on_off_spacer, "absolute")!;

    const end = line.last()!;
    const mid_end = line.sample(-tie_on_off_spacer, "absolute")!;
    const end_end = line.sample(-2 * tie_on_off_spacer, "absolute")!;

    return new Polyline([
        start,
        mid_start,
        end_start,
        mid_start,
        ...line.vertices,
        mid_end,
        end_end,
        mid_end,
        end,
    ]);
}

export function tie_on(shape: Shape): Polyline {
    if (shape.is_empty()) {
        return Polyline.empty();
    }

    const line = shape.as_polyline();
    Expect.that(line.length() >= 3 * tie_on_off_spacer);

    const start = line.first()!;
    const mid_start = line.sample(tie_on_off_spacer, "absolute")!;
    const end_start = line.sample(2 * tie_on_off_spacer, "absolute")!;

    return new Polyline([
        start,
        mid_start,
        end_start,
        mid_start,
        ...line.vertices,
    ]);
}

export function tie_off(shape: Shape): Polyline {
    if (shape.is_empty()) {
        return Polyline.empty();
    }

    const line = shape.as_polyline();
    Expect.that(line.length() >= 3 * tie_on_off_spacer);

    const end = line.last()!;
    const mid_end = line.sample(-tie_on_off_spacer, "absolute")!;
    const end_end = line.sample(-2 * tie_on_off_spacer, "absolute")!;

    return new Polyline([...line.vertices, mid_end, end_end, mid_end, end]);
}

export function undo_tie_on_off(shape: Polyline): Polyline {
    if (shape.is_empty() || shape.vertex_count() < 5) {
        return shape;
    }

    const vs = shape.vertices;
    const l1m = vs.length - 1;

    const is_tied_on =
        vs[0]!.distance_squared(vs[4]!) < EPS.tiny &&
        vs[1]!.approx_equals(vs[3]!) &&
        Vector.angle(vs[0]!, vs[2]!, vs[1]!) > Math.PI / 2;

    const is_tied_off =
        vs[l1m - 0]!.distance_squared(vs[l1m - 4]!) < EPS.tiny &&
        vs[l1m - 1]!.approx_equals(vs[l1m - 3]!) &&
        Vector.angle(vs[l1m - 0]!, vs[l1m - 2]!, vs[l1m - 1]!) > Math.PI / 2;

    if (!is_tied_on && !is_tied_on) {
        return shape;
    }

    if (!is_tied_off) {
        return new Polyline(vs.slice(4));
    }

    if (!is_tied_on) {
        return new Polyline(vs.slice(0, -3));
    }

    return new Polyline(vs.slice(4, -3));
}
