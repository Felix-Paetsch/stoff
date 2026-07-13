import { Vector } from "@/Core/geometry";
import { WASMVector, WASMVectorVec } from "Rust/exports";
import { Allocations } from "../index";

export function wasm_vector(v: Vector): WASMVector {
    return Allocations.allocate(WASMVector.new(v.x, v.y));
}

export function wasm_vector_vec(v: Vector[]): WASMVectorVec {
    const f64_arr = new Float64Array(v.length * 2);
    for (let i = 0; i < v.length; i++) {
        f64_arr[2 * i] = v[i]!.x;
        f64_arr[2 * i + 1] = v[i]!.y;
    }

    return Allocations.allocate(WASMVectorVec.new(f64_arr));
}

export function vector_from_wasm(v: WASMVector): Vector {
    return Allocations.free_after_use(v, (v) => new Vector(v.x(), v.y()));
}
