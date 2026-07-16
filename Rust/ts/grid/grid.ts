import { InternalGrid } from "Core/grid/types";
import { WASMGrid, WASMGridType } from "Rust/exports";
import { Allocations } from "../index";
import { boolean_grid_from_wasm, wasm_boolean_grid } from "./boolean_grid";
import { matrix_grid_from_wasm, wasm_matrix_grid } from "./matrix_grid";
import {
    number_grid_from_wasm,
    number_grid_from_wasm_u8_grid,
    wasm_number_grid,
} from "./number_grid";
import {
    vec3_grid_from_wasm,
    vec3_grid_from_wasm_vec3u8_grid,
    wasm_vec3_grid,
} from "./vec3_grid";
import { vector_grid_from_wasm, wasm_vector_grid } from "./vector_grid";

export function wasm_grid(g: InternalGrid): WASMGrid {
    if (g.type == "number") {
        return Allocations.convert(wasm_number_grid(g), (g) =>
            WASMGrid.from_f64_grid(g),
        );
    }

    if (g.type == "boolean") {
        return Allocations.convert(wasm_boolean_grid(g), (g) =>
            WASMGrid.from_bool_grid(g),
        );
    }

    if (g.type == "vec3") {
        return Allocations.convert(wasm_vec3_grid(g), (g) =>
            WASMGrid.from_vec3f64_grid(g),
        );
    }

    if (g.type == "vector") {
        return Allocations.convert(wasm_vector_grid(g), (g) =>
            WASMGrid.from_vector_grid(g),
        );
    }

    if (g.type == "matrix") {
        return Allocations.convert(wasm_matrix_grid(g), (g) =>
            WASMGrid.from_matrix_grid(g),
        );
    }

    throw new Error("Unreachable");
}

export function grid_from_wasm(g: WASMGrid): InternalGrid {
    const type = g.grid_type();

    if (type == WASMGridType.Boolean) {
        const conv = Allocations.convert(
            g,
            (g) => g.try_into_wasm_bool_grid()!,
        );
        return boolean_grid_from_wasm(conv);
    }

    if (type == WASMGridType.Vec3Float64) {
        const conv = Allocations.convert(
            g,
            (g) => g.try_into_wasm_vec3f64_grid()!,
        );
        return vec3_grid_from_wasm(conv);
    }

    if (type == WASMGridType.Vector) {
        const conv = Allocations.convert(
            g,
            (g) => g.try_into_wasm_vector_grid()!,
        );
        return vector_grid_from_wasm(conv);
    }

    if (type == WASMGridType.U8) {
        const conv = Allocations.convert(g, (g) => g.try_into_wasm_u8_grid()!);
        return number_grid_from_wasm_u8_grid(conv);
    }

    if (type == WASMGridType.Vec3U8) {
        const conv = Allocations.convert(
            g,
            (g) => g.try_into_wasm_vec3u8_grid()!,
        );
        return vec3_grid_from_wasm_vec3u8_grid(conv);
    }

    if (type == WASMGridType.Matrix) {
        const conv = Allocations.convert(
            g,
            (g) => g.try_into_wasm_matrix_grid()!,
        );
        return matrix_grid_from_wasm(conv);
    }

    if (type == WASMGridType.Float64) {
        const conv = Allocations.convert(g, (g) => g.try_into_wasm_f64_grid()!);
        return number_grid_from_wasm(conv);
    }

    throw new Error("Unexpected grid type");
}
