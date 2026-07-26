import { Expect } from "@/Core/expect";
import { Shape } from "@/Core/geometry";
import {
    wasm_pathing_walk_shape_with_self_intersection,
    wasm_pathing_walk_shape_without_self_intersection,
    WASMCompatability,
} from "Rust/exports";

export function walk_without_self_intersections<E extends Shape.Shape>(
    s: E,
): E {
    const self_ints = s.self_intersection_positions().length;
    Expect.that(
        self_ints < 1000,
        "To many self intersections. To keep the PC from dying",
    );

    const res = wasm_pathing_walk_shape_without_self_intersection(
        WASMCompatability.Geometry.wasm_shape(s),
    )!;
    return WASMCompatability.Geometry.shape_from_wasm(res) as E;
}

export function walk_with_self_intersections<E extends Shape.Shape>(s: E): E {
    const self_ints = s.self_intersection_positions().length;
    Expect.that(
        self_ints < 1000,
        "To many self intersections. To keep the PC from dying",
    );

    const res = wasm_pathing_walk_shape_with_self_intersection(
        WASMCompatability.Geometry.wasm_shape(s),
    )!;
    return WASMCompatability.Geometry.shape_from_wasm(res) as E;
}
