import { Polyline, Shape } from "@/Core/geometry";
import {
    wasm_advanced_double_run_merge_shapes,
    WASMCompatability,
} from "Rust/exports";

export type DoubleRunMergeShapesConfig = {
    // If the next possible merge is larger than this we stop merging
    max_merge_distance: number;
    // If there are at most so many lines left we stop merging
    line_amount: number;
};

export function double_run_merge_shapes(shapes: Shape[]): Shape.Shape {
    const res = double_run_merge_shapes_advanced(shapes);
    if (res.length == 0) {
        return Polyline.empty();
    }
    return res[0]!;
}

export function double_run_merge_shapes_advanced(
    shapes: Shape[],
    cfg: Partial<DoubleRunMergeShapesConfig> = {},
): Shape.Shape[] {
    const non_empty_shapes = shapes.filter((s) => !s.is_empty());
    if (non_empty_shapes.length == 0) return [];

    let wasm_shapes = WASMCompatability.Geometry.wasm_shape_collection(
        non_empty_shapes as Shape.Shape[],
    );

    let merged = WASMCompatability.Allocations.free_after_use(
        wasm_shapes,
        (wasm_shapes) =>
            WASMCompatability.Allocations.allocate(
                wasm_advanced_double_run_merge_shapes(
                    wasm_shapes,
                    cfg.max_merge_distance,
                    cfg.line_amount,
                ),
            ),
    );

    return WASMCompatability.Geometry.shape_collection_from_wasm(merged);
}
