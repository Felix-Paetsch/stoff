import { Polyline } from "@/Core/geometry";
import {
    wasm_geometry_double_run_merge_shapes_advanced,
    WASMCompatability
} from "Rust/exports";
import { Shape } from "../shape/shape";

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

    let serialized = WASMCompatability.Geometry.geometry_vec_to_vecf64(
        non_empty_shapes as Shape.Shape[],
    );

    let merged = wasm_geometry_double_run_merge_shapes_advanced(
        serialized,
        cfg.max_merge_distance,
        cfg.line_amount,
    );
    return WASMCompatability.Geometry.vecf64_to_geometry_vec(
        merged,
    ) as Shape.Shape[];
}
