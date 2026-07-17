import {
    FiniteGeometry,
    LineSegment,
    Polygon,
    Polyline,
    Vector,
} from "@/Core/geometry";
import {
    WASMGeometry,
    WASMGeometryCollection,
    WASMGeometryType,
} from "Rust/exports";
import { Allocations } from "../index";
import {
    polygon_from_wasm,
    polyline_from_wasm,
    wasm_polygon,
    wasm_polyline,
} from "./shapes";
import { vector_from_wasm } from "./vectors";

export function wasm_geometry(s: FiniteGeometry.FiniteGeometry): WASMGeometry {
    if (s instanceof Vector) {
        return Allocations.allocate(WASMGeometry.from_vector_xy(s.x, s.y));
    }

    if (s instanceof Polygon) {
        return Allocations.convert(wasm_polygon(s), (g) =>
            WASMGeometry.from_polygon(g),
        );
    }

    if (s instanceof Polyline) {
        return Allocations.convert(wasm_polyline(s), (l) =>
            WASMGeometry.from_polyline(l),
        );
    }

    return Allocations.convert(
        wasm_polyline(new Polyline(s as LineSegment)),
        (l) => WASMGeometry.from_polyline(l),
    );
}

export function wasm_geometry_collection(
    geoms: (Polygon | Polyline | Vector)[],
): WASMGeometryCollection {
    const col = Allocations.allocate(
        WASMGeometryCollection.with_capacity(geoms.length),
    );
    for (let i = 0; i < geoms.length; i++) {
        Allocations.consume(wasm_geometry(geoms[i]!), (g) => {
            col.push(g);
        });
    }

    return col;
}

export function geometry_from_wasm(
    sh: WASMGeometry,
): Polygon | Polyline | Vector {
    return Allocations.consume(sh, (sh) => {
        const t = sh.geometry_type();

        if (t == WASMGeometryType.Vector) {
            return vector_from_wasm(
                Allocations.convert(sh, (sh) => sh.into_vector()!),
            );
        }

        if (t == WASMGeometryType.Polygon) {
            return polygon_from_wasm(
                Allocations.convert(sh, (sh) => sh.into_polygon()!),
            );
        }

        return polyline_from_wasm(
            Allocations.convert(sh, (sh) => sh.into_polyline()!),
        );
    });
}

export function geometry_collection_from_wasm(
    col: WASMGeometryCollection,
): (Polyline | Polygon | Vector)[] {
    const res: (Polygon | Polyline | Vector)[] = [];

    while (col.len() > 0) {
        res.push(geometry_from_wasm(col.pop()!));
    }

    Allocations.free(col);
    res.reverse();
    return res;
}
