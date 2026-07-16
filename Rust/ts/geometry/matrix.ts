import { Matrix } from "@/Core/geometry";
import { WASMMatrix, WASMMatrixVec } from "Rust/exports";
import { Allocations } from "../index";

export function wasm_matrix(v: Matrix): WASMMatrix {
    return Allocations.allocate(WASMMatrix.new(v.a, v.b, v.c, v.d));
}

export function wasm_matrix_vec(v: Matrix[]): WASMMatrixVec {
    const f64_arr = new Float64Array(v.length * 4);
    for (let i = 0; i < v.length; i++) {
        f64_arr[4 * i] = v[i]!.a;
        f64_arr[4 * i + 1] = v[i]!.b;
        f64_arr[4 * i + 2] = v[i]!.c;
        f64_arr[4 * i + 3] = v[i]!.d;
    }

    return Allocations.allocate(WASMMatrixVec.new(f64_arr));
}

export function matrix_from_wasm(m: WASMMatrix): Matrix {
    return Allocations.free_after_use(m, (m) =>
        Matrix.from_entries(m.a(), m.b(), m.c(), m.d()),
    );
}

export function matrix_vec_from_wasm(m: WASMMatrixVec): Matrix[] {
    return Allocations.consume(m, (m) => {
        const arr = m.into_float64_vec();
        const res: Matrix[] = [];
        for (let i = 0; i < arr.length; i += 4) {
            res.push(
                Matrix.from_entries(
                    arr[4 * i]!,
                    arr[4 * i + 1]!,
                    arr[4 * i + 2]!,
                    arr[4 * i + 3]!,
                ),
            );
        }
        return res;
    });
}
