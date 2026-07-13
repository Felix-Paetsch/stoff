import { Polygon, Polyline, Shape } from "@/Core/geometry";
import {
    WASMPolygon,
    WASMPolyline,
    WASMShape,
    WASMShapeCollection,
} from "Rust/exports";
import { Allocations } from "../index";
import { wasm_vector_vec } from "./vectors";

export function wasm_polygon(s: Polygon): WASMPolygon {
    return Allocations.convert(wasm_vector_vec(s.vertices), (vv) =>
        WASMPolygon.new(vv),
    );
}

export function wasm_polyline(l: Polyline): WASMPolyline {
    return Allocations.convert(wasm_vector_vec(l.vertices), (vv) =>
        WASMPolyline.new(vv),
    );
}

export function wasm_shape(s: Shape.Shape): WASMShape {
    if (s instanceof Polyline) {
        return WASMShape.from_polyline(wasm_polyline(s));
    }

    return WASMShape.from_polygon(wasm_polygon(s));
}

export function wasm_shape_collection(
    shapes: Shape.Shape[],
): WASMShapeCollection {
    const col = Allocations.allocate(
        WASMShapeCollection.with_capacity(shapes.length),
    );
    for (let i = 0; i < shapes.length; i++) {
        Allocations.consume(wasm_shape(shapes[i]!), (sh) => col.push(sh));
    }

    return col;
}

export function polygon_from_wasm(sh: WASMPolygon): Polygon {
    return Allocations.consume(
        sh,
        (sh) => new Polygon(sh.into_vertices().into_float64_vec()),
    );
}

export function polyline_from_wasm(sh: WASMPolyline): Polyline {
    return Allocations.consume(
        sh,
        (sh) => new Polyline(sh.into_vertices().into_float64_vec()),
    );
}

export function shape_from_wasm(sh: WASMShape): Shape.Shape {
    if (sh.is_polyline()) {
        return polyline_from_wasm(sh.into_polyline()!);
    }

    return polygon_from_wasm(sh.into_polygon()!);
}

export function shape_collection_from_wasm(
    col: WASMShapeCollection,
): Shape.Shape[] {
    const res: Shape.Shape[] = [];

    while (col.len() > 0) {
        res.push(shape_from_wasm(col.pop()!));
    }

    Allocations.free(col);
    res.reverse();
    return res;
}
