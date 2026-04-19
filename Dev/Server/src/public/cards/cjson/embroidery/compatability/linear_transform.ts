import { Matrix } from "./matrix";
import { Vector } from "./vec";

export type LinearTransformation = (x: Vector) => Vector;

export function linear(
    f_in: [Vector, Vector],
    f_out: [Vector, Vector],
): LinearTransformation {
    const inp_matrix = new Matrix(f_in[0], f_in[1]);
    const out_matrix = new Matrix(f_out[0], f_out[1]);

    return out_matrix.mult(inp_matrix.invert()).transform();
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
