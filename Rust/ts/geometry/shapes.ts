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
        return Allocations.convert(wasm_polyline(s), (l) =>
            WASMShape.from_polyline(l),
        );
    }

    return Allocations.convert(wasm_polygon(s), (g) =>
        WASMShape.from_polygon(g),
    );
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
        const as_line = Allocations.convert(sh, (sh) => sh.into_polyline()!);
        return polyline_from_wasm(as_line);
    }

    const as_gon = Allocations.convert(sh, (sh) => sh.into_polygon()!);
    return polygon_from_wasm(as_gon);
}

export function shape_collection_from_wasm(
    col: WASMShapeCollection,
): Shape.Shape[] {
    const res: Shape.Shape[] = [];

    while (col.len() > 0) {
        const poped = Allocations.allocate(col.pop()!);
        res.push(shape_from_wasm(poped));
    }

    Allocations.free(col);
    res.reverse();
    return res;
}
