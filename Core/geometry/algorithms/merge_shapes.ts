import { wasm_geometry_merge_shapes, WASMCompatability } from "Rust/exports";
import { Polyline } from "../shape/polyline";
import { Shape } from "../shape/shape";

export function merge_shapes(shapes: Shape[]): Shape.Shape {
    if (shapes.length == 0) return Polyline.empty();

    let serialized = WASMCompatability.Geometry.geometry_vec_to_vecf64(
        shapes as Shape.Shape[],
    );

    let merged = wasm_geometry_merge_shapes(serialized);
    return WASMCompatability.Geometry.vecf64_to_geometry(merged) as Shape.Shape;
}
