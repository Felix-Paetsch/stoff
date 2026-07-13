import { Shape } from "@/Core/geometry";
import { WASMShapePosition } from "Rust/exports";
import { Allocations } from "../index";
import { vector_from_wasm } from "./vectors";

export function wasm_shape_position(v: Shape.ShapePosition): WASMShapePosition {
    return Allocations.allocate(
        WASMShapePosition.new(v.index, v.frac, v.vec.x, v.vec.y),
    );
}

export function shape_position_from_wasm(
    v: WASMShapePosition,
): Shape.ShapePosition {
    return Allocations.free_after_use(v, (v) => {
        return {
            index: v.index(),
            frac: v.fraction(),
            vec: vector_from_wasm(v.vec()),
        };
    });
}
