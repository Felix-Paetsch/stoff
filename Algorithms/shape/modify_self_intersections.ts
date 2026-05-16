import { Shape } from "@/Core";
import {
    wasm_geometry_walk_shape_with_self_intersection,
    wasm_geometry_walk_shape_without_self_intersection,
} from "Rust/exports";

export function walk_without_self_intersections<E extends Shape.Shape>(
    s: E,
): E {
    const shape_vecf64 = s.to_wasm_vecf64();
    const res =
        wasm_geometry_walk_shape_without_self_intersection(shape_vecf64)!;
    return Shape.from_wasm_vecf64(res) as E;
}

export function walk_with_self_intersections<E extends Shape.Shape>(s: E): E {
    const shape_vecf64 = s.to_wasm_vecf64();
    const res = wasm_geometry_walk_shape_with_self_intersection(shape_vecf64)!;
    return Shape.from_wasm_vecf64(res) as E;
}
