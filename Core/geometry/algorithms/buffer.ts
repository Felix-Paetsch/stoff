import {
    wasm_geometry_buffer_geometries_with_style,
    WASMCompatability,
} from "Rust/exports";
import { FiniteGeometry } from "../finite_geometry";
import { Polygon } from "../shape/polygon";
import { as_shape } from "../utils/misc";

export type BufferLineJoinStyle =
    | "bevel"
    | "miter"
    | "round"
    | ["miter", number]
    | ["round", number];
export type BufferLineCapStyle =
    | "butt"
    | "round"
    | "square"
    | ["round", number];

export function buffer(
    what: FiniteGeometry[],
    distance: number,
    joinstyle: BufferLineJoinStyle = "round",
    capstyle: BufferLineCapStyle = "round",
) {
    const shapes = what.map((s) => as_shape(s));

    const [line_join_number, line_join_value] =
        bufferLineJoinStyle_to_number(joinstyle);
    const [line_cap_number, line_cap_value] =
        bufferLineCapStyle_to_number(capstyle);

    const col = WASMCompatability.Geometry.wasm_geometry_collection(shapes);

    const buffer_res = WASMCompatability.Allocations.allocate(
        wasm_geometry_buffer_geometries_with_style(
            col,
            distance,
            line_join_number,
            line_join_value,
            line_cap_number,
            line_cap_value,
        )!,
    );

    WASMCompatability.Allocations.free(col);
    const res =
        WASMCompatability.Geometry.shape_collection_from_wasm(buffer_res);
    return res as Polygon[];
}

function bufferLineJoinStyle_to_number(
    b: BufferLineJoinStyle,
): [number, number] {
    if (b == "bevel") {
        return [1, NaN];
    }

    if (b == "round") {
        b = ["round", 0.2];
    }

    if (b == "miter") {
        b = ["miter", 1];
    }

    return [b[0] == "miter" ? 2 : 0, b[1]];
}

function bufferLineCapStyle_to_number(b: BufferLineCapStyle): [number, number] {
    if (b == "butt") {
        return [1, NaN];
    }

    if (b == "square") {
        return [2, NaN];
    }

    if (b == "round") {
        b = ["round", 0.2];
    }

    return [0, b[1]];
}
