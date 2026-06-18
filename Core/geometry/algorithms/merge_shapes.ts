import { Polyline } from "@/Core/geometry";
import { Expect } from "Core/expect";
import {
    wasm_geometry_merge_shapes_advanced,
    WASMCompatability,
} from "Rust/exports";
import { Shape } from "../shape/shape";

export type MergeShapesConfig = {
    // If the next possible merge is larger than this we stop merging
    max_merge_distance: number;
    // If there are at most so many lines left we stop merging
    line_amount: number;
    // [Line Number, whether p1 or p2 cant be merged]
    fixed_endpoints: [number, "p1" | "p2" | boolean][];
};

export function merge_shapes(shapes: Shape[]): Shape.Shape {
    const serialized = WASMCompatability.Geometry.geometry_vec_to_vecf64(
        shapes.filter((s) => !s.is_empty()) as Shape.Shape[],
    );

    const merged = wasm_geometry_merge_shapes_advanced(
        serialized,
        undefined,
        undefined,
        new Uint32Array(),
    );

    const res = WASMCompatability.Geometry.vecf64_to_geometry_vec(
        merged,
    ) as Shape.Shape[];

    if (res.length == 0) {
        return Polyline.empty();
    }
    return res[0]!;
}

export function merge_shapes_advanced(
    shapes: Shape[],
    cfg: Partial<MergeShapesConfig> = {},
): Shape.Shape[] {
    let fixed_endpoints = cfg.fixed_endpoints || [];

    Expect.that(() => {
        fixed_endpoints.every(([p, _]) => !shapes[p]!.is_empty());
    });

    let non_empty_shapes = shapes;
    if (shapes.some((s) => s.is_empty())) {
        let non_empty_shapes_with_index = shapes
            .map((s, i) => [s, i] as [Shape.Shape, number])
            .filter((s) => !s[0].is_empty());

        fixed_endpoints = fixed_endpoints.map((p) => [
            non_empty_shapes_with_index.findIndex((s) => s[1] == p[0]),
            p[1],
        ]);
    }

    if (non_empty_shapes.length == 0) return [];

    let serialized = WASMCompatability.Geometry.geometry_vec_to_vecf64(
        non_empty_shapes as Shape.Shape[],
    );

    let merged = wasm_geometry_merge_shapes_advanced(
        serialized,
        cfg.max_merge_distance,
        cfg.line_amount,
        Uint32Array.from(
            (cfg.fixed_endpoints || []).flatMap((e) => [
                e[0],
                e[1] === "p1" || e[1] === true ? 0 : 1,
            ]),
        ),
    );
    return WASMCompatability.Geometry.vecf64_to_geometry_vec(
        merged,
    ) as Shape.Shape[];
}
