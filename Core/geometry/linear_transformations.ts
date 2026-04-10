import { Line } from "./line";
import { Matrix } from "./matrix";
import { Ray } from "./ray";
import { LineSegment, Radians } from "./types";
import { Vector } from "./vector";

export type LinearTransformation = (x: Vector) => Vector;

export function linear(
    f_in: [Vector, Vector],
    f_out: [Vector, Vector],
): LinearTransformation {
    const inp_matrix = new Matrix(f_in[0], f_in[1]);
    const out_matrix = new Matrix(f_out[0], f_out[1]);

    return out_matrix.mult(inp_matrix.invert()).transform();
}

export function orthogonal(f_in: Vector, f_out: Vector): LinearTransformation {
    const f_in_orth = f_in.orthogonal();
    const f_out_orth = f_out.orthogonal();

    return linear([f_in, f_in_orth], [f_out, f_out_orth]);
}

export function affine_linear(
    f_in: [Vector, Vector, Vector],
    f_out: [Vector, Vector, Vector],
): LinearTransformation {
    const centralize_src = (x: Vector) => {
        return x.subtract(f_in[2]);
    };
    const decentralize_trg = (x: Vector) => {
        return x.add(f_out[2]);
    };

    const new_f_in: [Vector, Vector] = [
        centralize_src(f_in[0]),
        centralize_src(f_in[1]),
    ];

    const new_f_out: [Vector, Vector] = [
        f_out[0].subtract(f_out[2]),
        f_out[1].subtract(f_out[2]),
    ];

    const lin = linear(new_f_in, new_f_out);

    return (x: Vector) => {
        return decentralize_trg(lin(centralize_src(x)));
    };
}

export function affine_orthogonal(
    f_in: [Vector, Vector],
    f_out: [Vector, Vector],
): LinearTransformation {
    const centralize_src = (x: Vector) => {
        return x.subtract(f_in[1]);
    };
    const decentralize_trg = (x: Vector) => {
        return x.add(f_out[1]);
    };

    const new_f_in = centralize_src(f_in[0]);
    const new_f_out = f_out[0].subtract(f_out[1]);

    const lin = orthogonal(new_f_in, new_f_out);

    return (x: Vector) => {
        return decentralize_trg(lin(centralize_src(x)));
    };
}

// Here the vector argument says rotate v1 to v2
export function rotate(
    angle: Radians | [Vector, Vector],
    around: Vector = Vector.ZERO,
): LinearTransformation {
    if (Array.isArray(angle)) {
        return rotate(
            Vector.angle_clockwise(angle[0], angle[1], around),
            around,
        );
    }

    const rotMatrix = new Matrix(
        new Vector(Math.cos(angle), Math.sin(angle)),
        new Vector(-1 * Math.sin(angle), Math.cos(angle)),
    );

    return rotMatrix.transform();
}

export type MirrorData = Line | Ray | Vector | LineSegment | null;
export type MirrorType = "Line" | "Point";

export function mirror_type(el: Line | Ray | LineSegment): "Line";
export function mirror_type(el: Vector | null): "Point";
export function mirror_type(el: MirrorData): MirrorType;
export function mirror_type(el: MirrorData): MirrorType {
    if (el instanceof Line || el instanceof Ray || Array.isArray(el))
        return "Line";
    return "Point";
}

export function mirror(md: MirrorData): LinearTransformation {
    if (md instanceof Line || md instanceof Ray)
        return (x: Vector) => x.mirror_at(md.to_line().project(x));
    if (Array.isArray(md)) {
        return mirror(new Line(md[0], md[1]));
    }
    if (md === null) return mirror(Vector.ZERO);
    return (x: Vector) => md.add(md.subtract(x));
}
